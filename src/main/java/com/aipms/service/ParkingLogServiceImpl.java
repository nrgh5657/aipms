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
        System.out.println("🚗 차량번호: [" + log.getCarNumber() + "]");

        Member member = memberMapper.findByCarNumber(log.getCarNumber());
        System.out.println("🔍 조회된 member: " + (member != null ? member.getName() + "/" + member.getMemberId() : "❌ 없음"));

        if (member != null) {
            log.setMemberId(member.getMemberId());
        } else {
            log.setMemberId(null);
        }

        if (log.getCameraId() == 1) {
            if (log.getEntryTime() == null) {
                log.setEntryTime(LocalDateTime.now());
            }

            parkingLogMapper.insertLog(log);

        } else if (log.getCameraId() == 2) {
            ParkingLog existing = parkingLogMapper.findLatestUnexitedLog(log.getCarNumber());
            if (existing != null) {
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
    public List<ParkingLogWithMemberDto> getPagedLogs(int page, int size) {
        int offset = (page - 1) * size;
        List<ParkingLogWithMemberDto> logs = parkingLogMapper.selectPagedLogs(size, offset);

        // 주차 유형 결정 로직 유지
        for (ParkingLogWithMemberDto dto : logs) {
            String type = "일반";
            if (dto.getMemberId() != null && dto.getSubscription() == 1) {
                type = "월주차";
            }
            dto.setParkingType(type);
        }

        return logs;
    }

    @Override
    public int getTotalLogCount() {
        return parkingLogMapper.countAllLogs();
    }
}
