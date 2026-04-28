package com.pict.labbooking.service.impl;

import com.pict.labbooking.dto.response.LabResponse;
import com.pict.labbooking.dto.response.OverrideEventResponse;
import com.pict.labbooking.dto.response.TimetableSlotResponse;
import com.pict.labbooking.entity.Lab;
import com.pict.labbooking.exception.ResourceNotFoundException;
import com.pict.labbooking.repository.*;
import com.pict.labbooking.util.MapperUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LabService {

    private final LabRepository labRepo;
    private final TimetableSlotRepository slotRepo;
    private final OverrideEventRepository overrideRepo;
    private final BookingService bookingService;
    private final MapperUtil mapper;

    @Transactional(readOnly = true)
    public List<LabResponse> getAllActiveLabs() {
        return labRepo.findByIsActiveTrue().stream()
                .map(mapper::toLabResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public LabResponse getLabById(Long id) {
        Lab lab = labRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Lab", id));
        return mapper.toLabResponse(lab);
    }

    @Transactional(readOnly = true)
    public List<TimetableSlotResponse> getLabTimetable(Long labId) {
        return slotRepo.findByLabId(labId).stream()
                .map(mapper::toTimetableSlotResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<TimetableSlotResponse> getLabTimetableByDay(Long labId, String day) {
        return slotRepo.findByLabIdAndDayOfWeek(labId, day.toUpperCase()).stream()
                .map(mapper::toTimetableSlotResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns three lists for the given lab + date:
     *  [0] timetable slots for that day-of-week (with override flags)
     *  [1] all active bookings on that date (PENDING, IN_REVIEW, APPROVED, OVERRIDDEN)
     *  [2] active override events for that lab on that date
     *
     * The frontend uses these three lists to colour-code the calendar.
     */
    @Transactional(readOnly = true)
    public List<Object> getLabAvailability(Long labId, LocalDate date) {
        String dayOfWeek = date.getDayOfWeek().name();

        var timetable = slotRepo.findByLabIdAndDayOfWeek(labId, dayOfWeek)
                .stream().map(mapper::toTimetableSlotResponse).collect(Collectors.toList());

        var bookings = bookingService.getBookingsForLabOnDate(labId, date)
                .stream().map(mapper::toBookingResponse).collect(Collectors.toList());

        var overrides = overrideRepo.findActiveForLabOnDate(labId, date)
                .stream().map(mapper::toOverrideEventResponse).collect(Collectors.toList());

        return List.of(timetable, bookings, overrides);
    }
}
