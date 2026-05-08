package com.pict.labbooking.controller;

import com.pict.labbooking.dto.request.ApprovalActionRequest;
import com.pict.labbooking.dto.request.BookingRequestDto;
import com.pict.labbooking.dto.response.ApiResponse;
import com.pict.labbooking.dto.response.BookingResponse;
import com.pict.labbooking.entity.RoleName;
import com.pict.labbooking.service.impl.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

<<<<<<< HEAD
    /**
     * Submit a new booking request.
     * STUDENT, CLUB_MANAGER — for student/club bookings.
     * PROFESSOR, CLASS_COORDINATOR — for faculty-initiated extra sessions.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT','CLUB_MANAGER','PROFESSOR','CLASS_COORDINATOR')")
=======
    /** Submit a new booking request (students & club managers) */
    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT','CLUB_MANAGER')")
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
    public ResponseEntity<ApiResponse<BookingResponse>> submitBooking(
            @Valid @RequestBody BookingRequestDto dto,
            @AuthenticationPrincipal UserDetails userDetails) {
        BookingResponse response = bookingService.submitBooking(dto, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Booking request submitted successfully"));
    }

    /** Get current user's own bookings */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.getMyBookings(userDetails.getUsername())));
    }

    /** Get a specific booking by ID */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(bookingService.getBookingById(id)));
    }

    /** Get all bookings — admin/HOD/Principal view */
    @GetMapping
    @PreAuthorize("hasAnyRole('HOD','PRINCIPAL','LAB_ASSISTANT')")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getAllBookings() {
        return ResponseEntity.ok(ApiResponse.success(bookingService.getAllBookings()));
    }

    /** Get pending approvals for the currently logged-in approver's role */
    @GetMapping("/pending-approvals")
    @PreAuthorize("hasAnyRole('LAB_ASSISTANT','PROFESSOR','CLASS_COORDINATOR','HOD','PRINCIPAL','CLUB_MANAGER')")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getPendingApprovals(
            @AuthenticationPrincipal UserDetails userDetails) {
        // Determine the primary role of this approver from their authorities
        RoleName role = userDetails.getAuthorities().stream()
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .map(RoleName::valueOf)
                .filter(r -> r != RoleName.STUDENT)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No approver role found"));
        return ResponseEntity.ok(ApiResponse.success(bookingService.getPendingApprovalsForRole(role)));
    }

    /** Approve or reject a booking */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('LAB_ASSISTANT','PROFESSOR','CLASS_COORDINATOR','HOD','PRINCIPAL','CLUB_MANAGER')")
    public ResponseEntity<ApiResponse<BookingResponse>> processApproval(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalActionRequest actionRequest,
            @AuthenticationPrincipal UserDetails userDetails) {
        BookingResponse response = bookingService.processApproval(id, actionRequest, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Approval action recorded"));
    }

<<<<<<< HEAD
    /** Cancel own booking — all roles that can create bookings */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('STUDENT','CLUB_MANAGER','PROFESSOR','CLASS_COORDINATOR')")
=======
    /** Cancel own booking */
    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('STUDENT','CLUB_MANAGER')")
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        BookingResponse response = bookingService.cancelBooking(id, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success(response, "Booking cancelled"));
    }

    /** Analytics: booking counts by status */
    @GetMapping("/analytics/status-counts")
    @PreAuthorize("hasAnyRole('HOD','PRINCIPAL')")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStatusCounts() {
        return ResponseEntity.ok(ApiResponse.success(bookingService.getStatusCounts()));
    }
}
