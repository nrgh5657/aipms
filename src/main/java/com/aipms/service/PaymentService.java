package com.aipms.service;

import com.aipms.dto.*;

public interface PaymentService {
    PaymentResultDto processPayment(PaymentRequestDto requestDto);

    AccountInfoResponseDto getAccountInfo(Long memberId);

    PaymentHistoryResponseDto getPaymentHistory(PaymentHistoryRequestDto req);

    boolean verifyAndRecord(PaymentVerifyRequestDto dto, Long memberId);

    void markAsPaid(Long paymentId);

    boolean requestSubscriptionPayment(Long memberId, String customerUid, Integer amount);

    boolean recordSubscriptionPayment(Long memberId, String customerUid, String merchantUid, String impUid, Integer amount, String paymentType, String carNumber);

    PageDto<AdminPaymentDto> getAdminPaymentList(AdminPaymentHistoryRequestDto req);

}