package com.aipms.service;

import com.aipms.domain.Payment;
import com.aipms.dto.AccountInfoResponseDto;
import com.aipms.dto.PaymentRequestDto;
import com.aipms.dto.PaymentResultDto;
import com.aipms.mapper.PaymentMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private final PaymentMapper paymentMapper;

    @Override
    public PaymentResultDto processPayment(PaymentRequestDto requestDto) {
        Payment payment = new Payment();
        payment.setEntryId(requestDto.getEntryId());
        payment.setPaymentMethod(requestDto.getPaymentMethod());
        payment.setGateway(requestDto.getGateway());
        payment.setTotalFee(5000); // 예시 요금
        payment.setPaid(true);
        payment.setCancelled(false);
        payment.setPaymentTime(LocalDateTime.now());

        paymentMapper.insertPayment(payment);

        PaymentResultDto result = new PaymentResultDto();
        result.setPaymentId(payment.getPaymentId());
        result.setTotalFee(payment.getTotalFee());
        result.setPaid(true);
        result.setPaymentTime(payment.getPaymentTime());

        return result;
    }
    @Override
    public AccountInfoResponseDto getAccountInfo(Long memberId) {
        return paymentMapper.getAccountInfo(memberId);
    }
}