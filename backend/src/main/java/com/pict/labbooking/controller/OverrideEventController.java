package com.pict.labbooking.controller;

import com.pict.labbooking.dto.request.CreateOverrideEventRequest;
import com.pict.labbooking.dto.response.ApiResponse;
import com.pict.labbooking.dto.response.OverrideEventResponse;
import com.pict.labbooking.service.impl.OverrideEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for managing OverrideEvents.
 *
 * CREATE — HOD / PRINCIPAL only
 * READ   — all authenticated users
 * DEACTIVATE — HOD / PRINCIPAL only
 */
@RestController
@RequestMapping("/override-events")
@RequiredArgsConstructor
public class OverrideEventController {

    private final OverrideEventService overrideEventService;

    /** Create a new override event (marks affected slots + bookings) */
    @PostMapping
    @PreAuthorize("hasAnyRole('HOD','PRINCIPAL')")
    public ResponseEntity<ApiResponse<OverrideEventResponse>> createOverrideEvent(
            @Valid @RequestBody CreateOverrideEventRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        OverrideEventResponse response = overrideEventService.createOverrideEvent(req, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response,
                    "Override event created. Affected bookings and slots have been updated."));
    }

    /** Get all override events (active + inactive) — admin view */
    @GetMapping
    @PreAuthorize("hasAnyRole('HOD','PRINCIPAL','LAB_ASSISTANT','PROFESSOR','CLASS_COORDINATOR')")
    public ResponseEntity<ApiResponse<List<OverrideEventResponse>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(overrideEventService.getAll()));
    }

    /** Get only currently active override events — visible to all roles */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<OverrideEventResponse>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(overrideEventService.getAllActive()));
    }

    /** Get a single override event */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OverrideEventResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(overrideEventService.getById(id)));
    }

    /**
     * Deactivate an override event.
     * Restores all affected timetable slots and bookings.
     */
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasAnyRole('HOD','PRINCIPAL')")
    public ResponseEntity<ApiResponse<OverrideEventResponse>> deactivate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        OverrideEventResponse response = overrideEventService.deactivateOverrideEvent(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response,
                "Override event deactivated. Affected slots and bookings have been restored."));
    }
}
