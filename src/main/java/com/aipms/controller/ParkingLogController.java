package com.aipms.controller;

import com.aipms.domain.ParkingLog;
import com.aipms.dto.ParkingLogWithMemberDto;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.ParkingLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parking-log")
@RequiredArgsConstructor
public class ParkingLogController {

    private final ParkingLogService parkingLogService;

    // 🔸 POST: 로그 저장 (AI 또는 Postman에서 호출)
    @PostMapping("/logs")
    public ResponseEntity<String> insertLog(@RequestBody ParkingLog log) {
        parkingLogService.insertLog(log);
        return ResponseEntity.ok("입출차 로그 저장 완료");
    }

    // 🔹 GET: 전체 로그 + 신청자 이름 포함 조회
    @GetMapping("/logs")
    public ResponseEntity<Map<String, Object>> getPagedLogs(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "4") int size) {

        List<ParkingLogWithMemberDto> logs = parkingLogService.getPagedLogs(page, size);
        int total = parkingLogService.getTotalLogCount();

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

        Map<String, Object> result = new HashMap<>();
        result.put("entryId", currentLog.getId());  // 주의: getId()는 null 가능성 있음
        result.put("amount", amount);

        return ResponseEntity.ok(result);
    }

}




