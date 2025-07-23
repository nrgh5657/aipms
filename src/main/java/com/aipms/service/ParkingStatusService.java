package com.aipms.service;

import com.aipms.dto.ParkingStatusResponseDto;

public interface ParkingStatusService {
    ParkingStatusResponseDto getParkingStatus(Long memberId); // 사용자 ID 기반

}
