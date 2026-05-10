package com.pict.labbooking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Central entity representing a lab booking request.
 * Tracks the full lifecycle from submission to final approval/rejection.
 */
@Entity
@Table(name = "booking_requests")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Unique reference number shown to users, e.g. LB-2024-001 */
    @Column(name = "reference_number", unique = true, nullable = false)
    private String referenceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @Column(name = "request_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private RequestType requestType;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private String purpose;

    @Column(name = "expected_attendees")
    private Integer expectedAttendees;

    /** Club name if requestType is CLUB_EVENT */
    @Column(name = "club_name")
    private String clubName;

    @Column(name = "event_name")
    private String eventName;

    @Column(name = "additional_requirements", columnDefinition = "TEXT")
    private String additionalRequirements;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    /** For MULTI_LAB requests, multiple labs can be linked */
    @ManyToMany
    @JoinTable(
        name = "booking_labs",
        joinColumns = @JoinColumn(name = "booking_id"),
        inverseJoinColumns = @JoinColumn(name = "lab_id")
    )
    @Builder.Default
    private List<Lab> labs = new ArrayList<>();

    /** Ordered list of approvals in the workflow */
    @OneToMany(mappedBy = "bookingRequest", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("approvalOrder ASC")
    @Builder.Default
    private List<Approval> approvals = new ArrayList<>();

    /** For EXTRA_CLASS: which division this is for */
    @Column(name = "division")
    private String division;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum RequestType {
        EXTRA_CLASS,
        CLUB_EVENT,
        MULTI_LAB_EVENT
    }

    /**
     * Reference to the OverrideEvent that cancelled this booking.
     * Null unless status = OVERRIDDEN.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "overridden_by_event_id")
    private OverrideEvent overriddenByEvent;

    public enum BookingStatus {
        PENDING,
        IN_REVIEW,
        APPROVED,
        REJECTED,
        CANCELLED,
        OVERRIDDEN   // cancelled due to a mandatory override event
    }
}
