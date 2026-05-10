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
@Repository
public interface BookingRequestRepository extends JpaRepository<BookingRequest, Long> {

    List<BookingRequest> findByRequesterId(Long requesterId);

    List<BookingRequest> findByStatus(BookingStatus status);

    Optional<BookingRequest> findByReferenceNumber(String referenceNumber);

    // ── Conflict check ───────────────────────────────────────────────────
    /**
     * Find bookings that conflict with the requested lab/date/time slot.
     * Passes enum values as parameters — the only Hibernate 6 compatible way.
     */
    @Query("""
        SELECT br FROM BookingRequest br
        JOIN br.labs l
        WHERE l = :lab
          AND br.bookingDate = :date
          AND br.status IN :statuses
          AND br.startTime < :endTime
          AND br.endTime > :startTime
    """)
    List<BookingRequest> findConflictingBookings(
        @Param("lab") Lab lab,
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime,
        @Param("statuses") List<BookingStatus> statuses
    );

    // ── Schedule display ─────────────────────────────────────────────────
    @Query("""
        SELECT br FROM BookingRequest br
        JOIN br.labs l
        WHERE l.id = :labId
          AND br.bookingDate = :date
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

    List<BookingRequest> findTop10ByOrderByCreatedAtDesc();
}
