package com.pict.labbooking.dto.response;

import com.pict.labbooking.entity.Approval.ApprovalStatus;
import com.pict.labbooking.entity.RoleName;
import lombok.*;

import java.time.LocalDateTime;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ApprovalResponse {
    private Long id;
    private RoleName approverRole;
    private UserResponse approver;
    private Integer approvalOrder;
    private ApprovalStatus status;
    private String comments;
    private Boolean isAutoApproved;
    private LocalDateTime actedAt;
    private LocalDateTime createdAt;
}
