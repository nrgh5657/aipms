package com.aipms.service;

import com.aipms.domain.CctvStatusLogVO;
import com.aipms.dto.FireAlertDto;
import com.aipms.mapper.CctvStatusLogMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
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
    public void saveFireLogAsRegular(FireAlertDto dto) {
        CctvStatusLogVO log = new CctvStatusLogVO();

        log.setCameraName("카메라 " + dto.getVideoUrl());  // camera_id로 대체 가능
        log.setLocation("화재 감지 위치");                // 필요 시 dto에서 유추
        log.setStatus("화재");
        log.setRecordStatus("RECORDING");                  // 감지 중이므로
        log.setLogType("REGULAR");
        log.setLastConnected(LocalDateTime.now());
        log.setLastCheckedAt(LocalDateTime.now());
        log.setCreatedAt(LocalDateTime.now());

        cctvStatusLogMapper.insertCctvLog(log);  // 단건 insert 쿼리 호출
    }

}
