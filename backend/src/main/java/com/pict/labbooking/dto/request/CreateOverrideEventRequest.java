package com.pict.labbooking.dto.request;

import com.pict.labbooking.entity.OverrideEvent.OverrideType;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

/**
 * DTO for HOD/Principal to create a mandatory override event.
 */
@Data
public class CreateOverrideEventRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200)
    private String title;

    @Size(max = 2000)
    private String description;

    @NotNull(message = "Event type is required")
    private OverrideType type;

    @NotNull(message = "Override date is required")
    private LocalDate overrideDate;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    /**
     * Lab IDs affected. Empty list = no specific lab (GLOBAL_EVENT).
     * Required for LAB_OVERRIDE and CLASS_OVERRIDE.
     */
    private List<Long> affectedLabIds;

    /**
     * Departments affected (comma-separated or list).
     * Null/empty = all departments.
     */
    private String affectedDepartments;

    /**
     * Divisions affected, e.g. ["TE-A", "TE-B"].
     * Null/empty = all divisions in affected departments.
     */
    private String affectedDivisions;

    @NotNull
    private Boolean isMandatory;
}
