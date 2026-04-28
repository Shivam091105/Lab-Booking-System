package com.pict.labbooking.repository;

import com.pict.labbooking.entity.OverrideEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface OverrideEventRepository extends JpaRepository<OverrideEvent, Long> {

    List<OverrideEvent> findByIsActiveTrueOrderByCreatedAtDesc();

    /**
     * Find active overrides on a specific date that overlap the given time window.
     */
    @Query("""
        SELECT oe FROM OverrideEvent oe
        WHERE oe.isActive = true
          AND oe.overrideDate = :date
          AND oe.startTime < :endTime
          AND oe.endTime > :startTime
    """)
    List<OverrideEvent> findActiveOverlapping(
        @Param("date") LocalDate date,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );

    /**
     * Find active overrides for a specific lab on a date.
     * Also returns GLOBAL_EVENT overrides (those with no affectedLabs) via a separate union-style check.
     */
    @Query("""
        SELECT oe FROM OverrideEvent oe
        LEFT JOIN oe.affectedLabs l
        WHERE oe.isActive = true
          AND oe.overrideDate = :date
          AND (l.id = :labId OR SIZE(oe.affectedLabs) = 0)
    """)
    List<OverrideEvent> findActiveForLabOnDate(
        @Param("labId") Long labId,
        @Param("date") LocalDate date
    );

    /**
     * Find active overrides within a date range for a specific lab.
     * Used to decorate weekly timetable slots — fetches by week range instead of day-of-week string.
     */
    @Query("""
        SELECT oe FROM OverrideEvent oe
        LEFT JOIN oe.affectedLabs l
        WHERE oe.isActive = true
          AND oe.overrideDate BETWEEN :weekStart AND :weekEnd
          AND (l.id = :labId OR SIZE(oe.affectedLabs) = 0)
    """)
    List<OverrideEvent> findActiveForLabInWeek(
        @Param("labId") Long labId,
        @Param("weekStart") LocalDate weekStart,
        @Param("weekEnd") LocalDate weekEnd
    );

    /**
     * Find active overrides by event IDs that affected a particular timetable slot's lab.
     * Used when deactivating — find all slots linked to an event.
     */
    List<OverrideEvent> findByIsActiveTrue();
}
