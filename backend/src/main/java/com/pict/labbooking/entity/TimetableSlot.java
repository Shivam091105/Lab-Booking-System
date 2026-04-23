package com.pict.labbooking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

/**
 * Represents a recurring weekly slot in a lab's timetable.
 * Used to show existing scheduled classes and check availability.
 */
@Entity
@Table(name = "timetable_slots",
    uniqueConstraints = @UniqueConstraint(columnNames = {"lab_id", "day_of_week", "start_time"}))
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TimetableSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lab_id", nullable = false)
    private Lab lab;

    /**
     * Day of week: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY
     */
    @Column(name = "day_of_week", nullable = false, length = 10)
    private String dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    /** Subject being taught in this slot */
    @Column(name = "subject_name")
    private String subjectName;

    /** Which division/batch uses this slot */
    @Column(name = "division")
    private String division;

    /** Faculty teaching in this slot */
    @Column(name = "faculty_name")
    private String facultyName;

    @Column(name = "slot_type", nullable = false, length = 20)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private SlotType slotType = SlotType.REGULAR_CLASS;

    public enum SlotType {
        REGULAR_CLASS,
        BOOKED,
        FREE
    }
}
