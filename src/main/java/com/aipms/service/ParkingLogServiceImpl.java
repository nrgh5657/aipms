package com.aipms.service;

import com.aipms.domain.Member;
import com.aipms.domain.ParkingLog;
import com.aipms.domain.Payment;
import com.aipms.dto.ExitResponseDto;
import com.aipms.dto.ParkingLogFilterRequestDto;
import com.aipms.dto.ParkingLogWithMemberDto;
import com.aipms.dto.ParkingStatusDto;
import com.aipms.mapper.MemberMapper;
import com.aipms.mapper.ParkingLogMapper;
import com.aipms.mapper.PaymentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ParkingLogServiceImpl implements ParkingLogService {

    private final ParkingLogMapper parkingLogMapper;
    private final MemberMapper memberMapper;
    private final SubscriptionService subscriptionService;
    private final PaymentMapper paymentMapper;
    private final ReservationService reservationService;

    @Override
    public ExitResponseDto insertLog(ParkingLog log) {
        if (log.getCameraId() == 1) {
            processEntry(log);
            return new ExitResponseDto(true, "입차 완료", false, 0);
        } else if (log.getCameraId() == 2) {
            return processExit(log.getCarNumber());
        } else {
            throw new IllegalArgumentException("유효하지 않은 카메라 ID입니다.");
        }
    }

    @Override
    public void processEntry(ParkingLog log) {
        if (log.getEntryTime() == null) {
            log.setEntryTime(LocalDateTime.now()); // ✅ 먼저 설정
        }

        Member member = memberMapper.findByCarNumber(log.getCarNumber());
        System.out.println("🔍 조회된 member: " + (member != null ? member.getName() + "/" + member.getMemberId() : "❌ 없음"));

        if (member != null) {
            log.setMemberId(member.getMemberId());

            boolean hasSubscription = subscriptionService.isActiveSubscription(member.getMemberId());

            boolean hasDailyReservation = reservationService.hasDailyReservationToday(
                    member.getMemberId(), log.getEntryTime()
            );

            if (hasSubscription) {
                log.setParkingType("정기권");
            } else if (hasDailyReservation) {
                log.setParkingType("일주차");
            } else {
                log.setParkingType("일반");
            }
        } else {
            log.setMemberId(null);
            log.setParkingType("일반");
        }

        parkingLogMapper.insertLog(log);
    }

    @Override
    public ExitResponseDto processExit(String carNumber) {
        ParkingLog log = parkingLogMapper.findLatestUnexitedLog(carNumber);
        if (log == null) {
            return new ExitResponseDto(false, "출차할 주차 기록이 없습니다.", false, 0);
        }

        Long memberId = log.getMemberId();
        LocalDateTime now = LocalDateTime.now();

        // 1. 정기권 확인 || 예약자 확인
        String type = log.getParkingType();
        if ("정기권".equals(type) || "일주차".equals(type)) {
            log.setExitTime(now);
            parkingLogMapper.updateExitTime(log);
            return new ExitResponseDto(true, "출차 완료 (" + type + ")", false, 0);
        }

        // 2. 결제 확인
        Payment payment = paymentMapper.selectPaymentByEntryId(log.getId());
        int paid = (payment != null && payment.isPaid()) ? payment.getTotalFee() : 0;
        int actualFee = calculateFee(log.getEntryTime());

        if (paid < actualFee) {
            int extraFee = actualFee - paid;

            // 💡 출차는 아직 하지 않고 결제 요청 응답
            return new ExitResponseDto(false,
                    "결제 금액보다 현재 요금이 많습니다. 차액 결제가 필요합니다.",
                    true,
                    extraFee
            );
        }

        // 3. 요금 충분 → 출차 처리
        log.setExitTime(now);
        parkingLogMapper.updateExitTime(log);
        return new ExitResponseDto(true, "출차 완료", false, 0);
    }

    @Override
    public int countCurrentlyParkedCars() {
        return parkingLogMapper.countCurrentlyParkedCars();
    }

    @Override
    public ParkingStatusDto getCurrentParkingStatus(Long memberId) {
        ParkingLog log = parkingLogMapper.findLatestUnpaidByMemberId(memberId);
        if (log == null || log.getEntryTime() == null) return null;

        long minutes = Duration.between(log.getEntryTime(), LocalDateTime.now()).toMinutes();
        int fee = calculateFee(log.getEntryTime());

        ParkingStatusDto dto = new ParkingStatusDto();
        dto.setId(log.getId());
        dto.setCarNumber(log.getCarNumber());
        dto.setEntryTime(log.getEntryTime());
        dto.setDurationMinutes(minutes);
        dto.setEstimatedFee(fee);

        return dto;
    }

    @Override
    public List<ParkingLogWithMemberDto> getFilteredLogs(ParkingLogFilterRequestDto filter) {
        return parkingLogMapper.selectFilteredLogs(filter);
    }


    @Override
    public int countFilteredLogs(ParkingLogFilterRequestDto filter) {
        return parkingLogMapper.countFilteredLogs(filter);
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

    @Override
    public ParkingLog getCurrentUnpaidLog(Long memberId) {
        return parkingLogMapper.findLatestUnpaidByMemberId(memberId);
    }

    @Override
    public int calculateFee(LocalDateTime entryTime) {
        if (entryTime == null) return 0;
        long minutes = Duration.between(entryTime, LocalDateTime.now()).toMinutes();
        return (int) Math.ceil(minutes / 30.0) * 1000; // 30분당 1000원 예시
    }
}
