package com.pict.labbooking.repository;

import com.pict.labbooking.entity.BookingRequest;
import com.pict.labbooking.entity.BookingRequest.BookingStatus;
import com.pict.labbooking.entity.Lab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRequestRepository extends JpaRepository<BookingRequest, Long> {

    List<BookingRequest> findByRequesterId(Long requesterId);

    List<BookingRequest> findByStatus(BookingStatus status);

    Optional<BookingRequest> findByReferenceNumber(String referenceNumber);

    /** Check for conflicting bookings on same lab, date, and overlapping time */
    @Query("""
        SELECT br FROM BookingRequest br
        JOIN br.labs l
        WHERE l = :lab
          AND br.bookingDate = :date
          AND br.status IN ('APPROVED', 'IN_REVIEW', 'PENDING')
          AND br.startTime < :endTime
          AND br.endTime > :startTime
    """)
    List<BookingRequest> findConflictingBookings(
        @Param("lab") Lab lab,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );

    /** Get all bookings for a specific lab on a date */
    @Query("""
        SELECT br FROM BookingRequest br
        JOIN br.labs l
        WHERE l.id = :labId
          AND br.bookingDate = :date
          AND br.status = 'APPROVED'
    """)
    List<BookingRequest> findApprovedBookingsForLabOnDate(
        @Param("labId") Long labId,
        @Param("date") LocalDate date
    );

    /** Analytics: count by status */
    @Query("SELECT br.status, COUNT(br) FROM BookingRequest br GROUP BY br.status")
    List<Object[]> countGroupedByStatus();

    /** Recent bookings for dashboard */
    List<BookingRequest> findTop10ByOrderByCreatedAtDesc();
}
