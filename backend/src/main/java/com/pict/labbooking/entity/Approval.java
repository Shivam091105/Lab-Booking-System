package com.pict.labbooking.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents a single approval step in the workflow.
 * Each booking request has an ordered list of these.
 */
@Entity
@Table(name = "approvals")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Approval {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_request_id", nullable = false)
    private BookingRequest bookingRequest;

    /** The role responsible for this approval step */
    @Column(name = "approver_role", nullable = false)
    @Enumerated(EnumType.STRING)
    private RoleName approverRole;

    /** Actual user who acted on this approval (nullable until acted upon) */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approver_id")
    private User approver;

    /** Position in the approval chain; lower = earlier */
    @Column(name = "approval_order", nullable = false)
    private Integer approvalOrder;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ApprovalStatus status = ApprovalStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String comments;

    /** Whether this approval was auto-approved by a higher authority */
    @Column(name = "is_auto_approved")
    @Builder.Default
    private Boolean isAutoApproved = false;

    @Column(name = "acted_at")
    private LocalDateTime actedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum ApprovalStatus {
        PENDING,
        APPROVED,
        REJECTED,
        SKIPPED  // skipped due to higher authority auto-approval
    }
}
