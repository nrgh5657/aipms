package com.aipms.service;

import com.aipms.dto.AdminDashboardSummaryDto;
import com.aipms.dto.ParkingLogUsageDto;
import com.aipms.dto.SystemStatusDto;

public interface AdminDashboardSummaryService {
    AdminDashboardSummaryDto getSummary();

    ParkingLogUsageDto getTodayParkingLogUsage();

    SystemStatusDto getSystemStatus();
}
