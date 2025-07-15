package com.aipms.mapper;

import com.aipms.domain.Parking;
import org.apache.ibatis.annotations.Mapper;

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
}
