package com.aipms.controller;

import com.aipms.dto.SubscriptionDto;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
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
