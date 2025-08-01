package com.aipms.service;

import com.aipms.dto.AdminDashboardSummaryDto;
import com.aipms.dto.ParkingLogUsageDto;
import com.aipms.dto.SystemStatusDto;
import com.aipms.mapper.AdminDashboardSummaryMapper;
import com.aipms.mapper.ParkingConfigMapper;
import com.aipms.mapper.ParkingLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import static com.aipms.util.SystemResourceUtil.*;

@Service
@RequiredArgsConstructor
public class AdminDashboardSummaryServiceImpl implements AdminDashboardSummaryService {
    private final AdminDashboardSummaryMapper adminDashboardSummaryMapper;
    private final ParkingConfigMapper parkingConfigMapper;
    private final ParkingAvailabilityService parkingAvailabilityService;
    private final ParkingLogMapper parkingLogMapper;

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

    @Override
    public ParkingLogUsageDto getTodayParkingLogUsage() {
        int entryCount = parkingLogMapper.countTodayEntries();
        int exitCount = parkingLogMapper.countTodayExits();
        int currentCount = parkingLogMapper.countCurrentParked();

        return new ParkingLogUsageDto(entryCount, exitCount, currentCount);
    }

    @Override
    public SystemStatusDto getSystemStatus() {
        int cpu = (int) (getCpuUsage() * 100);
        int memory = (int) (getMemoryUsage() * 100);
        int disk = (int) (getDiskUsage() * 100);

        String status = (cpu < 85 && memory < 85 && disk < 90) ? "모든 시스템 정상" : "점검 필요";

        return new SystemStatusDto(status, cpu, memory, disk);
    }
}
