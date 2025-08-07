package com.aipms.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class FireDetectionInitRunner {

    private final RestTemplate restTemplate = new RestTemplate();

    @EventListener(ApplicationReadyEvent.class)
    public void initFireDetection() {
        log.info("🚀 서버 시작 시 화재 감지 자동 요청 시작");

        List<Map<String, String>> cameras = List.of(
                Map.of("camera_id", "1", "video_url", "http://192.168.10.81:8080/video"),
                Map.of("camera_id", "2", "video_url", "0"),
                Map.of("camera_id", "3", "video_url", "1")
        );

        for (Map<String, String> cam : cameras) {
            try {
                Map<String, Object> request = Map.of(
                        "camera_id", cam.get("camera_id"),
                        "video_url", cam.get("video_url"),
                        "callback_url", "http://localhost:8080/fireDetect/detected"
                );

                restTemplate.postForEntity("http://localhost:5000/stream-fire-detect", request, String.class);
                log.info("✅ 감지 요청 전송 완료 - 카메라 {}", cam.get("camera_id"));
            } catch (Exception e) {
                log.warn("❌ 감지 요청 실패 - 카메라 {}: {}", cam.get("camera_id"), e.getMessage());
            }
        }
    }
}
