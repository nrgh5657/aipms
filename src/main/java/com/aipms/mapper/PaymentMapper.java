package com.aipms.mapper;

import com.aipms.domain.Payment;
import com.aipms.dto.AccountInfoResponseDto;
import com.aipms.dto.PaymentHistoryRequestDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface PaymentMapper {

    void insertPayment(Payment payment);

    Payment selectPaymentById(Long paymentId);

    Payment selectPaymentByEntryId(Long entryId);

    AccountInfoResponseDto getAccountInfo(Long memberId);

    // ✅ 결제 내역 조회 (리스트)
    List<Payment> selectPayments(@Param("req") PaymentHistoryRequestDto req,
                                 @Param("offset") int offset,
                                 @Param("limit") int limit);

    // ✅ 결제 내역 건수
    int countPayments(@Param("req") PaymentHistoryRequestDto req);

    Payment selectByTransactionId(String transactionId);

    void updatePaidStatus(@Param("paymentId") Long paymentId, @Param("paid") int paid);
}
