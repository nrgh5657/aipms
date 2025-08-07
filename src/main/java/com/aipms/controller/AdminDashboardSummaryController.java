package com.aipms.controller;

import com.aipms.dto.AdminDashboardSummaryDto;
import com.aipms.dto.CctvLogDto;
import com.aipms.dto.ParkingLogUsageDto;
import com.aipms.dto.SystemStatusDto;
import com.aipms.service.AdminDashboardSummaryService;
import com.aipms.service.CctvLogService;
import com.aipms.service.ParkingLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/adminDashboard")
@RequiredArgsConstructor
public class AdminDashboardSummaryController {

    private final AdminDashboardSummaryService adminDashboardSummaryService;
    private final CctvLogService cctvLogService;
    private final ParkingLogService parkingLogService;

    @GetMapping("/summary")
    public AdminDashboardSummaryDto getSummary() {
        return adminDashboardSummaryService.getSummary();
    }

    @GetMapping("/cctv-status")
    public List<CctvLogDto> getCctvStatuses() {
        return cctvLogService.getLatestLogs();
    }

    @GetMapping("/parking-usage")
    public ResponseEntity<ParkingLogUsageDto> getTodayParkingUsage() {
        return ResponseEntity.ok(adminDashboardSummaryService.getTodayParkingLogUsage());
    }

    @GetMapping("/system-status")
    public ResponseEntity<SystemStatusDto> getSystemStatus() {
        return ResponseEntity.ok(adminDashboardSummaryService.getSystemStatus());
    }




}
