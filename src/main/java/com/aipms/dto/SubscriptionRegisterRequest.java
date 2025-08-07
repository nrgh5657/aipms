package com.aipms.dto;

import lombok.Data;

@Data
public class SubscriptionRegisterRequest {
    private Long memberId;
    private String customerUid;
    private String merchantUid;
    private String impUid;
    private int amount;
    private String paymentMethod;
    private String gateway;
    private String paymentType;
    private String carNumber;
}
