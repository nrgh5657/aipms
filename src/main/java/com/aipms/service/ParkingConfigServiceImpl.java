package com.aipms.service;

import com.aipms.dto.ParkingConfigDto;
import com.aipms.mapper.ParkingConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ParkingConfigServiceImpl implements ParkingConfigService {
    private final ParkingConfigMapper parkingConfigMapper;

    @Override
    public void setConfig(ParkingConfigDto dto) {
        int monthly = dto.getFixedSubscriptionSpaces();
        int total = dto.getTotalSpaces();

        if (monthly > total) {
            throw new IllegalArgumentException("월주차 한도는 전체 주차 한도보다 클 수 없습니다.");
        }

        parkingConfigMapper.setConfig(dto);
    }

    @Override
    public ParkingConfigDto getConfig() {
        ParkingConfigDto config = parkingConfigMapper.getConfig();
        if (config == null) {
            config = new ParkingConfigDto();
            config.setTotalSpaces(0);
            config.setFixedSubscriptionSpaces(0);
        }
        return config;
    }
}
