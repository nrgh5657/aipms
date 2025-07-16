package com.aipms.mapper;

import com.aipms.domain.ParkingLog;
import com.aipms.dto.ParkingLogWithMemberDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ParkingLogMapper {
    void insertLog(ParkingLog log);
    List<ParkingLogWithMemberDto> selectAllWithMember();  // member.name 포함

    ParkingLog findLatestUnexitedLog(String carNumber);

    void updateExitTime(ParkingLog existing);
}
