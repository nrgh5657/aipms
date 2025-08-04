package com.aipms.controller;

import com.aipms.dto.DonutStatsDto;
import com.aipms.dto.EntryRevenueChartResponseDto;
import com.aipms.service.ParkingManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.Map;

@RestController
@RequestMapping("/api/management/parking")
@RequiredArgsConstructor
public class ParkingManagementController {


    private final ParkingManagementService parkingManagementService;

    @GetMapping("/donut")
    public ResponseEntity<DonutStatsDto> getDonutStats() {
        DonutStatsDto dto = parkingManagementService.getDonutStats();
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/entry-revenue")
    public ResponseEntity<?> getEntryRevenueChart(
            @RequestParam String mode,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) Integer year
    ) {
        LocalDate parsedDate = null;
        if (date != null && !date.isBlank()) {
            try {
                if (mode.equals("monthly")) {
                    // date: "2025-08" → LocalDate: 2025-08-01
                    parsedDate = LocalDate.parse(date + "-01");
                } else {
                    // date: "2025-08-04"
                    parsedDate = LocalDate.parse(date);
                }
            } catch (DateTimeParseException e) {
                return ResponseEntity.badRequest().body("❌ 날짜 형식이 올바르지 않습니다: " + date);
            }
        }

        EntryRevenueChartResponseDto dto = parkingManagementService.getChartData(mode, parsedDate, year);
        return ResponseEntity.ok(dto);
    }
}
