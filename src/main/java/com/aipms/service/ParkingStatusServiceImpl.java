package com.aipms.service;

import com.aipms.dto.ParkingStatusResponseDto;
import com.aipms.mapper.ParkingStatusMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ParkingStatusServiceImpl implements ParkingStatusService {

    private final ParkingStatusMapper parkingStatusMapper;

    @Override
    public ParkingStatusResponseDto getParkingStatus(Long memberId) {
        ParkingStatusResponseDto dto = new ParkingStatusResponseDto();

        dto.setCurrentStatus(parkingStatusMapper.getCurrentStatus(memberId));
        dto.setReservationStatus(parkingStatusMapper.getReservationStatus(memberId));
        dto.setHistory(parkingStatusMapper.getParkingHistory(memberId));

        return dto;
    }
}
