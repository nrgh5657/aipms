package com.aipms.scheduler;

import com.aipms.domain.CctvStatusLogVO;
import com.aipms.service.CctvLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CctvLogScheduler {
    private final CctvLogService cctvLogService;

    @Scheduled(fixedRate =300000)
    public void saveCctvStatusLogs() {
        log.info("CCTV 정기로그 기록 시작");
        List<CctvStatusLogVO> logs = Arrays.asList(
                createLog("1층 주차장 - 동쪽", "1층 동쪽 구역", "ONLINE"),
                createLog("1층 주차장 - 서쪽", "1층 서쪽 구역", "ONLINE"),
                createLog("2층 주차장 - 중앙", "2층 중앙 구역", "ONLINE")

        );
        cctvLogService.saveRegularLogs(logs);
    }
    private CctvStatusLogVO createLog(String cameraName, String location, String status) {
        CctvStatusLogVO vo = new CctvStatusLogVO();
        vo.setCameraName(cameraName);
        vo.setLocation(location);
        vo.setStatus(status);
        vo.setLastConnected(LocalDateTime.now());
        return vo;
    }
}
