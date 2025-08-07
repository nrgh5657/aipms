package com.aipms.service;

import com.aipms.dto.ParkingRealtimeStatusResponseDto;

import java.util.List;

public interface ParkingRealtimeStatusService {
    List<ParkingRealtimeStatusResponseDto> getRealtimeZoneStatus();
}
