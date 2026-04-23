package com.pict.labbooking.service.impl;

import com.pict.labbooking.dto.request.ApprovalActionRequest;
import com.pict.labbooking.dto.request.BookingRequestDto;
import com.pict.labbooking.dto.response.BookingResponse;
import com.pict.labbooking.entity.*;
import com.pict.labbooking.entity.Approval.ApprovalStatus;
import com.pict.labbooking.entity.BookingRequest.BookingStatus;
import com.pict.labbooking.entity.BookingRequest.RequestType;
import com.pict.labbooking.exception.BookingConflictException;
import com.pict.labbooking.exception.ResourceNotFoundException;
import com.pict.labbooking.repository.*;
import com.pict.labbooking.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Core service handling the full booking lifecycle:
 * submission → approval workflow → final status update.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRequestRepository bookingRepo;
    private final ApprovalRepository approvalRepo;
    private final LabRepository labRepo;
    private final UserRepository userRepo;
    private final MapperUtil mapper;
    private final EmailService emailService;

    // ─── Reference Number Counter (simple; use a DB sequence in prod) ───────
    private static final AtomicInteger counter = new AtomicInteger(1);

    // ─── Submit ──────────────────────────────────────────────────────────────

    /**
     * Validates the request, checks for conflicts, persists the booking,
     * then builds and persists the appropriate approval workflow.
     */
    @Transactional
    public BookingResponse submitBooking(BookingRequestDto dto, String requesterUsername) {
        User requester = userRepo.findByUsername(requesterUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requesterUsername));

        List<Lab> labs = dto.getLabIds().stream()
                .map(id -> labRepo.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Lab", id)))
                .collect(Collectors.toList());

        // Conflict check for each requested lab
        for (Lab lab : labs) {
            List<BookingRequest> conflicts = bookingRepo.findConflictingBookings(
                    lab, dto.getBookingDate(), dto.getStartTime(), dto.getEndTime());
            if (!conflicts.isEmpty()) {
                throw new BookingConflictException(
                        "Lab " + lab.getRoomNumber() + " is already booked during the requested time slot.");
            }
        }

        // Validate time range
        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new IllegalStateException("End time must be after start time");
        }

        String refNum = generateReferenceNumber();

        BookingRequest booking = BookingRequest.builder()
                .referenceNumber(refNum)
                .requester(requester)
                .requestType(dto.getRequestType())
                .bookingDate(dto.getBookingDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .purpose(dto.getPurpose())
                .expectedAttendees(dto.getExpectedAttendees())
                .clubName(dto.getClubName())
                .eventName(dto.getEventName())
                .additionalRequirements(dto.getAdditionalRequirements())
                .labs(labs)
                .division(dto.getDivision())
                .status(BookingStatus.IN_REVIEW)
                .build();

        // Build approval chain based on request type
        List<Approval> approvalChain = buildApprovalChain(dto.getRequestType(), booking);
        booking.setApprovals(approvalChain);

        BookingRequest saved = bookingRepo.save(booking);
        log.info("Booking {} submitted by {}", refNum, requesterUsername);

        // Notify first approver asynchronously
        emailService.notifyApprovers(saved);

        return mapper.toBookingResponse(saved);
    }

    // ─── Approval Action ─────────────────────────────────────────────────────

    /**
     * Processes an approver's APPROVE or REJECT action.
     *
     * Rules:
     *  - REJECT at any level → booking is REJECTED
     *  - APPROVE at Professor/CC level (CASE 1) → booking auto-approved
     *  - APPROVE at any level in CASE 2 → auto-approve all lower pending steps
     */
    @Transactional
    public BookingResponse processApproval(Long bookingId, ApprovalActionRequest actionRequest,
                                           String approverUsername) {
        BookingRequest booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("BookingRequest", bookingId));

        User approver = userRepo.findByUsername(approverUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + approverUsername));

        // Find the pending approval step for this approver's role
        Approval pendingApproval = booking.getApprovals().stream()
                .filter(a -> a.getStatus() == ApprovalStatus.PENDING
                        && approver.getRoles().contains(a.getApproverRole()))
                .min(Comparator.comparingInt(Approval::getApprovalOrder))
                .orElseThrow(() -> new IllegalStateException(
                        "No pending approval step found for your role on this booking"));

        pendingApproval.setApprover(approver);
        pendingApproval.setStatus(actionRequest.getAction());
        pendingApproval.setComments(actionRequest.getComments());
        pendingApproval.setActedAt(LocalDateTime.now());

        if (actionRequest.getAction() == ApprovalStatus.REJECTED) {
            booking.setStatus(BookingStatus.REJECTED);
            booking.setRejectionReason(actionRequest.getComments());
            log.info("Booking {} rejected by {} ({})", booking.getReferenceNumber(),
                    approverUsername, approver.getRoles());
        } else {
            // APPROVED path
            applyApprovalRules(booking, pendingApproval, approver);
        }

        BookingRequest updated = bookingRepo.save(booking);
        emailService.notifyStatusUpdate(updated);
        return mapper.toBookingResponse(updated);
    }

    /**
     * Applies hierarchical approval rules:
     * - CASE 1 (EXTRA_CLASS): Professor or CC approval → auto approve
     * - CASE 2 (MULTI_LAB / CLUB_EVENT): higher authority → auto-approve lowers
     */
    private void applyApprovalRules(BookingRequest booking, Approval currentApproval, User approver) {
        RequestType type = booking.getRequestType();

        if (type == RequestType.EXTRA_CLASS) {
            // If Professor OR Class Coordinator approves → auto-approve entire request
            RoleName role = currentApproval.getApproverRole();
            if (role == RoleName.PROFESSOR || role == RoleName.CLASS_COORDINATOR) {
                autoApproveRemaining(booking, "Auto-approved: " + role + " approved the request");
                booking.setStatus(BookingStatus.APPROVED);
                log.info("Booking {} auto-approved by {}", booking.getReferenceNumber(), role);
            } else {
                // Lab Assistant approved (optional); check if a higher approver has already approved
                advanceToNextOrFinish(booking);
            }
        } else {
            // MULTI_LAB_EVENT or CLUB_EVENT — higher authority auto-approves lower levels
            // Auto-approve all lower-order pending approvals
            int currentOrder = currentApproval.getApprovalOrder();
            booking.getApprovals().stream()
                    .filter(a -> a.getApprovalOrder() < currentOrder && a.getStatus() == ApprovalStatus.PENDING)
                    .forEach(a -> {
                        a.setStatus(ApprovalStatus.APPROVED);
                        a.setIsAutoApproved(true);
                        a.setComments("Auto-approved by higher authority: " + currentApproval.getApproverRole());
                        a.setActedAt(LocalDateTime.now());
                    });

            // Check if this was the final approval step
            boolean allApproved = booking.getApprovals().stream()
                    .allMatch(a -> a.getStatus() == ApprovalStatus.APPROVED
                            || a.getStatus() == ApprovalStatus.SKIPPED);
            if (allApproved) {
                booking.setStatus(BookingStatus.APPROVED);
                log.info("Booking {} fully approved", booking.getReferenceNumber());
            }
            // else remains IN_REVIEW — waiting for higher approvals
        }
    }

    private void autoApproveRemaining(BookingRequest booking, String reason) {
        booking.getApprovals().stream()
                .filter(a -> a.getStatus() == ApprovalStatus.PENDING)
                .forEach(a -> {
                    a.setStatus(ApprovalStatus.APPROVED);
                    a.setIsAutoApproved(true);
                    a.setComments(reason);
                    a.setActedAt(LocalDateTime.now());
                });
    }

    private void advanceToNextOrFinish(BookingRequest booking) {
        boolean anyPending = booking.getApprovals().stream()
                .anyMatch(a -> a.getStatus() == ApprovalStatus.PENDING);
        if (!anyPending) {
            booking.setStatus(BookingStatus.APPROVED);
        }
    }

    // ─── Approval Chain Builder ───────────────────────────────────────────────

    /**
     * Builds ordered approval steps based on request type.
     *
     * CASE 1 (EXTRA_CLASS):
     *   Order 1 → LAB_ASSISTANT (optional/informational)
     *   Order 2 → PROFESSOR
     *   Order 3 → CLASS_COORDINATOR
     *
     * CASE 2 (CLUB_EVENT / MULTI_LAB_EVENT):
     *   Order 1 → LAB_ASSISTANT
     *   Order 2 → CLUB_MANAGER (acting as coordinator)
     *   Order 3 → PROFESSOR
     *   Order 4 → HOD
     *   Order 5 → PRINCIPAL
     */
    private List<Approval> buildApprovalChain(RequestType type, BookingRequest booking) {
        List<Approval> chain = new ArrayList<>();

        if (type == RequestType.EXTRA_CLASS) {
            chain.add(newApproval(booking, RoleName.LAB_ASSISTANT, 1));
            chain.add(newApproval(booking, RoleName.PROFESSOR, 2));
            chain.add(newApproval(booking, RoleName.CLASS_COORDINATOR, 3));
        } else {
            // CLUB_EVENT or MULTI_LAB_EVENT
            chain.add(newApproval(booking, RoleName.LAB_ASSISTANT, 1));
            chain.add(newApproval(booking, RoleName.CLUB_MANAGER, 2));
            chain.add(newApproval(booking, RoleName.PROFESSOR, 3));
            chain.add(newApproval(booking, RoleName.HOD, 4));
            chain.add(newApproval(booking, RoleName.PRINCIPAL, 5));
        }
        return chain;
    }

    private Approval newApproval(BookingRequest booking, RoleName role, int order) {
        return Approval.builder()
                .bookingRequest(booking)
                .approverRole(role)
                .approvalOrder(order)
                .status(ApprovalStatus.PENDING)
                .isAutoApproved(false)
                .build();
    }

    // ─── Queries ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(String username) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapper.toBookingResponseList(bookingRepo.findByRequesterId(user.getId()));
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id) {
        return mapper.toBookingResponse(
                bookingRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("BookingRequest", id)));
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return mapper.toBookingResponseList(bookingRepo.findAll());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getPendingApprovalsForRole(RoleName role) {
        // Find approvals pending for this role
        List<Approval> pending = approvalRepo.findByApproverRoleAndStatus(role, ApprovalStatus.PENDING);
        List<Long> bookingIds = pending.stream()
                .map(a -> a.getBookingRequest().getId())
                .distinct()
                .collect(Collectors.toList());
        return bookingIds.stream()
                .map(id -> bookingRepo.findById(id).orElse(null))
                .filter(Objects::nonNull)
                .map(mapper::toBookingResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponse cancelBooking(Long id, String username) {
        BookingRequest booking = bookingRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BookingRequest", id));
        if (!booking.getRequester().getUsername().equals(username)) {
            throw new IllegalStateException("You can only cancel your own bookings");
        }
        if (booking.getStatus() == BookingStatus.APPROVED) {
            throw new IllegalStateException("Cannot cancel an already approved booking");
        }
        booking.setStatus(BookingStatus.CANCELLED);
        return mapper.toBookingResponse(bookingRepo.save(booking));
    }

    // Analytics
    @Transactional(readOnly = true)
    public Map<String, Long> getStatusCounts() {
        Map<String, Long> counts = new HashMap<>();
        bookingRepo.countGroupedByStatus().forEach(row ->
                counts.put(row[0].toString(), (Long) row[1]));
        return counts;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String generateReferenceNumber() {
        String year = String.valueOf(java.time.Year.now().getValue());
        return String.format("LB-%s-%04d", year, counter.getAndIncrement());
    }
}
