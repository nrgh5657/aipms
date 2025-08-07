package com.aipms.dto;

import lombok.Data;

@Data
public class PaymentVerifyRequestDto {
    private String impUid;
    private String merchantUid;
    private Long entryId;
    private String method;
    private String gateway;
    private String carNumber; // ✅ 추가

}
