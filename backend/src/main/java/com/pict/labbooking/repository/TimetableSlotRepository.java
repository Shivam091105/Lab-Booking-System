package com.pict.labbooking.repository;

import com.pict.labbooking.entity.TimetableSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableSlotRepository extends JpaRepository<TimetableSlot, Long> {
    List<TimetableSlot> findByLabId(Long labId);
    List<TimetableSlot> findByLabIdAndDayOfWeek(Long labId, String dayOfWeek);
}
