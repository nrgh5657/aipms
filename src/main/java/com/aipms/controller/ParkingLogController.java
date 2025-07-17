package com.aipms.controller;

import com.aipms.domain.ParkingLog;
import com.aipms.dto.ParkingLogWithMemberDto;
import com.aipms.service.ParkingLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
}
