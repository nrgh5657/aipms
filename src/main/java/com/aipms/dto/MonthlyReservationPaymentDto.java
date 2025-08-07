package com.aipms.dto;

import lombok.Data;

@Data
public class MonthlyReservationPaymentDto {
    private Long reservationId;
    private Long memberId;            // 🔸 추가됨: 예약 소유자 검증용
    private String impUid;
    private String merchantUid;
    private int amount;
    private String paymentMethod;
    private String gateway;
}
