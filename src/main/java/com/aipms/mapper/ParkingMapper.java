package com.aipms.mapper;

import com.aipms.domain.Parking;
import com.aipms.dto.ParkingStatusDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ParkingMapper {
    void insert(Parking parking);
    Parking selectById(Long id);
    List<Parking> selectAll();
    void update(Parking parking);
    void delete(Long id);
    int countTotalSlots();
    int countOccupiedSlots();
    int increaseOccupiedCount(@Param("parkingId") Long parkingId);
    int decreaseOccupiedCount(@Param("parkingId") Long parkingId);
    List<ParkingStatusDto> selectParkingStatus();
    int sumTotalSpaces();
    int sumOccupiedCount();
}
