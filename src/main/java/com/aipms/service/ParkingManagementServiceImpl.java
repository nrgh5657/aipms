package com.aipms.service;

import com.aipms.domain.Parking;
import com.aipms.domain.ParkingLog;
import com.aipms.dto.DayOfWeekEntryStatDto;
import com.aipms.dto.DonutStatsDto;
import com.aipms.dto.EntryRevenueChartResponseDto;
import com.aipms.dto.ParkingManagementSummaryDto;
import com.aipms.mapper.*;
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
    private final ParkingManagementMapper parkingManagementMapper;
    private final PaymentMapper paymentMapper;

    public ParkingManagementServiceImpl(ParkingConfigMapper parkingConfigMapper, ParkingLogMapper parkingLogMapper, MemberMapper memberMapper, ReservationMapper reservationMapper, ParkingManagementMapper parkingManagementMapper, PaymentMapper paymentMapper) {
        this.parkingConfigMapper = parkingConfigMapper;
        this.parkingLogMapper = parkingLogMapper;
        this.memberMapper = memberMapper;
        this.reservationMapper = reservationMapper;
        this.parkingManagementMapper = parkingManagementMapper;
        this.paymentMapper = paymentMapper;
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


    @Override
    public List<DayOfWeekEntryStatDto> getAverageEntryByWeekday(Integer month) {
        int targetMonth = (month != null && month >= 1 && month <= 12)
                ? month
                : LocalDate.now().getMonthValue();

        return parkingLogMapper.getAverageEntryByWeekday(targetMonth);
    }

    @Override
    public Map<String, List<Long>> getMonthlyRevenueComparison(int year, int month) {
        List<Long> current = new ArrayList<>();
        List<Long> previous = new ArrayList<>();

        int[][] weekRanges = {
                {1, 7}, {8, 14}, {15, 21}, {22, 28}, {29, 31}
        };

        for (int[] range : weekRanges) {
            int start = range[0];
            int end = range[1];

            // 이번 달
            Long currSum = parkingManagementMapper.getWeeklyRevenueOfMonth(year, month, start, end);
            current.add(currSum != null ? currSum : 0L);

            // 지난 달
            int prevMonth = (month == 1) ? 12 : month - 1;
            int prevYear = (month == 1) ? year - 1 : year;

            Long prevSum = parkingManagementMapper.getWeeklyRevenueOfMonth(prevYear, prevMonth, start, end);
            previous.add(prevSum != null ? prevSum : 0L);
        }

        Map<String, List<Long>> result = new HashMap<>();
        result.put("current", current);
        result.put("previous", previous);
        return result;
    }

    @Override
    public Map<String, List<Long>> getYearlyRevenueComparison(int year) {
        List<Map<String, Object>> currentRaw = parkingManagementMapper.getMonthlyRevenueOfYear(year);
        List<Map<String, Object>> previousRaw = parkingManagementMapper.getMonthlyRevenueOfYear(year - 1);

        List<Long> current = new ArrayList<>(Collections.nCopies(12, 0L));
        List<Long> previous = new ArrayList<>(Collections.nCopies(12, 0L));

        for (Map<String, Object> row : currentRaw) {
            int month = ((Number) row.get("month")).intValue();
            long total = ((Number) row.get("total")).longValue();
            current.set(month - 1, total);
        }

        for (Map<String, Object> row : previousRaw) {
            int month = ((Number) row.get("month")).intValue();
            long total = ((Number) row.get("total")).longValue();
            previous.set(month - 1, total);
        }

        Map<String, List<Long>> result = new HashMap<>();
        result.put("current", current);
        result.put("previous", previous);
        return result;
    }

    @Override
    public ParkingManagementSummaryDto getDashboardSummary() {
        int entryCount = parkingLogMapper.getEntryCountThisMonth();
        Long revenue = (long) paymentMapper.getMonthlyRevenue();
        return new ParkingManagementSummaryDto(entryCount, revenue != null ? revenue : 0);
    }

}
