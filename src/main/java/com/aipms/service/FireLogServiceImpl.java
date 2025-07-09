package com.aipms.service;

import com.aipms.domain.FireLog;
import com.aipms.dto.FireAlertDto;
import com.aipms.mapper.FireLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class FireLogServiceImpl implements FireLogService{

    private final FireLogMapper fireLogMapper;

    @Override
    public void saveFireLog(FireAlertDto dto) {
        LocalDateTime now = LocalDateTime.now();

        FireLog log = FireLog.builder()
                .label(dto.getLabel())
                .confidence(dto.getConfidence())
                .videoUrl(dto.getVideoUrl())
                .imagePath(dto.getImagePath())
                .detectedAt(now)
                .createdAt(now)
                .build();

        fireLogMapper.insertFireLog(log);
    }

    @Override
    public void saveFireLogFromScheduler(String cameraName, String location, String streamUrl) {

    }
}
