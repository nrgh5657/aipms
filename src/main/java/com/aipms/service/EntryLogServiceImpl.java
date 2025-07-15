package com.aipms.service;

import com.aipms.domain.EntryLog;
import com.aipms.dto.EntryLogDto;
import com.aipms.mapper.EntryLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EntryLogServiceImpl implements EntryLogService {

    private final EntryLogMapper entryLogMapper;

    @Override
    public void logEntry(EntryLogDto dto) {
        EntryLog log = new EntryLog();
        log.setVehicleId(dto.getVehicleId());
        log.setParkingId(dto.getParkingId());
        log.setEntryTime(LocalDateTime.now());
        log.setAiDetected(dto.getAiDetected());
        log.setPaymentId(dto.getPaymentId());

        entryLogMapper.insertEntryLog(log);
    }

    @Override
    public void logExit(Long vehicleId) {
        EntryLog latest = entryLogMapper.selectActiveEntryByVehicle(vehicleId);
        if (latest != null) {
            entryLogMapper.updateExitTime(latest.getEntryId(), LocalDateTime.now());
        }
    }

    @Override
    public List<EntryLog> getLogsByParking(Long parkingId) {
        return entryLogMapper.selectLogsByParkingId(parkingId);
    }
}
