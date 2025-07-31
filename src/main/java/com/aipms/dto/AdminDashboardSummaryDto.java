package com.aipms.dto;

import lombok.Data;

@Data
public class AdminDashboardSummaryDto {

    // 🔥 오늘 감지된 화재 건수
    private int fireCount;

    // 💰 오늘 매출 총액
    private int todayRevenue;

    // 💰 전일 매출 총액 (증감 비교용)
    private int yesterdayRevenue;

    // 🚗 현재 주차 중인 차량 수
    private int currentOccupancy;

    // 🅿️ 전체 주차 공간 수
    private int totalSpaces;

    // 📅 오늘 일주차 예약 수
    private int dailyReservationCount;

    // 📅 오늘 월주차 예약 수
    private int monthlyReservationCount;

    private int fixedSubscriptionSpaces;

    private int normalSpaces;

    private int usedNormalSpaces;

    private int occupancyRate;
}
