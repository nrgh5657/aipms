package com.aipms.service;

import com.aipms.dto.DayOfWeekEntryStatDto;
import com.aipms.dto.DonutStatsDto;
import com.aipms.dto.EntryRevenueChartResponseDto;
import com.aipms.dto.ParkingManagementSummaryDto;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public interface ParkingManagementService {
    DonutStatsDto getDonutStats();

    EntryRevenueChartResponseDto getChartData(String mode, LocalDate date, Integer year);

    EntryRevenueChartResponseDto getHourlyData(LocalDate date);

    EntryRevenueChartResponseDto getWeeklyData(LocalDate date);

    EntryRevenueChartResponseDto getMonthlyData(int year);

    List<DayOfWeekEntryStatDto> getAverageEntryByWeekday(Integer month);

    Map<String, List<Long>> getMonthlyRevenueComparison(int year, int month);

    Map<String, List<Long>> getYearlyRevenueComparison(int year);

    ParkingManagementSummaryDto getDashboardSummary();
}
