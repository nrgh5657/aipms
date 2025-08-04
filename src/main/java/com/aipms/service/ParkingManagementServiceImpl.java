package com.aipms.service;

import com.aipms.domain.ParkingLog;
import com.aipms.dto.DonutStatsDto;
import com.aipms.dto.EntryRevenueChartResponseDto;
import com.aipms.mapper.MemberMapper;
import com.aipms.mapper.ParkingConfigMapper;
import com.aipms.mapper.ParkingLogMapper;
import com.aipms.mapper.ReservationMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ParkingManagementServiceImpl implements ParkingManagementService {

    private final ParkingConfigMapper parkingConfigMapper;
    private final ParkingLogMapper parkingLogMapper;
    private final MemberMapper memberMapper;
    private final ReservationMapper reservationMapper;

    public ParkingManagementServiceImpl(ParkingConfigMapper parkingConfigMapper, ParkingLogMapper parkingLogMapper, MemberMapper memberMapper, ReservationMapper reservationMapper) {
        this.parkingConfigMapper = parkingConfigMapper;
        this.parkingLogMapper = parkingLogMapper;
        this.memberMapper = memberMapper;
        this.reservationMapper = reservationMapper;
    }

    @Override
    public DonutStatsDto getDonutStats() {
        int totalSpaces = parkingConfigMapper.getConfig().getTotalSpaces();
        int usedSpaces = parkingLogMapper.countCurrentlyParkedCars();
        int usageRate = totalSpaces > 0 ? (int) Math.round((usedSpaces / (double) totalSpaces) * 100) : 0;
        int usageRemaining = totalSpaces - usedSpaces;

        int monthlyMembers = reservationMapper.countActiveMonthlyMembers(); // ← 정확한 기준으로 변경 가정
        int totalMembers = memberMapper.countAllMembers();
        int normalMembers = totalMembers - monthlyMembers;
        int monthlyRate = totalMembers > 0 ? (int) Math.round((monthlyMembers / (double) totalMembers) * 100) : 0;

        int fixedSpaces = parkingConfigMapper.getConfig().getFixedSubscriptionSpaces();
        int normalSpots = totalSpaces - fixedSpaces;
        int reservedToday = reservationMapper.countActiveReservations();
        int unreservedToday = normalSpots - reservedToday;
        int reservationRate = normalSpots > 0 ? (int) Math.round((reservedToday / (double) normalSpots) * 100) : 0;

        return new DonutStatsDto(
                usageRate, usedSpaces, usageRemaining,
                monthlyRate, monthlyMembers, normalMembers,
                reservationRate, reservedToday, unreservedToday
        );
    }

    @Override
    public EntryRevenueChartResponseDto getChartData(String mode, LocalDate date, Integer year) {
        switch (mode) {
            case "daily":
                if (date == null) throw new IllegalArgumentException("날짜 누락됨");
                return getHourlyData(date);

            case "monthly":
                if (date == null) throw new IllegalArgumentException("월 정보 누락됨");
                return getWeeklyData(date);

            case "yearly":
                if (year == null) throw new IllegalArgumentException("연도 누락됨");
                return getMonthlyData(year);

            default:
                throw new IllegalArgumentException("유효하지 않은 모드: " + mode);
        }
    }

    @Override
    public EntryRevenueChartResponseDto getHourlyData(LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);

        List<ParkingLog> records = parkingLogMapper.findLogsBetween(start, end);

        List<String> labels = new ArrayList<>();
        int[] normalCounts = new int[24];
        int[] dailyCounts = new int[24];
        int[] monthlyCounts = new int[24];
        int[] revenues = new int[24];

        for (int i = 0; i < 24; i++) {
            labels.add(i + "시");
        }

        for (ParkingLog record : records) {
            LocalDateTime entryTime = record.getEntryTime();
            if (entryTime == null) continue;

            int hour = entryTime.getHour();

            String type = record.getParkingType();
            if ("정기권".equals(type)) {
                monthlyCounts[hour]++;
            } else if ("일주차".equals(type)) {
                dailyCounts[hour]++;
            } else {
                normalCounts[hour]++;
            }

            revenues[hour] += record.getFee() != null ? record.getFee() : 0;
        }

        return new EntryRevenueChartResponseDto(
                labels,
                Arrays.stream(normalCounts).boxed().collect(Collectors.toList()),
                Arrays.stream(dailyCounts).boxed().collect(Collectors.toList()),
                Arrays.stream(monthlyCounts).boxed().collect(Collectors.toList()),
                Arrays.stream(revenues).boxed().collect(Collectors.toList())
        );
    }

    @Override
    public EntryRevenueChartResponseDto getWeeklyData(LocalDate date) {
        YearMonth yearMonth = YearMonth.from(date);
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();

        LocalDateTime startDateTime = start.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(LocalTime.MAX);

        List<ParkingLog> records = parkingLogMapper.findLogsBetween(startDateTime, endDateTime);

        List<String> labels = Arrays.asList("1주차", "2주차", "3주차", "4주차", "5주차");
        int[] normalCounts = new int[5];
        int[] dailyCounts = new int[5];
        int[] monthlyCounts = new int[5];
        int[] revenues = new int[5];

        for (ParkingLog record : records) {
            LocalDateTime entryTime = record.getEntryTime();
            if (entryTime == null) continue;

            int dayOfMonth = entryTime.getDayOfMonth();
            int weekIndex = (dayOfMonth - 1) / 7; // 0~4

            String type = record.getParkingType();
            if ("정기권".equals(type)) {
                monthlyCounts[weekIndex]++;
            } else if ("일주차".equals(type)) {
                dailyCounts[weekIndex]++;
            } else {
                normalCounts[weekIndex]++;
            }

            revenues[weekIndex] += record.getFee() != null ? record.getFee() : 0;
        }

        return new EntryRevenueChartResponseDto(
                labels,
                Arrays.stream(normalCounts).boxed().collect(Collectors.toList()),
                Arrays.stream(dailyCounts).boxed().collect(Collectors.toList()),
                Arrays.stream(monthlyCounts).boxed().collect(Collectors.toList()),
                Arrays.stream(revenues).boxed().collect(Collectors.toList())
        );
    }

    @Override
    public EntryRevenueChartResponseDto getMonthlyData(int year) {
        List<String> labels = new ArrayList<>();
        int[] normalCounts = new int[12];
        int[] dailyCounts = new int[12];
        int[] monthlyCounts = new int[12];
        int[] revenues = new int[12];

        for (int month = 1; month <= 12; month++) {
            YearMonth ym = YearMonth.of(year, month);
            LocalDateTime start = ym.atDay(1).atStartOfDay();
            LocalDateTime end = ym.atEndOfMonth().atTime(LocalTime.MAX);

            List<ParkingLog> records = parkingLogMapper.findLogsBetween(start, end);

            for (ParkingLog record : records) {
                LocalDateTime entryTime = record.getEntryTime();
                if (entryTime == null) continue;

                int idx = month - 1;

                String type = record.getParkingType();
                if ("정기권".equals(type)) {
                    monthlyCounts[idx]++;
                } else if ("일주차".equals(type)) {
                    dailyCounts[idx]++;
                } else {
                    normalCounts[idx]++;
                }

                revenues[idx] += record.getFee() != null ? record.getFee() : 0;
            }

            labels.add(month + "월");
        }

        return new EntryRevenueChartResponseDto(
                labels,
                Arrays.stream(normalCounts).boxed().collect(Collectors.toList()),
                Arrays.stream(dailyCounts).boxed().collect(Collectors.toList()),
                Arrays.stream(monthlyCounts).boxed().collect(Collectors.toList()),
                Arrays.stream(revenues).boxed().collect(Collectors.toList())
        );
    }







}
