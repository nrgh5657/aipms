package com.aipms.dto;

import lombok.Data;

@Data
public class DailyReservationPaymentDto {
    private Long reservationId;           // 🔸 예약 ID
    private Long memberId;            // 🔸 추가됨: 예약 소유자 검증용
    private String paymentMethod;         // 결제 수단 (예: card)
    private String gateway;               // PG사 정보 (예: kakao)
    private String merchantUid;           // 아임포트 고유 주문번호
    private String impUid;                // 아임포트 결제 건 ID
}
