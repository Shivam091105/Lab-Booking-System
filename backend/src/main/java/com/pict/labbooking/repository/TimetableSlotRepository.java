package com.pict.labbooking.repository;

import com.pict.labbooking.entity.TimetableSlot;
import org.springframework.data.jpa.repository.JpaRepository;
<<<<<<< HEAD
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalTime;
=======
import org.springframework.stereotype.Repository;

>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
import java.util.List;

@Repository
public interface TimetableSlotRepository extends JpaRepository<TimetableSlot, Long> {
    List<TimetableSlot> findByLabId(Long labId);
    List<TimetableSlot> findByLabIdAndDayOfWeek(Long labId, String dayOfWeek);
<<<<<<< HEAD

    /** Find all slots for a lab on a given day that overlap a time window */
    @Query("""
        SELECT ts FROM TimetableSlot ts
        WHERE ts.lab.id = :labId
          AND ts.dayOfWeek = :dayOfWeek
          AND ts.startTime < :endTime
          AND ts.endTime > :startTime
    """)
    List<TimetableSlot> findOverlappingSlots(
        @Param("labId") Long labId,
        @Param("dayOfWeek") String dayOfWeek,
        @Param("startTime") LocalTime startTime,
        @Param("endTime") LocalTime endTime
    );

    /** Find all currently overridden slots for a given override event */
    List<TimetableSlot> findByOverriddenByEventId(Long overrideEventId);
=======
>>>>>>> 280f57a752d05bcd2d25b47e63464b5860875fbe
}
