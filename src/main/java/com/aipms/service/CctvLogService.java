package com.aipms.service;

import com.aipms.domain.CctvStatusLogVO;
import com.aipms.dto.CctvLogDto;
import com.aipms.dto.CctvLogSearchRequestDto;
import com.aipms.dto.CctvLogStatisticsDto;
import com.aipms.dto.FireAlertDto;

import java.util.List;
import java.util.Map;

public interface CctvLogService {
    void saveRegularLogs(List<CctvStatusLogVO> logs);

    boolean isFireDetected(String cameraId);

    void saveFireLogAsRegular(FireAlertDto dto);

    List<CctvLogDto> getLatestLogs();

    List<CctvStatusLogVO> getAllLogs();

    Map<String, Object> getPagedLogs(CctvLogSearchRequestDto dto);

    CctvLogStatisticsDto getLogSummary();
}
