package com.pict.labbooking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Represents a physical lab / room in the college.
 * Labs identified by room number (e.g., A1-302).
 */
@Entity
@Table(name = "labs")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lab {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_number", nullable = false, unique = true, length = 20)
    private String roomNumber;  // e.g., A1-302

    @Column(name = "lab_name", nullable = false)
    private String labName;     // e.g., "Computer Lab 1"

    @Column(nullable = false)
    private Integer capacity;

    @Column(nullable = false)
    private String location;    // e.g., "A1 Building, 3rd Floor"

    @Column(name = "has_projector", nullable = false)
    @Builder.Default
    private Boolean hasProjector = false;

    @Column(name = "has_ac", nullable = false)
    @Builder.Default
    private Boolean hasAc = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(columnDefinition = "TEXT")
    private String description;

    @OneToMany(mappedBy = "lab", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<TimetableSlot> timetableSlots = new ArrayList<>();
}
