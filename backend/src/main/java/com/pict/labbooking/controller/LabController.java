package com.pict.labbooking.controller;

import com.pict.labbooking.dto.response.ApiResponse;
import com.pict.labbooking.dto.response.LabResponse;
import com.pict.labbooking.dto.response.TimetableSlotResponse;
import com.pict.labbooking.service.impl.LabService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/labs")
@RequiredArgsConstructor
public class LabController {

    private final LabService labService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<LabResponse>>> getAllLabs() {
        return ResponseEntity.ok(ApiResponse.success(labService.getAllActiveLabs()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LabResponse>> getLabById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(labService.getLabById(id)));
    }

    @GetMapping("/{id}/timetable")
    public ResponseEntity<ApiResponse<List<TimetableSlotResponse>>> getLabTimetable(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(labService.getLabTimetable(id)));
    }

    @GetMapping("/{id}/timetable/{day}")
    public ResponseEntity<ApiResponse<List<TimetableSlotResponse>>> getLabTimetableByDay(
            @PathVariable Long id, @PathVariable String day) {
        return ResponseEntity.ok(ApiResponse.success(labService.getLabTimetableByDay(id, day)));
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<ApiResponse<List<Object>>> getLabAvailability(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.success(labService.getLabAvailability(id, date)));
    }
}
