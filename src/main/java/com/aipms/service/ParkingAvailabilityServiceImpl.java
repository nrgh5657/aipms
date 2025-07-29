package com.aipms.service;

import com.aipms.domain.ParkingLog;
import com.aipms.mapper.ParkingConfigMapper;
import com.aipms.mapper.ParkingLogMapper;
import com.aipms.mapper.ReservationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
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
    public boolean isReservableForPeriod(LocalDate startDate, LocalDate endDate) {
        int total = parkingConfigMapper.getConfig().getTotalSpaces();
        int fixed = parkingConfigMapper.getConfig().getFixedSubscriptionSpaces();
        int normalSpots = total - fixed;

        Map<LocalDate, Integer> reservedMap = reservationMapper.getDailyReservationCountByDate(startDate, endDate);

        List<ParkingLog> activeParkedCars = parkingLogMapper.getParkedCarCountByDate(); // exit_time IS NULL 인 차량

        Map<LocalDate, Integer> parkedMap = new HashMap<>();
        for (ParkingLog log : activeParkedCars) {
            LocalDate entry = log.getEntryTime().toLocalDate();
            LocalDate until = entry.plusDays(1); // 최대 24시간 점유

            for (LocalDate d = entry; !d.isAfter(until); d = d.plusDays(1)) {
                if (d.isBefore(startDate) || d.isAfter(endDate)) continue;
                parkedMap.put(d, parkedMap.getOrDefault(d, 0) + 1);
            }
        }

        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(1)) {
            int reserved = reservedMap.getOrDefault(d, 0);
            int parked = parkedMap.getOrDefault(d, 0);
            if (reserved + parked >= normalSpots) {
                return false;
            }
        }

        return true;
    }


    @Override
    public int getAvailableFixedSpots() {
        int total = parkingConfigMapper.getConfig().getFixedSubscriptionSpaces(); // 설정된 정기권 공간 수
        int used = reservationMapper.countActiveMonthlyReservations(); // 현재 유효한 월주차 예약 수
        return total - used;
    }
}
