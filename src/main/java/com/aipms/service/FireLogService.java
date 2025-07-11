package com.aipms.service;

import com.aipms.domain.FireLog;
import com.aipms.dto.FireAlertDto;
import com.aipms.dto.FireAlertTargetDto;

import java.util.List;

public interface FireLogService {
    void saveFireLog(FireAlertDto dto);

    void saveFireLogFromScheduler(String cameraName, String location, String streamUrl);

    List<FireLog> getAllFireLogs();

    void updateLogs(FireLog fireLog);



}