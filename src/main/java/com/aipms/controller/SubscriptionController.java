package com.aipms.controller;

import com.aipms.dto.ParkingConfigDto;
import com.aipms.dto.SubscriptionDto;
import com.aipms.dto.SubscriptionRegisterRequest;
import com.aipms.mapper.ParkingConfigMapper;
import com.aipms.mapper.SubscriptionMapper;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.PaymentService;
import com.aipms.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final PaymentService paymentService;
    private final ParkingConfigMapper parkingConfigMapper;
    private final SubscriptionMapper subscriptionMapper;

    @PostMapping("/apply")
    public ResponseEntity<String> apply(@RequestBody SubscriptionDto dto) {
        subscriptionService.applySubscription(dto);
        return ResponseEntity.ok("정기권 신청 완료");
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerBillingKey(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, Object> payload
    ) {
        Long memberId = userDetails.getMember().getMemberId();

        String customerUid = (String) payload.get("customerUid");
        String merchantUid = (String) payload.get("merchantUid");
        String impUid = (String) payload.get("impUid");
        Integer amount = (Integer) payload.get("amount");
        String carNumber = (String) payload.get("carNumber");
        String paymentMethod = (String) payload.getOrDefault("paymentMethod", "카드");
        String gateway = (String) payload.getOrDefault("gateway", "kakaopay");
        String paymentType = (String) payload.getOrDefault("paymentType", "정기권");

        subscriptionService.registerSubscription(
                memberId, customerUid, merchantUid, impUid, amount, carNumber,
                paymentMethod, gateway, paymentType
        );

        return ResponseEntity.ok(Map.of("success", true));
    }


    @PostMapping("/charge")
    public ResponseEntity<?> chargeSubscription(@RequestBody Map<String, Object> payload) {
        Long memberId = Long.valueOf(payload.get("memberId").toString());
        Integer amount = Integer.valueOf(payload.getOrDefault("amount", 150000).toString());

        // 1. 빌링키 조회
        String customerUid = subscriptionService.getCustomerUid(memberId);
        if (customerUid == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "고객의 빌링키가 존재하지 않습니다."));
        }

        // 2. 아임포트 결제 요청
        boolean success = paymentService.requestSubscriptionPayment(memberId, customerUid, amount);

        if (success) {
            return ResponseEntity.ok(Map.of("success", true, "message", "정기결제가 성공적으로 완료되었습니다."));
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "결제 실패"));
        }
    }

    @GetMapping("/{memberId}")
    public ResponseEntity<SubscriptionDto> getByMember(@PathVariable Long memberId) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionByMember(memberId));
    }

    @PutMapping("/cancel/{subscriptionId}")
    public ResponseEntity<String> cancel(@PathVariable Long subscriptionId) {
        subscriptionService.cancelSubscription(subscriptionId);
        return ResponseEntity.ok("정기권 해지 완료");
    }

    @GetMapping("/list")
    public ResponseEntity<List<SubscriptionDto>> list() {
        return ResponseEntity.ok(subscriptionService.getAllSubscriptions());
    }

    @GetMapping("/check-availability")
    public ResponseEntity<?> checkSubscriptionAvailability() {
        boolean available = subscriptionService.isMonthlySubscriptionAvailable();
        if (!available) {
            return ResponseEntity.ok(Map.of(
                    "available", false,
                    "message", "월주차 정원이 초과되어 정기권 구매가 불가능합니다."
            ));
        }

        return ResponseEntity.ok(Map.of("available", true));
    }

    @PostMapping("/refund")
    public ResponseEntity<?> refundSubscription(@AuthenticationPrincipal CustomUserDetails user,
                                                @RequestBody Map<String, String> payload) {
        try {
            Long memberId = user.getMember().getMemberId();
            String reason = payload.get("reason");

            subscriptionService.refundSubscription(memberId, reason);  // 환불 로직 실행

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "정기권 환불이 완료되었습니다."
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        }
    }
}
