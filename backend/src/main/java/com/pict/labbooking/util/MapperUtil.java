package com.pict.labbooking.util;

import com.pict.labbooking.dto.response.*;
import com.pict.labbooking.entity.*;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Manual mapper utility — converts entities to response DTOs
 * without exposing entity internals.
 */
@Component
public class MapperUtil {

    public UserResponse toUserResponse(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phoneNumber(user.getPhoneNumber())
                .division(user.getDivision())
                .clubName(user.getClubName())
                .department(user.getDepartment())
                .isActive(user.getIsActive())
                .roles(user.getRoles())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public LabResponse toLabResponse(Lab lab) {
        if (lab == null) return null;
        return LabResponse.builder()
                .id(lab.getId())
                .roomNumber(lab.getRoomNumber())
                .labName(lab.getLabName())
                .capacity(lab.getCapacity())
                .location(lab.getLocation())
                .hasProjector(lab.getHasProjector())
                .hasAc(lab.getHasAc())
                .isActive(lab.getIsActive())
                .description(lab.getDescription())
                .build();
    }

    public ApprovalResponse toApprovalResponse(Approval approval) {
        if (approval == null) return null;
        return ApprovalResponse.builder()
                .id(approval.getId())
                .approverRole(approval.getApproverRole())
                .approver(toUserResponse(approval.getApprover()))
                .approvalOrder(approval.getApprovalOrder())
                .status(approval.getStatus())
                .comments(approval.getComments())
                .isAutoApproved(approval.getIsAutoApproved())
                .actedAt(approval.getActedAt())
                .createdAt(approval.getCreatedAt())
                .build();
    }

    public BookingResponse toBookingResponse(BookingRequest booking) {
        if (booking == null) return null;
        return BookingResponse.builder()
                .id(booking.getId())
                .referenceNumber(booking.getReferenceNumber())
                .requester(toUserResponse(booking.getRequester()))
                .requestType(booking.getRequestType())
                .bookingDate(booking.getBookingDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .clubName(booking.getClubName())
                .eventName(booking.getEventName())
                .additionalRequirements(booking.getAdditionalRequirements())
                .status(booking.getStatus())
                .rejectionReason(booking.getRejectionReason())
                .labs(booking.getLabs().stream().map(this::toLabResponse).collect(Collectors.toList()))
                .approvals(booking.getApprovals().stream().map(this::toApprovalResponse).collect(Collectors.toList()))
                .division(booking.getDivision())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    public TimetableSlotResponse toTimetableSlotResponse(TimetableSlot slot) {
        if (slot == null) return null;
        return TimetableSlotResponse.builder()
                .id(slot.getId())
                .labId(slot.getLab().getId())
                .labRoomNumber(slot.getLab().getRoomNumber())
                .dayOfWeek(slot.getDayOfWeek())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .subjectName(slot.getSubjectName())
                .division(slot.getDivision())
                .facultyName(slot.getFacultyName())
                .slotType(slot.getSlotType())
                .build();
    }

    public List<BookingResponse> toBookingResponseList(List<BookingRequest> bookings) {
        return bookings.stream().map(this::toBookingResponse).collect(Collectors.toList());
    }
}
