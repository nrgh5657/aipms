package com.aipms.mapper;

import com.aipms.domain.ParkingLog;
import com.aipms.dto.ParkingLogWithMemberDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ParkingLogMapper {
    void insertLog(ParkingLog log);
    List<ParkingLogWithMemberDto> selectPagedLogs(@Param("limit") int limit, @Param("offset") int offset);

    int countAllLogs();

    ParkingLog findLatestUnexitedLog(String carNumber);

    void updateExitTime(ParkingLog existing);
}
