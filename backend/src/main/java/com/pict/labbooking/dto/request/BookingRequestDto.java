package com.pict.labbooking.dto.request;

import com.pict.labbooking.entity.BookingRequest.RequestType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/** DTO to submit a new lab booking request */
@Data
public class BookingRequestDto {

    @NotNull(message = "Request type is required")
    private RequestType requestType;

    @NotNull(message = "Booking date is required")
<<<<<<< HEAD
=======
    @Future(message = "Booking date must be in the future")
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
    private LocalDate bookingDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotBlank(message = "Purpose is required")
    @Size(max = 500)
    private String purpose;

    @Min(1) @Max(500)
    private Integer expectedAttendees;

    /** Club name — required for CLUB_EVENT and MULTI_LAB_EVENT */
    private String clubName;

    /** Event name — required for CLUB_EVENT and MULTI_LAB_EVENT */
    private String eventName;

    @Size(max = 1000)
    private String additionalRequirements;

    /** Lab IDs to book — at least one required */
    @NotEmpty(message = "At least one lab must be selected")
    private List<Long> labIds;

    /** Division — required for EXTRA_CLASS */
    private String division;
}
