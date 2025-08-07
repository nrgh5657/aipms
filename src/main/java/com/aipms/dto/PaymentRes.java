package com.aipms.dto; // 실제 사용 중인 패키지로 맞춰주세요

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentRes {
    private String paymentId;
    private String status;
    private int amount;
    // 필요한 필드를 추가하세요
}
