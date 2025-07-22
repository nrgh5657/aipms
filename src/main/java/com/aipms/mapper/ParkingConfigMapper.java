package com.aipms.mapper;

import com.aipms.dto.ParkingConfigDto;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ParkingConfigMapper {
    void setConfig(ParkingConfigDto dto);

    ParkingConfigDto getConfig();
}
