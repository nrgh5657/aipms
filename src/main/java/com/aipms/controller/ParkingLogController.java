package com.aipms.controller;

import com.aipms.domain.ParkingLog;
import com.aipms.dto.ParkingLogWithMemberDto;
import com.aipms.service.ParkingLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public ResponseEntity<List<ParkingLogWithMemberDto>> getLogs() {
        return ResponseEntity.ok(parkingLogService.getAllLogs());
    }
}
