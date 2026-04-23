package com.pict.labbooking.repository;

import com.pict.labbooking.entity.Approval;
import com.pict.labbooking.entity.Approval.ApprovalStatus;
import com.pict.labbooking.entity.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalRepository extends JpaRepository<Approval, Long> {

    List<Approval> findByBookingRequestId(Long bookingRequestId);

    /** Find pending approvals for a given role */
    List<Approval> findByApproverRoleAndStatus(RoleName approverRole, ApprovalStatus status);

    /** Find next pending approval in chain for a booking */
    @Query("""
        SELECT a FROM Approval a
        WHERE a.bookingRequest.id = :bookingId
          AND a.status = 'PENDING'
        ORDER BY a.approvalOrder ASC
    """)
    Optional<Approval> findNextPendingApproval(@Param("bookingId") Long bookingId);

    /** Count pending approvals by role (for dashboard badge) */
    long countByApproverRoleAndStatus(RoleName approverRole, ApprovalStatus status);
}
