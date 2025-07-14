package com.aipms.mapper;

import com.aipms.domain.FireLog;
import com.aipms.dto.FireAlertDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FireLogMapper {
    //화재 감지 로그 저장
    void insertFireLog(FireLog fireLog);
    //화재 감지 로그 읽어오기
    List<FireLog> findAllFireLogs();

    void updateLogs(FireLog fireLog);

    FireAlertDto findLatestLog();

    List<FireLog> findFireLogsPaged(@Param("offset") int offset, @Param("limit") int limit);

    int countFireLogs();
}
