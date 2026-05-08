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

<<<<<<< HEAD
/**
 * Repository for BookingRequest.
 *
 * IMPORTANT — Hibernate 6 (Spring Boot 3.x) does NOT support fully-qualified
 * enum class paths inside JPQL (e.g. com.pict...BookingStatus.APPROVED fails).
 * The correct approach is to pass enum values as @Param bindings or use
 * Spring Data derived query methods (findByStatus).
 * All custom queries here use :statusXxx parameters bound to enum values
 * from the service layer, OR use native Spring Data method naming.
 */
=======
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
@Repository
public interface BookingRequestRepository extends JpaRepository<BookingRequest, Long> {

    List<BookingRequest> findByRequesterId(Long requesterId);

    List<BookingRequest> findByStatus(BookingStatus status);

    Optional<BookingRequest> findByReferenceNumber(String referenceNumber);

<<<<<<< HEAD
    // ── Conflict check ───────────────────────────────────────────────────
    /**
     * Find bookings that conflict with the requested lab/date/time slot.
     * Passes enum values as parameters — the only Hibernate 6 compatible way.
     */
=======
    /** Check for conflicting bookings on same lab, date, and overlapping time */
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
    @Query("""
        SELECT br FROM BookingRequest br
        JOIN br.labs l
        WHERE l = :lab
          AND br.bookingDate = :date
<<<<<<< HEAD
          AND br.status IN :statuses
=======
          AND br.status IN ('APPROVED', 'IN_REVIEW', 'PENDING')
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
          AND br.startTime < :endTime
          AND br.endTime > :startTime
    """)
    List<BookingRequest> findConflictingBookings(
        @Param("lab") Lab lab,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
<<<<<<< HEAD
        @Param("endTime") LocalTime endTime,
        @Param("statuses") List<BookingStatus> statuses
    );

    // ── Schedule display ─────────────────────────────────────────────────
=======
        @Param("endTime") LocalTime endTime
    );

    /** Get all bookings for a specific lab on a date */
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
    @Query("""
        SELECT br FROM BookingRequest br
        JOIN br.labs l
        WHERE l.id = :labId
          AND br.bookingDate = :date
<<<<<<< HEAD
          AND br.status IN :statuses
    """)
    List<BookingRequest> findBookingsForLabOnDateWithStatuses(
        @Param("labId") Long labId,
        @Param("date") LocalDate date,
        @Param("statuses") List<BookingStatus> statuses
    );

    // ── Override detection ───────────────────────────────────────────────
    @Query("""
        SELECT br FROM BookingRequest br
        JOIN br.labs l
        WHERE l.id IN :labIds
          AND br.bookingDate = :date
          AND br.status IN :statuses
          AND br.startTime < :endTime
          AND br.endTime > :startTime
    """)
    List<BookingRequest> findBookingsForLabsInWindow(
        @Param("labIds") List<Long> labIds,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime,
        @Param("statuses") List<BookingStatus> statuses
    );

    @Query("""
        SELECT br FROM BookingRequest br
        WHERE br.division = :division
          AND br.bookingDate = :date
          AND br.status IN :statuses
          AND br.startTime < :endTime
          AND br.endTime > :startTime
    """)
    List<BookingRequest> findBookingsForDivisionInWindow(
        @Param("division") String division,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime,
        @Param("statuses") List<BookingStatus> statuses
    );

    // ── Analytics ────────────────────────────────────────────────────────
    @Query("SELECT br.status, COUNT(br) FROM BookingRequest br GROUP BY br.status")
    List<Object[]> countGroupedByStatus();

=======
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
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
    List<BookingRequest> findTop10ByOrderByCreatedAtDesc();
}
