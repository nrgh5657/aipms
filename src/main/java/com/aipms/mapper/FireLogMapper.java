package com.aipms.mapper;

import com.aipms.domain.FireLog;
import com.aipms.dto.FireAlertDto;
import com.aipms.dto.FireAlertLogRequestDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface FireLogMapper {
    //화재 감지 로그 저장
    void insertFireLog(FireLog fireLog);
    //화재 감지 로그 읽어오기
    List<FireLog> findAllFireLogs();
        
    //화재 감지 로그 수정
    void updateLogs(FireLog fireLog);
    
    //최신 로그 읽어오기
    FireAlertDto findLatestLog();
    
    //화재 감지 로그 페이징 처리
    List<FireAlertDto> getPagedFireLogs(FireAlertLogRequestDto req);
    int countFireLogs(FireAlertLogRequestDto req);
}
