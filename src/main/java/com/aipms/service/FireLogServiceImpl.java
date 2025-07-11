package com.aipms.service;

import com.aipms.domain.FireLog;
import com.aipms.dto.FireAlertDto;
import com.aipms.mapper.FireLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FireLogServiceImpl implements FireLogService{

    private final FireLogMapper fireLogMapper;

    @Override
    public void saveFireLog(FireAlertDto dto) {
        LocalDateTime now = LocalDateTime.now();

        // cameraId → location 변환
        String location = mapCameraIdToLocation(dto.getCameraId());

        FireLog log = FireLog.builder()
                .label(dto.getLabel())
                .confidence(dto.getConfidence())
                .videoUrl(dto.getVideoUrl())
                .imagePath(dto.getImagePath())
                .location(location)
                .adminJudgment("판단 대기")       // 초기 기본값
                .alertStatus("전송 완료")         // 실제 로직 따라 변경 가능
                .alertTime(now)                   // 또는 null
                .notes("AI 자동 감지")             // 기본 메모
                .detectedAt(now)
                .createdAt(now)
                .build();

        fireLogMapper.insertFireLog(log);
    }

    @Override
    public void saveFireLogFromScheduler(String cameraName, String location, String streamUrl) {

    }

    private String mapCameraIdToLocation(String cameraId) {
        switch (cameraId) {
            case "1": return "1층 주차장";
            case "2": return "2층 주차장";
            case "3": return "3층 주차장";
            default: return "알 수 없음";
        }
    }

    @Override
    public List<FireLog> getAllFireLogs() {
        return fireLogMapper.findAllFireLogs();
    }
}
