package com.aipms.service;

import com.aipms.domain.Member;
import com.aipms.domain.ParkingLog;
import com.aipms.dto.ParkingLogWithMemberDto;
import com.aipms.mapper.MemberMapper;
import com.aipms.mapper.ParkingLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ParkingLogServiceImpl implements ParkingLogService {

    private final ParkingLogMapper parkingLogMapper;
    private final MemberMapper memberMapper;

    @Override
    public void insertLog(ParkingLog log) {
        Member member = memberMapper.findByCarNumber(log.getCarNumber());

        if (member != null) {
            log.setMemberId(member.getMemberId());
        } else {
            log.setMemberId(null);
        }

        if (log.getCameraId() == 1) {
            // ✅ 입차 시간 자동 설정
            if (log.getEntryTime() == null) {
                log.setEntryTime(LocalDateTime.now());
            }

            if (log.getParkingType() == null || log.getParkingType().isBlank()) {
                log.setParkingType("일반");
            }

            parkingLogMapper.insertLog(log);

        } else if (log.getCameraId() == 2) {
            ParkingLog existing = parkingLogMapper.findLatestUnexitedLog(log.getCarNumber());
            if (existing != null) {
                // 출차 시간으로 사용
                LocalDateTime exitTime = log.getEntryTime() != null ? log.getEntryTime() : LocalDateTime.now();
                existing.setExitTime(exitTime);
                parkingLogMapper.updateExitTime(existing);
            } else {
                throw new IllegalStateException("출차 처리할 입차 로그가 없습니다.");
            }

        } else {
            throw new IllegalArgumentException("유효하지 않은 카메라 ID입니다.");
        }
    }

    @Override
    public List<ParkingLogWithMemberDto> getAllLogs() {
        return parkingLogMapper.selectAllWithMember();
    }
}
