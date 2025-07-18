package com.aipms.controller;

import com.aipms.dto.SubscriptionDto;
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

    @PostMapping("/apply")
    public ResponseEntity<String> apply(@RequestBody SubscriptionDto dto) {
        subscriptionService.applySubscription(dto);
        return ResponseEntity.ok("정기권 신청 완료");
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerBillingKey(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody Map<String, String> payload
    ) {
        String customerUid = payload.get("customerUid");
        String merchantUid = payload.get("merchantUid");

        Long memberId = userDetails.getMember().getMemberId();
        subscriptionService.registerSubscription(memberId, customerUid);

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
}
