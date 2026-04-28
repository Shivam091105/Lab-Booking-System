package com.pict.labbooking.repository;

import com.pict.labbooking.entity.Lab;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LabRepository extends JpaRepository<Lab, Long> {
    Optional<Lab> findByRoomNumber(String roomNumber);
    List<Lab> findByIsActiveTrue();
}
