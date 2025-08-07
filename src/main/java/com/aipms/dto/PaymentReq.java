package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentReq {
    private String userId;
    private String productId;
    private int amount;
    private String paymentMethod;
    private String merchantUid;
    private String impUid;
    private Long id;  // ✅ 이름 명확히 수정
    private String guestToken;
}

