package com.aipms.dto;

import lombok.Data;

import java.util.List;

/**
 * 결제 요청 DTO (프론트 → 백)
 */
@Data
public class PaymentRequestDto {

    private Long memberId;                  // 로그인 사용자 ID (서버에서 주입)
    private List<Long> billIds;             // 결제할 청구서 ID 목록
    private Long entryId;
    private Integer amount;                 // 총 결제 금액
    private String paymentMethod;           // 결제 수단 (card, point, bank 등)
    private Boolean useAutoPayment;         // 자동결제 여부
    private Boolean usePoints;              // 포인트 사용 여부
    private String gateway;                 // PG사 정보 (예: "nice", "kakaopay")

}
