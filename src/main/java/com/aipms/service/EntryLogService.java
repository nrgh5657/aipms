package com.aipms.service;

import com.aipms.domain.EntryLog;
import com.aipms.dto.EntryLogDto;

import java.util.List;

public interface EntryLogService {
    void logEntry(EntryLogDto dto);
    void logExit(Long vehicleId);
    List<EntryLog> getLogsByParking(Long parkingId);
}
