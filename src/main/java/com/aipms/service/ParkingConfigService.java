package com.aipms.service;

import com.aipms.dto.ParkingConfigDto;

public interface ParkingConfigService {
    void setConfig(ParkingConfigDto dto);

    ParkingConfigDto getConfig();
}
