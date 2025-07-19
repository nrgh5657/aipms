package com.aipms.service;

import com.aipms.domain.ParkingLog;
import com.aipms.dto.ExitResponseDto;
import com.aipms.dto.ParkingLogWithMemberDto;

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


}
