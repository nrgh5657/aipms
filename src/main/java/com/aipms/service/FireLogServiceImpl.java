package com.aipms.service;

import com.aipms.domain.FireLog;
import com.aipms.domain.Member;
import com.aipms.dto.FireAlertDto;
import com.aipms.dto.PageDto;
import com.aipms.mapper.FireLogMapper;
import com.aipms.mapper.MemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FireLogServiceImpl implements FireLogService{

    private final FireLogMapper fireLogMapper;
    private final MemberMapper memberMapper;
    private final KakaoMessageService kakaoMessageService;

    @Override
    //화재 감지시 로그를 저장후 관리자에게 알림
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

    //화재 감지시 정기 로그에서 화재 감지 로그를 남김
    @Override
    public void saveFireLogFromScheduler(String cameraName, String location, String streamUrl) {

    }

    //카메라 기반 위치 정보 생성
    private String mapCameraIdToLocation(String cameraId) {
        switch (cameraId) {
            case "1": return "1층 주차장";
            case "2": return "2층 주차장";
            case "3": return "3층 주차장";
            default: return "알 수 없음";
        }
    }

    //모든 화재 기록 조회
    @Override
    public List<FireLog> getAllFireLogs() {
        return fireLogMapper.findAllFireLogs();
    }

    //최신 화재 기록 읽어오기
    @Override
    public FireAlertDto getLatestFireLog() {
        return fireLogMapper.findLatestLog();
    }

    //화재 감지 기록 정보 수정
    @Override
    public void updateLogs(FireLog fireLog) {
        fireLogMapper.updateLogs(fireLog);
    }

    //화재 감지 기록 페이징 처리
    @Override
    public PageDto<FireLog> getPagedFireLogs(int page, int size) {
        int totalCount = fireLogMapper.countFireLogs();
        int offset = page * size;
        List<FireLog> logs = fireLogMapper.findFireLogsPaged(offset, size);

        return new PageDto<>(logs, totalCount, page, size);

    }


}
