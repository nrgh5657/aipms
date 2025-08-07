package com.aipms.service;

import com.aipms.domain.Member;
import com.aipms.domain.ParkingLog;
import com.aipms.domain.Payment;
import com.aipms.dto.*;
import com.aipms.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParkingLogServiceImpl implements ParkingLogService {

    private final ParkingLogMapper parkingLogMapper;
    private final MemberMapper memberMapper;
    private final SubscriptionService subscriptionService;
    private final PaymentMapper paymentMapper;
    private final ReservationService reservationService;
    private final ReservationMapper reservationMapper;
    private final FeePolicyMapper feePolicyMapper;
    private final FeePolicyService feePolicyService;

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

        // ✅ 요금 정책 불러오기
        FeePolicyDto policy = feePolicyMapper.findActivePolicyByType("TIME");
        if (policy == null) {
            return new ExitResponseDto(false, "시간제 요금 정책이 없습니다.", false, 0);
        }

        int baseFee = policy.getBaseFee();              // ex. 1200원
        int unitMinutes = policy.getUnitTime();         // ex. 10분
        Integer maxFee = policy.getMaxFee();            // ex. 7200

        long minutes = ChronoUnit.MINUTES.between(log.getEntryTime(), now);
        int units = (int) Math.ceil((double) minutes / unitMinutes);
        int actualFee = baseFee * units;

        if (maxFee != null) {
            actualFee = Math.min(actualFee, maxFee);
        }

        if (actualFee < 100) {
            actualFee = 100;
        }

        // 3. 차액 확인
        if (paid < actualFee) {
            int extraFee = actualFee - paid;

            // 💡 출차는 아직 하지 않고 차액 결제 요청
            return new ExitResponseDto(false,
                    "결제 금액보다 현재 요금이 많습니다. 차액 결제가 필요합니다.",
                    true,
                    extraFee
            );
        }

        // 4. 요금 충분 → 출차 처리
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
        System.out.println("🚗 [getCurrentParkingStatus] memberId = " + memberId);

        ParkingLog log = parkingLogMapper.findLatestUnpaidByMemberId(memberId);
        if (log == null) {
            System.out.println("⚠️ 미결제 주차 로그가 없습니다.");
            return null;
        }

        System.out.println("✅ 주차 로그 조회 성공 → ID: " + log.getId());
        System.out.println("▶ 차량번호: " + log.getCarNumber());
        System.out.println("▶ 입차시간: " + log.getEntryTime());

        if (log.getEntryTime() == null) {
            System.out.println("❌ EntryTime이 null입니다.");
            return null;
        }

        LocalDateTime now = LocalDateTime.now();
        long minutes = Duration.between(log.getEntryTime(), now).toMinutes();
        System.out.println("⏱️ 경과 시간 (분): " + minutes);

        FeePolicyDto policy = feePolicyMapper.findActivePolicyByType("TIME");
        if (policy == null) {
            System.out.println("❌ 시간제 요금 정책을 찾을 수 없습니다.");
            return null;
        }

        int baseFee = policy.getBaseFee();
        int unitMinutes = policy.getUnitTime();
        Integer maxFee = policy.getMaxFee();

        System.out.println("💰 요금 정책 → base: " + baseFee + ", unit: " + unitMinutes + ", max: " + maxFee);

        int units = (int) Math.ceil((double) minutes / unitMinutes);
        int fee = baseFee * units;

        if (maxFee != null) {
            fee = Math.min(fee, maxFee);
        }

        if (fee < 100) {
            fee = 100;
        }

        ParkingStatusDto dto = new ParkingStatusDto();
        dto.setId(log.getId());
        dto.setCarNumber(log.getCarNumber());
        dto.setEntryTime(log.getEntryTime());
        dto.setDurationMinutes(minutes);
        dto.setEstimatedFee(fee);

        System.out.println("🎯 예상 요금 계산 완료 → " + fee + "원");

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

        for (ParkingLogWithMemberDto dto : logs) {
            String type = "일반";

            if (dto.getMemberId() != null) {
                // 정기권
                if ("월주차".equals(dto.getSubscription())) {
                    type = "월주차";
                }
                // 정기권이 아닌데, 예약 내역이 존재하면 => 일주차
                else if (reservationMapper.existsReservationForTime(
                        dto.getMemberId(), dto.getEntryTime())) {
                    type = "일주차";
                }
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
    public int calculateFee(ParkingLog pLog) {
        LocalDateTime entry = pLog.getEntryTime();
        LocalDateTime exit = pLog.getExitTime() != null ? pLog.getExitTime() : LocalDateTime.now();

        FeePolicyDto policy = feePolicyService.getActivePolicyByType("TIME");
        if (policy == null) {
            log.warn("❌ 시간제 요금 정책 없음 → 기본 0원 처리");
            return 0;
        }

        int unitMinutes = policy.getUnitTime();
        int baseFee = policy.getBaseFee();
        Integer maxFee = policy.getMaxFee();

        long durationMinutes = Duration.between(entry, exit).toMinutes();
        int units = (int) Math.ceil((double) durationMinutes / unitMinutes);
        int fee = baseFee * units;

        if (maxFee != null) {
            fee = Math.min(fee, maxFee);
        }

        return Math.max(fee, 100);
    }
}
