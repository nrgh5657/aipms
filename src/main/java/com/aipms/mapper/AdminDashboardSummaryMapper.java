package com.aipms.mapper;

import org.apache.ibatis.annotations.Mapper;

import java.util.Map;

@Mapper
public interface AdminDashboardSummaryMapper {

    int countTodayFireAlerts();

    int sumTodayRevenue();

    int sumYesterdayRevenue();

    int countCurrentlyParked();

    int countTotalSpaces();

    int countTodayDailyReservations();
    int countActiveMonthlyReservations();

}
