package com.aipms.service;

import com.aipms.domain.FireLog;
import com.aipms.domain.Member;
import com.aipms.dto.FireAlertDto;
import com.aipms.dto.FireAlertTargetDto;
import com.aipms.dto.Page;
import com.aipms.mapper.FireLogMapper;
import com.aipms.mapper.MemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FireLogServiceImpl implements FireLogService{

    private final FireLogMapper fireLogMapper;
    private final MemberMapper memberMapper;
    private final KakaoMessageService kakaoMessageService;

    @Override
    public void saveFireLogAndNotifyAdmins(FireAlertDto dto) {
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

        List<Member> admins = memberMapper.findAdmins();

        for (Member admin : admins) {
            kakaoMessageService.sendMessageToMe(admin.getKakaoId(), dto);
        }
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

    @Override
    public FireAlertDto getLatestFireLog() {
        return fireLogMapper.findLatestLog();
    }

    @Override
    public void updateLogs(FireLog fireLog) {
        fireLogMapper.updateLogs(fireLog);
    }

    @Override
    public Page<FireLog> getPagedFireLogs(int page, int size) {
        int totalCount = fireLogMapper.countFireLogs();
        int offset = page * size;
        List<FireLog> logs = fireLogMapper.findFireLogsPaged(offset, size);

        return new Page<>(logs, totalCount, page, size);

    }


}
