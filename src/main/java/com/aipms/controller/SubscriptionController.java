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

    @GetMapping("/{memberId}")
    public ResponseEntity<SubscriptionDto> getByMember(@PathVariable Long memberId) {
        return ResponseEntity.ok(subscriptionService.getSubscriptionByMember(memberId));
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
}
