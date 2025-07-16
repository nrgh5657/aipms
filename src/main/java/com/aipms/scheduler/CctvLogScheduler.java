package com.aipms.scheduler;

import com.aipms.domain.CctvStatusLogVO;
import com.aipms.service.CctvLogService;
import com.aipms.service.FireLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.net.HttpURLConnection;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
//cctv정기기록 5분마다 정기기록을 남기도록 하는 코드
public class CctvLogScheduler {
    
    private final CctvLogService cctvLogService;
    private final FireLogService fireLogService;

    @Scheduled(fixedRate = 300000)
    public void saveCctvStatusLogs() {
        log.info("📅 CCTV 정기로그 기록 시작");

        List<CctvStatusLogVO> logs = Arrays.asList(
                createLog("1", "1층 주차장 - 동쪽", "1층 동쪽 구역", "http://192.168.10.81:8080/video"),
                createLog("2", "1층 주차장 - 서쪽", "1층 서쪽 구역", "http://192.168.10.81:8080/video"),
                createLog("3", "2층 주차장 - 중앙", "2층 중앙 구역", "http://192.168.10.81:8080/video")
        );

        cctvLogService.saveRegularLogs(logs);
    }

    private CctvStatusLogVO createLog(String cameraId, String cameraName, String location, String streamUrl) {
        CctvStatusLogVO vo = new CctvStatusLogVO();
        vo.setCameraName(cameraName);
        vo.setLocation(location);
        vo.setLastConnected(LocalDateTime.now());
        vo.setLastCheckedAt(LocalDateTime.now());
        vo.setLogType("REGULAR");

        boolean isStreaming = checkStreamOnline(streamUrl);
        vo.setRecordStatus(isStreaming ? "RECORDING" : "NOT_RECORDING");

        if (isStreaming) {
            boolean fireDetected = cctvLogService.isFireDetected(cameraId);  // 🔥 감지 상태만 조회

            if (fireDetected) {
                vo.setStatus("화재");

                // 🔥 화재 로그도 저장
                fireLogService.saveFireLogFromScheduler(cameraName, location, streamUrl);
            } else {
                vo.setStatus("정상");
            }

        } else {
            vo.setStatus("스트리밍 오류");
        }

        return vo;
    }

    private boolean checkStreamOnline(String url) {
        try {
            URL stream = new URL(url);
            HttpURLConnection connection = (HttpURLConnection) stream.openConnection();
            connection.setConnectTimeout(3000);
            connection.connect();
            return (connection.getResponseCode() == 200);
        } catch (Exception e) {
            return false;
        }
    }
}
