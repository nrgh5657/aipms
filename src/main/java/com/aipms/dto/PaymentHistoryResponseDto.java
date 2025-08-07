package com.aipms.dto;

import com.aipms.domain.Payment;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 결제 내역 조회 응답 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentHistoryResponseDto {

    private List<PaymentHistoryDto> payments;      // 결제 내역 리스트
    private PageDto pagination;    // 페이지네이션 정보
}
