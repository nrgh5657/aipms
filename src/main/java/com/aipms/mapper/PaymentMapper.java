package com.aipms.mapper;

import com.aipms.domain.Payment;
import com.aipms.dto.AccountInfoResponseDto;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface PaymentMapper {
    void insertPayment(Payment payment);
    Payment selectPaymentById(Long paymentId);
    Payment selectPaymentByEntryId(Long entryId);
    AccountInfoResponseDto getAccountInfo(Long memberId);
}