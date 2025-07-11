package com.aipms.service;

import com.aipms.domain.FireLog;
import com.aipms.dto.FireAlertDto;

import java.util.List;

public interface FireLogService {
    void saveFireLog(FireAlertDto dto);

    void saveFireLogFromScheduler(String cameraName, String location, String streamUrl);

    List<FireLog> getAllFireLogs();
}