package com.aipms.service;

import com.aipms.domain.CctvStatusLogVO;
import com.aipms.dto.CctvLogDto;
import com.aipms.dto.CctvLogSearchRequestDto;
import com.aipms.dto.CctvLogStatisticsDto;
import com.aipms.dto.FireAlertDto;
import com.aipms.mapper.CctvStatusLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CctvLogServiceImpl implements CctvLogService {
    private final CctvStatusLogMapper cctvStatusLogMapper;

    @Override
    public void saveRegularLogs(List<CctvStatusLogVO> logs) {
        for (CctvStatusLogVO log : logs) {
            log.setLogType("REGULAR"); // 정기 로그임을 명시
            cctvStatusLogMapper.insertCctvLog(log);
        }
    }

    @Override
    public boolean isFireDetected(String cameraId) {
        try {
            String url = "http://localhost:5000/fire-status?camera=" + cameraId;
            RestTemplate restTemplate = new RestTemplate();
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                Map<String, Object> body = response.getBody();
                return Boolean.TRUE.equals(body.get("fire"));
            }
        } catch (Exception e) {
            log.warn("🔥 화재 상태 질의 실패 (cameraId: {}): {}", cameraId, e.getMessage());
        }
        return false;
    }

    // 카메라 ID → 카메라 이름 매핑
    private String mapCameraIdToName(String cameraId) {
        switch (cameraId) {
            case "1": return "1층 주차장 동쪽";
            case "2": return "1층 주차장 서쪽";
            case "3": return "2층 주차장 중앙";
            default: return "알 수 없음";
        }
    }

    //카메라 기반 위치 정보 생성
    private String mapCameraIdToLocation(String cameraId) {
        switch (cameraId) {
            case "1": return "1층 주차장 동쪽";
            case "2": return "1층 주차장 서쪽";
            case "3": return "2층 주차장 중앙";
            default: return "알 수 없음";
        }
    }

    public void saveFireLogAsRegular(FireAlertDto dto) {
        CctvStatusLogVO cctvLog = new CctvStatusLogVO();
        cctvLog.setCameraName(mapCameraIdToName(dto.getCameraId()));   // ✅ 이름 매핑
        cctvLog.setLocation(mapCameraIdToLocation(dto.getCameraId())); // ✅ 위치 매핑
        cctvLog.setStatus("화재");
        cctvLog.setRecordStatus("RECORDING");                  // 감지 중이므로
        cctvLog.setLogType("REGULAR");
        cctvLog.setLastConnected(LocalDateTime.now());
        cctvLog.setLastCheckedAt(LocalDateTime.now());
        cctvLog.setCreatedAt(LocalDateTime.now());

        cctvStatusLogMapper.insertCctvLog(cctvLog);  // 단건 insert 쿼리 호출
    }

    @Override
    public List<CctvLogDto> getLatestLogs() {
        return cctvStatusLogMapper.getLatestLogsPerCctv();

    }

    @Override
    public List<CctvStatusLogVO> getAllLogs() {
        return cctvStatusLogMapper.findAllLogs();
    }

    @Override
    public Map<String, Object> getPagedLogs(CctvLogSearchRequestDto dto) {
        int offset = (dto.getPage() - 1) * dto.getSize();
        int total = cctvStatusLogMapper.countLogs(dto);
        List<CctvStatusLogVO> logs = cctvStatusLogMapper.findPagedLogs(dto, offset, dto.getSize());

        Map<String, Object> result = new HashMap<>();
        result.put("total", total);
        result.put("page", dto.getPage());
        result.put("size", dto.getSize());
        result.put("logs", logs);
        return result;
    }

    @Override
    public CctvLogStatisticsDto getLogSummary() {
        CctvLogStatisticsDto dto = new CctvLogStatisticsDto();
        dto.setTodayLogs(cctvStatusLogMapper.countTodayLogs());
        dto.setNormalCount(cctvStatusLogMapper.countLogsByStatus("정상"));
        dto.setErrorCount(cctvStatusLogMapper.countLogsByStatus("스트리밍 오류"));
        dto.setFireLogCount(cctvStatusLogMapper.countLogsByStatus("화재"));
        return dto;

    }
}
