package com.aipms.service;

import com.aipms.dto.FireAlertDto;

public interface FireLogService {
    void saveFireLog(FireAlertDto dto);

    void saveFireLogFromScheduler(String cameraName, String location, String streamUrl);
}