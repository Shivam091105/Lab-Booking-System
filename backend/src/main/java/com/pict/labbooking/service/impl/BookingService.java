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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * Core service handling the full booking lifecycle:
 * submission → approval workflow → final status update.
 *
 * NOTE: All repository calls that filter by status pass enum values
 * as List<BookingStatus> parameters — required for Hibernate 6 / Spring Boot 3.x
 * compatibility (fully-qualified enum paths in JPQL are not supported).
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

    /** @Lazy breaks the BookingService ↔ OverrideEventService circular bean dependency */
    @Lazy
    @Autowired
    private OverrideEventService overrideEventService;

    // ── Shared status lists (reused across methods) ───────────────────────────
    private static final List<BookingStatus> ACTIVE_STATUSES = List.of(
            BookingStatus.APPROVED, BookingStatus.IN_REVIEW, BookingStatus.PENDING);

    private static final List<BookingStatus> DISPLAY_STATUSES = List.of(
            BookingStatus.APPROVED, BookingStatus.IN_REVIEW,
            BookingStatus.PENDING, BookingStatus.OVERRIDDEN);

    private static final AtomicInteger counter = new AtomicInteger(1);

    // ─── Submit ───────────────────────────────────────────────────────────────

    @Transactional
    public BookingResponse submitBooking(BookingRequestDto dto, String requesterUsername) {
        // Validate date/time first
        if (dto.getBookingDate().isBefore(LocalDate.now())) {
            throw new IllegalStateException("Booking date cannot be in the past");
        }
        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new IllegalStateException("End time must be after start time");
        }

        User requester = userRepo.findByUsername(requesterUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + requesterUsername));

        List<Lab> labs = dto.getLabIds().stream()
                .map(id -> labRepo.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("Lab", id)))
                .collect(Collectors.toList());

        // ── Double-booking check (passes enum list as param — Hibernate 6 safe) ──
        for (Lab lab : labs) {
            List<BookingRequest> conflicts = bookingRepo.findConflictingBookings(
                    lab, dto.getBookingDate(), dto.getStartTime(), dto.getEndTime(),
                    ACTIVE_STATUSES);
            if (!conflicts.isEmpty()) {
                throw new BookingConflictException(
                        "Lab " + lab.getRoomNumber() + " is already booked during the requested time slot.");
            }
        }

        // ── Override event validation ─────────────────────────────────────────
        List<Long> requestedLabIds = labs.stream().map(Lab::getId).collect(Collectors.toList());
        List<OverrideEvent> overrideConflicts = overrideEventService.findConflictingOverrides(
                requestedLabIds, dto.getBookingDate(), dto.getStartTime(), dto.getEndTime());

        if (!overrideConflicts.isEmpty()) {
            OverrideEvent blocker = overrideConflicts.get(0);
            boolean isStudentRole = requester.getRoles().contains(RoleName.STUDENT)
                    || requester.getRoles().contains(RoleName.CLUB_MANAGER);

            // RULE 1: Students/Club Managers in affected divisions cannot book
            if (isStudentRole && blocker.affectsDivision(requester.getDivision())) {
                throw new BookingConflictException(
                        "Cannot book during '" + blocker.getTitle()
                        + "' — a mandatory override event has blocked this time for your division ("
                        + requester.getDivision() + ").");
            }

            // RULE 2 & 3: Faculty can book but NOT for affected divisions
            if (!isStudentRole) {
                String div = dto.getDivision();
                if (div != null && !div.isBlank() && blocker.affectsDivision(div)) {
                    throw new BookingConflictException(
                            "Cannot book for division '" + div + "' during '" + blocker.getTitle()
                            + "' — that division must attend a mandatory event.");
                }
            }
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

        List<Approval> chain = buildApprovalChain(dto.getRequestType(), booking);
        booking.setApprovals(chain);

        BookingRequest saved = bookingRepo.save(booking);
        log.info("Booking {} submitted by {}", refNum, requesterUsername);
        emailService.notifyApprovers(saved);

        return mapper.toBookingResponse(saved);
    }

    // ─── Approval ─────────────────────────────────────────────────────────────

    @Transactional
    public BookingResponse processApproval(Long bookingId, ApprovalActionRequest actionRequest,
                                           String approverUsername) {
        BookingRequest booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("BookingRequest", bookingId));

        User approver = userRepo.findByUsername(approverUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + approverUsername));

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
            log.info("Booking {} rejected by {}", booking.getReferenceNumber(), approverUsername);
        } else {
            applyApprovalRules(booking, pendingApproval);
        }

        BookingRequest updated = bookingRepo.save(booking);
        emailService.notifyStatusUpdate(updated);
        return mapper.toBookingResponse(updated);
    }

    private void applyApprovalRules(BookingRequest booking, Approval currentApproval) {
        RequestType type = booking.getRequestType();
        RoleName role = currentApproval.getApproverRole();

        if (type == RequestType.EXTRA_CLASS) {
            if (role == RoleName.PROFESSOR || role == RoleName.CLASS_COORDINATOR || role == RoleName.HOD) {
                autoApproveRemaining(booking, "Auto-approved: " + role + " approved");
                booking.setStatus(BookingStatus.APPROVED);
                log.info("Booking {} auto-approved by {}", booking.getReferenceNumber(), role);
            } else {
                advanceToNextOrFinish(booking);
            }
        } else {
            // CLUB_EVENT / MULTI_LAB_EVENT — higher authority auto-approves lower pending steps
            int currentOrder = currentApproval.getApprovalOrder();
            booking.getApprovals().stream()
                    .filter(a -> a.getApprovalOrder() < currentOrder
                            && a.getStatus() == ApprovalStatus.PENDING)
                    .forEach(a -> {
                        a.setStatus(ApprovalStatus.APPROVED);
                        a.setIsAutoApproved(true);
                        a.setComments("Auto-approved by higher authority: " + role);
                        a.setActedAt(LocalDateTime.now());
                    });

            boolean allDone = booking.getApprovals().stream()
                    .allMatch(a -> a.getStatus() == ApprovalStatus.APPROVED
                            || a.getStatus() == ApprovalStatus.SKIPPED);
            if (allDone) {
                booking.setStatus(BookingStatus.APPROVED);
                log.info("Booking {} fully approved", booking.getReferenceNumber());
            }
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

    // ─── Approval chain builder ───────────────────────────────────────────────

    private List<Approval> buildApprovalChain(RequestType type, BookingRequest booking) {
        List<Approval> chain = new ArrayList<>();
        Set<RoleName> roles = booking.getRequester().getRoles();
        boolean isFaculty = roles.contains(RoleName.PROFESSOR)
                || roles.contains(RoleName.CLASS_COORDINATOR);

        if (type == RequestType.EXTRA_CLASS) {
            chain.add(newApproval(booking, RoleName.LAB_ASSISTANT, 1));
            if (isFaculty) {
                chain.add(newApproval(booking, RoleName.HOD, 2));
            } else {
                chain.add(newApproval(booking, RoleName.PROFESSOR, 2));
                chain.add(newApproval(booking, RoleName.CLASS_COORDINATOR, 3));
            }
        } else {
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

    // ─── Queries ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<BookingResponse> getMyBookings(String username) {
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapper.toBookingResponseList(bookingRepo.findByRequesterId(user.getId()));
    }

    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long id) {
        return mapper.toBookingResponse(bookingRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("BookingRequest", id)));
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return mapper.toBookingResponseList(bookingRepo.findAll());
    }

    @Transactional(readOnly = true)
    public List<BookingResponse> getPendingApprovalsForRole(RoleName role) {
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

    @Transactional(readOnly = true)
    public Map<String, Long> getStatusCounts() {
        Map<String, Long> counts = new HashMap<>();
        bookingRepo.countGroupedByStatus().forEach(row ->
                counts.put(row[0].toString(), (Long) row[1]));
        return counts;
    }

    /**
     * Used by LabService — fetch all non-cancelled bookings for a lab on a date
     * for calendar display (includes PENDING, IN_REVIEW, APPROVED, OVERRIDDEN).
     */
    @Transactional(readOnly = true)
    public List<BookingRequest> getBookingsForLabOnDate(Long labId, java.time.LocalDate date) {
        return bookingRepo.findBookingsForLabOnDateWithStatuses(labId, date, DISPLAY_STATUSES);
    }

    private String generateReferenceNumber() {
        String year = String.valueOf(java.time.Year.now().getValue());
        return String.format("LB-%s-%04d", year, counter.getAndIncrement());
    }
}
