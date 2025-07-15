package com.aipms.service;

import com.aipms.dto.AccountInfoResponseDto;
import com.aipms.dto.PaymentRequestDto;
import com.aipms.dto.PaymentResultDto;

public interface PaymentService {
    PaymentResultDto processPayment(PaymentRequestDto requestDto);
    AccountInfoResponseDto getAccountInfo(Long memberId);
}