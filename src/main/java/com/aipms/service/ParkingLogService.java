package com.aipms.service;

import com.aipms.domain.ParkingLog;
import com.aipms.dto.ExitResponseDto;
import com.aipms.dto.ParkingLogFilterRequestDto;
import com.aipms.dto.ParkingLogWithMemberDto;
import com.aipms.dto.ParkingStatusDto;

import java.time.LocalDateTime;
import java.util.List;

public interface ParkingLogService {
    ExitResponseDto insertLog(ParkingLog log);
    List<ParkingLogWithMemberDto> getPagedLogs(int page, int size);
    int getTotalLogCount();

    ParkingLog getCurrentUnpaidLog(Long memberId);

    int calculateFee(LocalDateTime entryTime);

    void processEntry(ParkingLog log);

    ExitResponseDto processExit(String carNumber);


    int countCurrentlyParkedCars();

    ParkingStatusDto getCurrentParkingStatus(Long memberId);

    List<ParkingLogWithMemberDto> getFilteredLogs(ParkingLogFilterRequestDto filter);

    int countFilteredLogs(ParkingLogFilterRequestDto filter);
}
