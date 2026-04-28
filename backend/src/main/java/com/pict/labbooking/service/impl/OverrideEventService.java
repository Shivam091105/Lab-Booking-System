package com.pict.labbooking.service.impl;

import com.pict.labbooking.dto.request.CreateOverrideEventRequest;
import com.pict.labbooking.dto.response.OverrideEventResponse;
import com.pict.labbooking.entity.*;
import com.pict.labbooking.entity.BookingRequest.BookingStatus;
import com.pict.labbooking.entity.OverrideEvent.OverrideType;
import com.pict.labbooking.exception.ResourceNotFoundException;
import com.pict.labbooking.repository.*;
import com.pict.labbooking.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Manages the full lifecycle of OverrideEvents.
 *
 * CORE RESPONSIBILITIES:
 *  1. Create override events (HOD/Principal only — enforced at controller)
 *  2. When created: mark affected TimetableSlots as overridden
 *  3. When created: mark affected BookingRequests as OVERRIDDEN
 *  4. Expose override-aware availability for the booking validation layer
 *  5. Deactivate events (restores slots and bookings)
 *
 * VALIDATION RULES (applied in BookingService, checked via public helpers here):
 *  RULE 1 — Students in affected divisions CANNOT book during override window
 *  RULE 2 — Professors CAN book but NOT for affected divisions
 *  RULE 3 — If a booking includes affected students → REJECT with message
 *  RULE 4 — Normal double-booking check still applies
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OverrideEventService {

    private final OverrideEventRepository overrideRepo;
    private final LabRepository labRepo;
    private final UserRepository userRepo;
    private final TimetableSlotRepository slotRepo;
    private final BookingRequestRepository bookingRepo;
    private final MapperUtil mapper;

    // ─── Priority mapping ─────────────────────────────────────────────────
    private static final Map<RoleName, Integer> ROLE_PRIORITY = Map.of(
        RoleName.HOD, 4,
        RoleName.PRINCIPAL, 5
    );

    // ─── Create ───────────────────────────────────────────────────────────

    /**
     * Creates an OverrideEvent, then propagates its effects:
     *  (a) Marks affected TimetableSlots as overridden
     *  (b) Marks affected BookingRequests as OVERRIDDEN
     * Returns a response with counts of what was affected.
     */
    @Transactional
    public OverrideEventResponse createOverrideEvent(CreateOverrideEventRequest req, String creatorUsername) {
        User creator = userRepo.findByUsername(creatorUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + creatorUsername));

        // Resolve priority from creator's highest role
        int priority = creator.getRoles().stream()
                .mapToInt(r -> ROLE_PRIORITY.getOrDefault(r, 0))
                .max()
                .orElseThrow(() -> new IllegalStateException("Insufficient role to create override events"));

        if (priority == 0) {
            throw new IllegalStateException("Only HOD or Principal can create override events");
        }

        // Validate time range
        if (!req.getEndTime().isAfter(req.getStartTime())) {
            throw new IllegalStateException("End time must be after start time");
        }

        // Resolve affected labs
        List<Lab> affectedLabs = new ArrayList<>();
        if (req.getAffectedLabIds() != null && !req.getAffectedLabIds().isEmpty()) {
            affectedLabs = req.getAffectedLabIds().stream()
                    .map(id -> labRepo.findById(id)
                            .orElseThrow(() -> new ResourceNotFoundException("Lab", id)))
                    .collect(Collectors.toList());
        }

        OverrideEvent event = OverrideEvent.builder()
                .title(req.getTitle())
                .description(req.getDescription())
                .type(req.getType())
                .overrideDate(req.getOverrideDate())
                .startTime(req.getStartTime())
                .endTime(req.getEndTime())
                .affectedLabs(affectedLabs)
                .affectedDepartments(req.getAffectedDepartments())
                .affectedDivisions(req.getAffectedDivisions())
                .createdBy(creator)
                .priorityLevel(priority)
                .isMandatory(req.getIsMandatory())
                .isActive(true)
                .build();

        OverrideEvent saved = overrideRepo.save(event);

        // Propagate effects
        int slotsOverridden = overrideTimetableSlots(saved, affectedLabs);
        int bookingsOverridden = overrideExistingBookings(saved, affectedLabs);

        log.info("Override event '{}' created by {} — {} slots, {} bookings overridden",
                saved.getTitle(), creatorUsername, slotsOverridden, bookingsOverridden);

        return mapper.toOverrideEventResponse(saved, bookingsOverridden, slotsOverridden);
    }

    /**
     * Marks matching TimetableSlots as overridden.
     * Matches by: lab, day-of-week derived from overrideDate, time overlap.
     */
    private int overrideTimetableSlots(OverrideEvent event, List<Lab> affectedLabs) {
        String dayOfWeek = event.getOverrideDate().getDayOfWeek().name();
        List<TimetableSlot> toUpdate = new ArrayList<>();

        List<Lab> labsToCheck = affectedLabs.isEmpty()
                ? labRepo.findByIsActiveTrue()   // GLOBAL_EVENT → all labs
                : affectedLabs;

        for (Lab lab : labsToCheck) {
            List<TimetableSlot> overlapping = slotRepo.findOverlappingSlots(
                    lab.getId(), dayOfWeek, event.getStartTime(), event.getEndTime());

            // For CLASS_OVERRIDE, only override slots for affected divisions
            for (TimetableSlot slot : overlapping) {
                if (event.getType() == OverrideType.CLASS_OVERRIDE) {
                    if (!event.affectsDivision(slot.getDivision())) continue;
                }
                slot.setIsOverridden(true);
                slot.setOverriddenByEvent(event);
                toUpdate.add(slot);
            }
        }

        slotRepo.saveAll(toUpdate);
        return toUpdate.size();
    }

    /**
     * Marks existing non-terminal BookingRequests as OVERRIDDEN.
     * Checks date + time overlap + lab membership.
     */
    private int overrideExistingBookings(OverrideEvent event, List<Lab> affectedLabs) {
        List<Long> labIds = affectedLabs.isEmpty()
                ? labRepo.findByIsActiveTrue().stream().map(Lab::getId).collect(Collectors.toList())
                : affectedLabs.stream().map(Lab::getId).collect(Collectors.toList());

        // Pass active statuses as a parameter — Hibernate 6 requires enum values via @Param
        List<BookingRequest.BookingStatus> activeStatuses = List.of(
                BookingRequest.BookingStatus.APPROVED,
                BookingRequest.BookingStatus.IN_REVIEW,
                BookingRequest.BookingStatus.PENDING);

        List<BookingRequest> toOverride = bookingRepo.findBookingsForLabsInWindow(
                labIds, event.getOverrideDate(), event.getStartTime(), event.getEndTime(),
                activeStatuses);

        // For CLASS_OVERRIDE, only override bookings for affected divisions
        List<BookingRequest> filtered = toOverride.stream().filter(br -> {
            if (event.getType() != OverrideType.CLASS_OVERRIDE) return true;
            return event.affectsDivision(br.getDivision());
        }).collect(Collectors.toList());

        filtered.forEach(br -> {
            br.setStatus(BookingRequest.BookingStatus.OVERRIDDEN);
            br.setOverriddenByEvent(event);
        });

        bookingRepo.saveAll(filtered);
        return filtered.size();
    }

    // ─── Deactivate ───────────────────────────────────────────────────────

    /**
     * Deactivates an override event and restores all affected slots/bookings
     * back to their pre-override state.
     * Only the creator or a higher-authority user can deactivate.
     */
    @Transactional
    public OverrideEventResponse deactivateOverrideEvent(Long eventId, String requesterUsername) {
        OverrideEvent event = overrideRepo.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("OverrideEvent", eventId));

        event.setIsActive(false);
        overrideRepo.save(event);

        // Restore timetable slots
        List<TimetableSlot> slots = slotRepo.findByOverriddenByEventId(eventId);
        slots.forEach(s -> {
            s.setIsOverridden(false);
            s.setOverriddenByEvent(null);
        });
        slotRepo.saveAll(slots);

        // Restore bookings that were overridden by this specific event → back to PENDING
        List<BookingRequest> bookings = bookingRepo.findByStatus(BookingRequest.BookingStatus.OVERRIDDEN)
                .stream()
                .filter(br -> br.getOverriddenByEvent() != null
                        && br.getOverriddenByEvent().getId().equals(eventId))
                .collect(Collectors.toList());

        bookings.forEach(br -> {
            br.setStatus(BookingRequest.BookingStatus.PENDING);
            br.setOverriddenByEvent(null);
        });
        bookingRepo.saveAll(bookings);

        log.info("Override event {} deactivated — {} slots, {} bookings restored", eventId, slots.size(), bookings.size());
        return mapper.toOverrideEventResponse(event, bookings.size(), slots.size());
    }

    // ─── Queries ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<OverrideEventResponse> getAllActive() {
        return overrideRepo.findByIsActiveTrueOrderByCreatedAtDesc().stream()
                .map(mapper::toOverrideEventResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OverrideEventResponse> getAll() {
        return overrideRepo.findAll().stream()
                .map(mapper::toOverrideEventResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OverrideEventResponse getById(Long id) {
        return mapper.toOverrideEventResponse(
                overrideRepo.findById(id)
                        .orElseThrow(() -> new ResourceNotFoundException("OverrideEvent", id)));
    }

    // ─── Validation helpers (called by BookingService) ────────────────────

    /**
     * Returns active override events that conflict with a booking request's
     * date, time, and labs.
     */
    @Transactional(readOnly = true)
    public List<OverrideEvent> findConflictingOverrides(
            List<Long> labIds, java.time.LocalDate date,
            LocalTime startTime, LocalTime endTime) {

        List<OverrideEvent> overlapping = overrideRepo.findActiveOverlapping(date, startTime, endTime);

        return overlapping.stream()
                .filter(oe -> {
                    // GLOBAL_EVENT affects all labs
                    if (oe.getAffectedLabs().isEmpty()) return true;
                    // Otherwise check if any requested lab is affected
                    return oe.getAffectedLabs().stream()
                            .anyMatch(l -> labIds.contains(l.getId()));
                })
                .collect(Collectors.toList());
    }
}
