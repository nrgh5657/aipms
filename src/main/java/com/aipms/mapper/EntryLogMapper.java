package com.aipms.mapper;

import com.aipms.domain.EntryLog;
import org.apache.ibatis.annotations.Mapper;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface EntryLogMapper {
    void insertEntryLog(EntryLog log);
    void updateExitTime(Long entryId, LocalDateTime exitTime);
    EntryLog selectActiveEntryByVehicle(Long vehicleId);
    List<EntryLog> selectLogsByParkingId(Long parkingId);
}
