package com.aipms.dto;

import lombok.Data;

@Data
public class PaymentSummaryDto {
    private int paymentTodayRevenue;       // 오늘 매출
    private int paymentMonthlyRevenue;     // 이번 달 매출
    private int paymentPendingRefunds;     // 환불 대기 건수
    private int paymentFailedPayments;     // 결제 실패 건수
}
