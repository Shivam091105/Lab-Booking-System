package com.pict.labbooking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Represents a mandatory override event created by HOD/Principal
 * that supersedes existing lab sessions and bookings for affected labs/divisions.
 *
 * Example: A compulsory guest lecture in the auditorium cancels all lab
 * sessions for affected divisions during the specified time window.
 *
 * KEY RULES:
 *  - Does NOT delete existing timetable slots or bookings.
 *  - Marks them as OVERRIDDEN so they remain in audit trail.
 *  - Students in affected divisions CANNOT make new bookings during the window.
 *  - Professors CAN still book but NOT for affected divisions.
 */
@Entity
@Table(name = "override_events")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OverrideEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "event_type", nullable = false, length = 30)
    @Enumerated(EnumType.STRING)
    private OverrideType type;

    /** Date the override applies on */
    @Column(name = "override_date", nullable = false)
    private LocalDate overrideDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    /**
     * Labs that are affected by this override.
     * Empty means NO specific lab is blocked (e.g. a global department event).
     */
    @ManyToMany
    @JoinTable(
        name = "override_event_labs",
        joinColumns = @JoinColumn(name = "override_event_id"),
        inverseJoinColumns = @JoinColumn(name = "lab_id")
    )
    @Builder.Default
    private List<Lab> affectedLabs = new ArrayList<>();

    /**
     * Comma-separated departments affected, e.g. "Computer Engineering".
     * Empty = all departments.
     */
    @Column(name = "affected_departments", columnDefinition = "TEXT")
    private String affectedDepartments;

    /**
     * Comma-separated divisions affected, e.g. "TE-A,TE-B,SE-A".
     * Empty = all divisions in the affected department.
     */
    @Column(name = "affected_divisions", columnDefinition = "TEXT")
    private String affectedDivisions;

    /** HOD or Principal who created this event */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id", nullable = false)
    private User createdBy;

    /**
     * Priority mirrors role hierarchy (higher = more authority):
     *  HOD = 4, PRINCIPAL = 5
     */
    @Column(name = "priority_level", nullable = false)
    private Integer priorityLevel;

    /** If true, attendance is compulsory; no exceptions allowed */
    @Column(name = "is_mandatory", nullable = false)
    @Builder.Default
    private Boolean isMandatory = true;

    /** Whether this override is still active (can be deactivated to restore slots) */
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum OverrideType {
        /** Affects an entire department/college, no specific lab */
        GLOBAL_EVENT,
        /** Overrides specific lab(s) for all users */
        LAB_OVERRIDE,
        /** Overrides schedule only for specific divisions */
        CLASS_OVERRIDE
    }

    // ── Helper methods ────────────────────────────────────────────────────

    /** Returns true if the given division string is in the affected list */
    public boolean affectsDivision(String division) {
        if (division == null || division.isBlank()) return false;
        if (affectedDivisions == null || affectedDivisions.isBlank()) return true; // all divisions
        for (String d : affectedDivisions.split(",")) {
            if (d.trim().equalsIgnoreCase(division.trim())) return true;
        }
        return false;
    }

    /** Returns true if the given lab is in the affected list */
    public boolean affectsLab(Long labId) {
        if (affectedLabs == null || affectedLabs.isEmpty()) return true; // all labs
        return affectedLabs.stream().anyMatch(l -> l.getId().equals(labId));
    }

    /** Returns true if this event overlaps the given time window */
    public boolean overlaps(LocalTime reqStart, LocalTime reqEnd) {
        return this.startTime.isBefore(reqEnd) && this.endTime.isAfter(reqStart);
    }
}
