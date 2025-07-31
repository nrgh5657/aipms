package com.aipms.controller;

import com.aipms.dto.AdminDashboardSummaryDto;
import com.aipms.dto.CctvLogDto;
import com.aipms.service.AdminDashboardSummaryService;
import com.aipms.service.CctvLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/adminDashboard")
@RequiredArgsConstructor
public class AdminDashboardSummaryController {

    private final AdminDashboardSummaryService adminDashboardSummaryService;
    private final CctvLogService cctvLogService;

    @GetMapping("/summary")
    public AdminDashboardSummaryDto getSummary() {
        return adminDashboardSummaryService.getSummary();
    }

    @GetMapping("/cctv-status")
    public List<CctvLogDto> getCctvStatuses() {
        return cctvLogService.getLatestLogs();
    }
}
