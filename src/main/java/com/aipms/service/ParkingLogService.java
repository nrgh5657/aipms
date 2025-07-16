package com.aipms.service;

import com.aipms.domain.ParkingLog;
import com.aipms.dto.ParkingLogWithMemberDto;

import java.util.List;

public interface ParkingLogService {
    void insertLog(ParkingLog log);
    List<ParkingLogWithMemberDto> getAllLogs();
}
