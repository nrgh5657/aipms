package com.aipms.service;

import com.aipms.domain.ParkingLog;
import com.aipms.mapper.ParkingConfigMapper;
import com.aipms.mapper.ParkingLogMapper;
import com.aipms.mapper.ReservationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParkingAvailabilityServiceImpl implements ParkingAvailabilityService {

    private final ReservationMapper reservationMapper;
    private final ParkingLogMapper parkingLogMapper;
    private final ParkingConfigMapper parkingConfigMapper;

    @Override
    public int getAvailableNormalSpots() {
        int total = parkingConfigMapper.getConfig().getTotalSpaces();
        int fixed = parkingConfigMapper.getConfig().getFixedSubscriptionSpaces();

        int normalSpots = total - fixed;
        int activeReservations = reservationMapper.countActiveReservations();
        int activeParkingLogs = parkingLogMapper.countCurrentlyParkedCars(); // 출차 안 된 차량 수

        return normalSpots - activeReservations - activeParkingLogs;
    }

    @Override
    public boolean isReservableForPeriod(LocalDate startDate, LocalDate endDate, List<LocalDate> insufficientDates) {
        int total = parkingConfigMapper.getConfig().getTotalSpaces();
        int fixed = parkingConfigMapper.getConfig().getFixedSubscriptionSpaces();
        int normalSpots = total - fixed;

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        Map<LocalDate, Integer> reservedMap = parseDateCountList(
                reservationMapper.getDailyReservationCountByDate(startDate, endDate), formatter
        );

        Map<LocalDate, Integer> parkedMap = parseDateCountList(
                parkingLogMapper.getParkedCarCountByDateList(startDate, endDate), formatter
        );

        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
            int reserved = reservedMap.getOrDefault(d, 0);
            int parked = parkedMap.getOrDefault(d, 0);

            if (reserved + parked >= normalSpots) {
                log.info("❌ 예약 불가 - 날짜: {}, 예약: {}, 입차: {}, 한도: {}", d, reserved, parked, normalSpots);
                insufficientDates.add(d); // ✅ 여기서 추가
            }
        }

        return insufficientDates.isEmpty(); // ✅ 모두 가능하면 true, 하나라도 막히면 false
    }

    private Map<LocalDate, Integer> parseDateCountList(List<Map<String, Object>> rawList, DateTimeFormatter formatter) {
        Map<LocalDate, Integer> result = new HashMap<>();

        for (Map<String, Object> row : rawList) {
            Object rawDate = row.get("date");
            LocalDate date;

            if (rawDate instanceof Date) {
                date = ((Date) rawDate).toLocalDate();
            } else if (rawDate instanceof String) {
                date = LocalDate.parse((String) rawDate, formatter);
            } else {
                throw new IllegalStateException("날짜 파싱 실패: " + rawDate);
            }

            int count = ((Number) row.get("count")).intValue();
            result.put(date, count);
        }

        return result;
    }




    @Override
    public int getAvailableFixedSpots() {
        int total = parkingConfigMapper.getConfig().getFixedSubscriptionSpaces(); // 설정된 정기권 공간 수
        int used = reservationMapper.countActiveMonthlyReservations(); // 현재 유효한 월주차 예약 수
        return total - used;
    }
}
