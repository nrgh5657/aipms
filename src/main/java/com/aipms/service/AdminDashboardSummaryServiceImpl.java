package com.aipms.service;

import com.aipms.dto.AdminDashboardSummaryDto;
import com.aipms.mapper.AdminDashboardSummaryMapper;
import com.aipms.mapper.ParkingConfigMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminDashboardSummaryServiceImpl implements AdminDashboardSummaryService {
    private final AdminDashboardSummaryMapper adminDashboardSummaryMapper;
    private final ParkingConfigMapper parkingConfigMapper;
    private final ParkingAvailabilityService parkingAvailabilityService;

    @Override
    public AdminDashboardSummaryDto getSummary() {
        AdminDashboardSummaryDto dto = new AdminDashboardSummaryDto();

        // 🔥 화재, 매출
        dto.setFireCount(adminDashboardSummaryMapper.countTodayFireAlerts());
        dto.setTodayRevenue(adminDashboardSummaryMapper.sumTodayRevenue());
        dto.setYesterdayRevenue(adminDashboardSummaryMapper.sumYesterdayRevenue());

        // 🅿️ 현재 주차 차량 수
        dto.setCurrentOccupancy(adminDashboardSummaryMapper.countCurrentlyParked());

        // 📅 예약 수 (일/월)

        dto.setDailyReservationCount(adminDashboardSummaryMapper.countTodayDailyReservations());
        dto.setMonthlyReservationCount(adminDashboardSummaryMapper.countActiveMonthlyReservations());

        int total = parkingConfigMapper.getConfig().getTotalSpaces();
        int fixed = parkingConfigMapper.getConfig().getFixedSubscriptionSpaces();
        int normal = total - fixed;

// 현재 일반 공간 중 주차된 차량 수 = normal - availableNormalSpots
        int usedNormal = normal - parkingAvailabilityService.getAvailableNormalSpots();

// 점유율 계산은 일반 공간 기준만 사용
        int rate = total > 0 ? Math.round((usedNormal * 100.0f) / total) : 0;


        dto.setTotalSpaces(total);
        dto.setFixedSubscriptionSpaces(fixed);
        dto.setNormalSpaces(normal);
        dto.setUsedNormalSpaces(usedNormal);
        dto.setOccupancyRate(rate);

        return dto;
    }
}
