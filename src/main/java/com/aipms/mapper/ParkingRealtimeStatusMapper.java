package com.aipms.mapper;

import com.aipms.dto.ParkingRealtimeStatusResponseDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ParkingRealtimeStatusMapper {
    List<ParkingRealtimeStatusResponseDto> getZoneStatusList();
}
