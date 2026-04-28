package com.pict.labbooking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Entry point for the PICT Lab Booking System.
 * Enables async processing for email notifications.
 */
@SpringBootApplication
@EnableAsync
public class LabBookingApplication {

    public static void main(String[] args) {
        SpringApplication.run(LabBookingApplication.class, args);
    }
}
