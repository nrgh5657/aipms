package com.aipms.mapper;

import com.aipms.domain.FireLog;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface FireLogMapper {
    //화재 감지 로그 저장
    void insertFireLog(FireLog fireLog);
    //화재 감지 로그 읽어오기
    List<FireLog> findAllFireLogs();
}
