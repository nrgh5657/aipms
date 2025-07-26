package com.aipms.controller;

import com.aipms.domain.ParkingLog;
import com.aipms.domain.Payment;
import com.aipms.dto.ExitRequestDto;
import com.aipms.dto.ExitResponseDto;
import com.aipms.dto.ParkingLogFilterRequestDto;
import com.aipms.dto.ParkingLogWithMemberDto;
import com.aipms.mapper.ParkingLogMapper;
import com.aipms.mapper.PaymentMapper;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.ParkingLogService;
import com.aipms.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parking-log")
@RequiredArgsConstructor
public class ParkingLogController {

    private final ParkingLogService parkingLogService;
    private final ParkingLogMapper parkingLogMapper;
    private final PaymentMapper paymentMapper;
    private final SubscriptionService subscriptionService;

    // 🔸 POST: 로그 저장 (AI 또는 Postman에서 호출)
    @PostMapping("/logs")
    public ResponseEntity<ExitResponseDto> insertLog(@RequestBody ParkingLog log) {
        ExitResponseDto result = parkingLogService.insertLog(log);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/logs")
    public ResponseEntity<Map<String, Object>> getPagedLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "4") int size,
            @RequestParam(required = false) String carNumber,
            @RequestParam(required = false) String requester,
            @RequestParam(required = false) Integer subscription
    ) {
        // 👉 서비스에 전달할 DTO
        ParkingLogFilterRequestDto filter = new ParkingLogFilterRequestDto();
        filter.setPage(page);
        filter.setSize(size);
        filter.setCarNumber(carNumber);
        filter.setRequester(requester);
        filter.setSubscription(subscription);

        List<ParkingLogWithMemberDto> logs = parkingLogService.getFilteredLogs(filter);
        int total = parkingLogService.countFilteredLogs(filter);

        Map<String, Object> result = new HashMap<>();
        result.put("logs", logs);
        result.put("totalCount", total);

        return ResponseEntity.ok(result);
    }

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentParkingLog(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long memberId = null;

        // 🔐 로그인 상태일 경우 memberId 설정
        if (userDetails != null) {
            memberId = userDetails.getMember().getMemberId();
        }

        ParkingLog currentLog = parkingLogService.getCurrentUnpaidLog(memberId);

        // ❌ 조회 결과 없음 → 결제 대상 없음
        if (currentLog == null) {
            Map<String, Object> noEntry = new HashMap<>();
            noEntry.put("entryId", null);
            noEntry.put("amount", 0);
            return ResponseEntity.ok(noEntry);
        }

        int amount = parkingLogService.calculateFee(currentLog.getEntryTime());

        boolean hasSubscription = false;
        if (memberId != null) {
            hasSubscription = subscriptionService.isActiveSubscription(memberId);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("entryId", currentLog.getId());  // 주의: getId()는 null 가능성 있음
        result.put("amount", amount);
        result.put("subscriptionActive", hasSubscription); // ✅ 추가


        return ResponseEntity.ok(result);
    }

    @PostMapping("/exit")
    public ResponseEntity<ExitResponseDto> handleExit(@RequestBody ExitRequestDto dto) {
        if (dto.getCarNumber() == null || dto.getCarNumber().isBlank()) {
            return ResponseEntity.badRequest()
                    .body(new ExitResponseDto(false, "차량 번호가 없습니다.", false, 0));
        }

        ExitResponseDto response = parkingLogService.processExit(dto.getCarNumber());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/confirm-exit")
    public ResponseEntity<Map<String, Object>> confirmExitAfterPayment(@RequestBody Map<String, Object> payload) {
        Long entryId = null;
        if (payload.get("entryId") != null) {
            entryId = Long.valueOf(payload.get("entryId").toString());
        }

        String carNumber = (String) payload.get("carNumber");
        String impUid = (String) payload.get("impUid");
        String merchantUid = (String) payload.get("merchantUid");
        int amount = (int) payload.get("amount");

        ParkingLog log = null;

        // ✅ entryId 우선 조회, 없을 경우 carNumber로 fallback
        if (entryId != null) {
            log = parkingLogMapper.selectById(entryId);
        } else if (carNumber != null) {
            log = parkingLogMapper.findLatestUnexitedLog(carNumber);
        }

        if (log == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "출차 대상 로그가 없습니다."
            ));
        }

        // 💳 결제 정보 생성
        Payment payment = new Payment();
        payment.setEntryId(log.getId());
        payment.setTransactionId(impUid);
        payment.setImpUid(impUid);
        payment.setMerchantUid(merchantUid);
        payment.setPaid(true);
        payment.setCancelled(false);
        payment.setPaymentTime(LocalDateTime.now());
        payment.setTotalFee(amount);
        payment.setPaymentMethod("card");
        payment.setStatus("출차 결제");

        paymentMapper.insertPayment(payment);

        // 🚪 로그에 결제정보 및 출차시간 업데이트
        parkingLogMapper.updatePaymentAndExitInfo(Map.of(
                "entryId", log.getId(),
                "paymentId", payment.getPaymentId(),
                "isPaid", true,
                "paidAt", LocalDateTime.now(),
                "paymentMethod", "card",
                "fee", amount,
                "exitTime", LocalDateTime.now()
        ));

        return ResponseEntity.ok(Map.of("success", true));
    }




}




