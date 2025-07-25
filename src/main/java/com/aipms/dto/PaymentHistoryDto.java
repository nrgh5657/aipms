package com.aipms.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * 결제 내역 조회 응답용 DTO
 */
@Data
public class PaymentHistoryDto {
    private Long paymentId;
    private Integer totalFee;                // total_fee → amount로 매핑해도 되지만 그대로 씀
    private String paymentMethod;            // CARD 등
    private String paymentGateway;           // KakaoPay 등
    private String status;                   // 결제 완료, 대기 등
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime paymentTime;       // 결제일
    private Boolean cancelled;               // 환불 여부
    private String carNumber;
}
