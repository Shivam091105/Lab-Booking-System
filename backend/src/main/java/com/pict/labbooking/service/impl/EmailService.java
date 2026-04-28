package com.pict.labbooking.service.impl;

import com.pict.labbooking.entity.*;
import com.pict.labbooking.entity.Approval.ApprovalStatus;
import com.pict.labbooking.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Async email notification service.
 * Sends emails to relevant parties on booking events.
 * Can be disabled via app.mail.enabled=false for local dev.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final UserRepository userRepo;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${spring.mail.username:noreply@pict.edu}")
    private String fromEmail;

    /**
     * Notifies approvers when a new booking is submitted.
     * Finds all users with the first-level approver role.
     */
    @Async
    public void notifyApprovers(BookingRequest booking) {
        if (!mailEnabled) return;

        booking.getApprovals().stream()
                .filter(a -> a.getApprovalOrder() == 1)
                .findFirst()
                .ifPresent(firstApproval -> {
                    List<User> approvers = userRepo.findAll().stream()
                            .filter(u -> u.getRoles().contains(firstApproval.getApproverRole()))
                            .collect(Collectors.toList());

                    approvers.forEach(approver -> {
                        String subject = "[Lab Booking] New Request Awaiting Your Approval - " + booking.getReferenceNumber();
                        String body = buildApprovalRequestBody(booking, approver);
                        sendMail(approver.getEmail(), subject, body);
                    });
                });

        // Also notify the requester
        sendMail(
            booking.getRequester().getEmail(),
            "[Lab Booking] Request Submitted - " + booking.getReferenceNumber(),
            "Dear " + booking.getRequester().getFullName() + ",\n\n" +
            "Your booking request " + booking.getReferenceNumber() + " has been submitted.\n" +
            "Purpose: " + booking.getPurpose() + "\n" +
            "Date: " + booking.getBookingDate() + "\n" +
            "Time: " + booking.getStartTime() + " - " + booking.getEndTime() + "\n\n" +
            "You will be notified when the status changes.\n\nPICT Lab Booking System"
        );
    }

    /**
     * Notifies the requester of status changes (approved/rejected).
     */
    @Async
    public void notifyStatusUpdate(BookingRequest booking) {
        if (!mailEnabled) return;

        String status = booking.getStatus().name();
        String subject = "[Lab Booking] Request " + status + " - " + booking.getReferenceNumber();
        String body = "Dear " + booking.getRequester().getFullName() + ",\n\n" +
                "Your booking request " + booking.getReferenceNumber() + " has been " + status + ".\n";

        if (booking.getRejectionReason() != null) {
            body += "Reason: " + booking.getRejectionReason() + "\n";
        }
        body += "\nPICT Lab Booking System";

        sendMail(booking.getRequester().getEmail(), subject, body);
    }

    private String buildApprovalRequestBody(BookingRequest booking, User approver) {
        return "Dear " + approver.getFullName() + ",\n\n" +
               "A new lab booking request requires your approval.\n\n" +
               "Reference: " + booking.getReferenceNumber() + "\n" +
               "Requester: " + booking.getRequester().getFullName() + "\n" +
               "Type: " + booking.getRequestType() + "\n" +
               "Date: " + booking.getBookingDate() + "\n" +
               "Time: " + booking.getStartTime() + " - " + booking.getEndTime() + "\n" +
               "Purpose: " + booking.getPurpose() + "\n\n" +
               "Please login to the Lab Booking System to approve or reject.\n\n" +
               "PICT Lab Booking System";
    }

    private void sendMail(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            log.debug("Email sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
