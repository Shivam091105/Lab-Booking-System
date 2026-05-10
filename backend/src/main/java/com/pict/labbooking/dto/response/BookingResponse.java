package com.pict.labbooking.dto.response;

import com.pict.labbooking.entity.BookingRequest.BookingStatus;
import com.pict.labbooking.entity.BookingRequest.RequestType;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BookingResponse {
    private Long id;
    private String referenceNumber;
    private UserResponse requester;
    private RequestType requestType;
    private LocalDate bookingDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String purpose;
    private Integer expectedAttendees;
    private String clubName;
    private String eventName;
    private String additionalRequirements;
    private BookingStatus status;
    private String rejectionReason;
    private List<LabResponse> labs;
    private List<ApprovalResponse> approvals;
    private String division;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    // ── Override fields ────────────────────────────────────────────────────
    private Long overriddenByEventId;
    private String overriddenByEventTitle;
}
