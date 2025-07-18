package com.aipms.service;

import com.aipms.dto.*;

public interface PaymentService {
    PaymentResultDto processPayment(PaymentRequestDto requestDto);
    AccountInfoResponseDto getAccountInfo(Long memberId);

    PaymentHistoryResponseDto getPaymentHistory(PaymentHistoryRequestDto req);

    boolean verifyAndRecord(PaymentVerifyRequestDto dto, Long memberId);

    void markAsPaid(Long paymentId);
}