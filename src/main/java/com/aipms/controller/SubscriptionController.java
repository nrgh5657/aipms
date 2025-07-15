package com.aipms.controller;

import com.aipms.dto.SubscriptionDto;
import com.aipms.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
