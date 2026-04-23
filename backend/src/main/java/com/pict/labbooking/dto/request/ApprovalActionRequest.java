package com.pict.labbooking.dto.request;

import com.pict.labbooking.entity.Approval.ApprovalStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** DTO for an approver taking action on a booking request */
@Data
public class ApprovalActionRequest {

    @NotNull(message = "Action is required")
    private ApprovalStatus action;  // APPROVED or REJECTED

    private String comments;
}
