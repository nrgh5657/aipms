package com.aipms.service;

import com.aipms.domain.FireLog;
import com.aipms.dto.FireAlertDto;
import com.aipms.dto.PageDto;

import java.util.List;

public interface FireLogService {
    //화재 감지시 로그를 저장후 관리자에게 알림
    void saveFireLogAndNotifyAdmins(FireAlertDto dto);
    
    //화재 감지시 정기 로그에서 화재 감지 로그를 남김
    void saveFireLogFromScheduler(String cameraName, String location, String streamUrl);
    
    //모든 화재 감지 기록 조회
    List<FireLog> getAllFireLogs();
    
    //최신 화재 기록 읽어오기
    FireAlertDto getLatestFireLog();
    
    //화재 감지 기록 정보 수정
    void updateLogs(FireLog fireLog);
    
    //화재 감지 기록 페이징 처리
    PageDto<FireLog> getPagedFireLogs(int page, int size);



}