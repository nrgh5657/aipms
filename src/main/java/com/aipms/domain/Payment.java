package com.aipms.domain;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class Payment {
    private Long paymentId;
    private String customerUid;
    private Long memberId;
    private String guestToken;
    private Long entryId;
    private Integer totalFee;
    private String paymentMethod;   // 예: CARD, KAKAOPAY
    private String gateway;         // 예: html5_inicis, kakaopay
    private boolean paid;
    private boolean cancelled;
    private LocalDateTime paymentTime;
    private String transactionId;   // 🔥 imp_uid (결제 고유 키)
    private String status;
    private String merchantUid;
    private String impUid;
    private String paymentType;
    private String carNumber;
    private Long reservationId; // 예약 결제 시만 사용
    private Long subscriptionId;//정기권 결제 시만 사용
    

}
