package com.aipms.controller;

import com.aipms.dto.*;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/request")
    public PaymentResultDto requestPayment(@RequestBody PaymentRequestDto requestDto,
                                           @AuthenticationPrincipal CustomUserDetails user) {
        requestDto.setMemberId(user.getMember().getMemberId());
        return paymentService.processPayment(requestDto);
    }

    @GetMapping("/account-info")
    public AccountInfoResponseDto getAccountInfo(@AuthenticationPrincipal CustomUserDetails user) {
        Long memberId = user.getMember().getMemberId();
        return paymentService.getAccountInfo(memberId);
    }

    /** ✅ 결제 내역 조회 (필터 포함) */
    @GetMapping("/history")
    public PaymentHistoryResponseDto getHistory(PaymentHistoryRequestDto req,
                                                @AuthenticationPrincipal CustomUserDetails user) {
        req.setMemberId(user.getMember().getMemberId());
        return paymentService.getPaymentHistory(req);
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody PaymentVerifyRequestDto dto,
                                           @AuthenticationPrincipal CustomUserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(401).body(Map.of("status", "인증 필요"));
        }

        Long memberId = userDetails.getMember().getMemberId();
        boolean success = paymentService.verifyAndRecord(dto, memberId);

        if (success) {
            return ResponseEntity.ok(Map.of("status", "결제 완료"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("status", "결제 실패"));
        }
    }

    @PostMapping("/record")
    public ResponseEntity<?> recordPayment(@AuthenticationPrincipal CustomUserDetails userDetails,
                                           @RequestBody Map<String, Object> payload) {
        try {
            Long memberId = userDetails.getMember().getMemberId();
            String customerUid = (String) payload.get("customerUid");
            String merchantUid = (String) payload.get("merchantUid");
            String impUid = (String) payload.get("impUid");
            Integer amount = (Integer) payload.get("amount");
            String paymentType = (String) payload.get("paymentType");
            String carNumber = (String) payload.get("carNumber");

            boolean result = paymentService.recordSubscriptionPayment(memberId, customerUid, merchantUid, impUid, amount, paymentType, carNumber);

            return ResponseEntity.ok(Map.of("success", result));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "결제 저장 실패: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/list")
    public PageDto<AdminPaymentDto> getAdminPayments(AdminPaymentHistoryRequestDto req) {
        return paymentService.getAdminPaymentList(req);
    }

    @PostMapping("/reservation/daily")
    public ResponseEntity<?> payForReservation(@RequestBody DailyReservationPaymentDto dto,
                                               @AuthenticationPrincipal CustomUserDetails user) {
        try {
            dto.setMemberId(user.getMember().getMemberId());
            paymentService.payForDailyReservation(dto);

            return ResponseEntity.ok(Map.of("success", true, "message", "결제가 완료되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "서버 오류 발생"));
        }
    }

    @PostMapping("/reservation/monthly")
    public ResponseEntity<?> payForMonthlyReservation(@RequestBody MonthlyReservationPaymentDto dto,
                                                      @AuthenticationPrincipal CustomUserDetails user) {
        try {
            dto.setMemberId(user.getMember().getMemberId());
            paymentService.payForMonthlyReservation(dto);

            return ResponseEntity.ok(Map.of("success", true, "message", "월주차 결제가 완료되었습니다."));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "서버 오류 발생"));
        }
    }

    @PostMapping("/admin/refund")
    public ResponseEntity<Map<String, Object>> refundPayment(@RequestBody PaymentRefundRequestDto refundRequest) {
        Map<String, Object> response = new HashMap<>();

        try {
            paymentService.processAdminRefund(refundRequest.getReservationId(), refundRequest.getReason());
            response.put("success", true);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

}
