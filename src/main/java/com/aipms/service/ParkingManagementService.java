package com.aipms.service;

import com.aipms.dto.DonutStatsDto;
import com.aipms.dto.EntryRevenueChartResponseDto;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Map;

@Service
public interface ParkingManagementService {
    DonutStatsDto getDonutStats();

    EntryRevenueChartResponseDto getChartData(String mode, LocalDate date, Integer year);

    EntryRevenueChartResponseDto getHourlyData(LocalDate date);

    EntryRevenueChartResponseDto getWeeklyData(LocalDate date);

    EntryRevenueChartResponseDto getMonthlyData(int year);

}
