package com.aipms.service;

import com.aipms.dto.ParkingRealtimeStatusResponseDto;
import com.aipms.mapper.ParkingRealtimeStatusMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ParkingRealtimeStatusServiceImpl implements ParkingRealtimeStatusService {

    private final ParkingRealtimeStatusMapper statusMapper;

    @Override
    public List<ParkingRealtimeStatusResponseDto> getRealtimeZoneStatus() {
        return statusMapper.getZoneStatusList();
    }
}
