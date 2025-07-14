package com.aipms.service;

import com.aipms.domain.FireLog;
import com.aipms.dto.FireAlertDto;
import com.aipms.dto.FireAlertTargetDto;
import com.aipms.dto.Page;

import java.util.List;

public interface FireLogService {
    void saveFireLogAndNotifyAdmins(FireAlertDto dto);

    void saveFireLogFromScheduler(String cameraName, String location, String streamUrl);

    List<FireLog> getAllFireLogs();

    FireAlertDto getLatestFireLog();

    void updateLogs(FireLog fireLog);

    Page<FireLog> getPagedFireLogs(int page, int size);



}