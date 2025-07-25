package com.aipms.mapper;

import com.aipms.domain.Payment;
import com.aipms.dto.*;
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
    List<PaymentHistoryDto> selectPayments(@Param("req") PaymentHistoryRequestDto req,
                                           @Param("offset") int offset,
                                           @Param("limit") int limit);


    // ✅ 결제 내역 건수
    int countPayments(@Param("req") PaymentHistoryRequestDto req);

    // ✅ 결제 내역 조회 (리스트)
    List<AdminPaymentDto> selectAdminPayments(@Param("req") AdminPaymentHistoryRequestDto req,
                                              @Param("offset") int offset,
                                              @Param("limit") int limit);
    // ✅ 결제 내역 건수
    int countAdminPayments(@Param("req") AdminPaymentHistoryRequestDto req);

    Payment selectByTransactionId(String transactionId);

    void updatePaidStatus(@Param("paymentId") Long paymentId, @Param("paid") int paid);

    Payment findByReservationId(Long reservationId);

    int markAsCancelled(@Param("paymentId") Long paymentId,
                        @Param("cancelReason") String cancelReason,
                        @Param("refundAmount") int refundAmount);

    Payment findLatestSubscriptionPayment(Long memberId);
}
