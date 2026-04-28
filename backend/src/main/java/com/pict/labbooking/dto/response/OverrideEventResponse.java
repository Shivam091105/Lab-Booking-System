package com.pict.labbooking.dto.response;

import com.pict.labbooking.entity.OverrideEvent.OverrideType;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class OverrideEventResponse {
    private Long id;
    private String title;
    private String description;
    private OverrideType type;
    private LocalDate overrideDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private List<LabResponse> affectedLabs;
    private String affectedDepartments;
    private String affectedDivisions;
    private UserResponse createdBy;
    private Integer priorityLevel;
    private Boolean isMandatory;
    private Boolean isActive;
    private LocalDateTime createdAt;

    /** How many bookings were overridden when this event was created */
    private Integer bookingsOverridden;

    /** How many timetable slots were marked overridden */
    private Integer slotsOverridden;
}
