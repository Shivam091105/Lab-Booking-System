package com.pict.labbooking.service.impl;

import com.pict.labbooking.dto.response.LabResponse;
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
    private final BookingRequestRepository bookingRepo;
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
     * Returns approved bookings for a lab on a specific date,
     * combined with the weekly timetable for that day.
     */
    @Transactional(readOnly = true)
    public List<Object> getLabAvailability(Long labId, LocalDate date) {
        String dayOfWeek = date.getDayOfWeek().name();
        var timetable = slotRepo.findByLabIdAndDayOfWeek(labId, dayOfWeek)
                .stream().map(mapper::toTimetableSlotResponse).collect(Collectors.toList());
        var bookings = bookingRepo.findApprovedBookingsForLabOnDate(labId, date)
                .stream().map(mapper::toBookingResponse).collect(Collectors.toList());
        return List.of(timetable, bookings);
    }
}
