package com.aipms.controller;

import com.aipms.dto.LiveParkingStatusDto;
import com.aipms.dto.ParkingDto;
import com.aipms.dto.ParkingRealtimeStatusResponseDto;
import com.aipms.dto.ParkingStatusResponseDto;
import com.aipms.mapper.ParkingConfigMapper;
import com.aipms.mapper.ParkingLogMapper;
import com.aipms.service.ParkingAvailabilityService;
import com.aipms.service.ParkingRealtimeStatusService;
import com.aipms.service.ParkingService;
import com.aipms.service.ParkingStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parking")
@RequiredArgsConstructor
public class ParkingController {

    private final ParkingService parkingService;
    private final ParkingStatusService parkingStatusService;
    private final ParkingRealtimeStatusService realtimeStatusService;
    private final ParkingAvailabilityService parkingAvailabilityService;
    private final ParkingConfigMapper parkingConfigMapper;
    private final ParkingLogMapper parkingLogMapper;

    @PostMapping
    public ResponseEntity<String> register(@RequestBody ParkingDto dto) {
        parkingService.register(dto);
        return ResponseEntity.ok("주차장 등록 완료");
    }

    @GetMapping("/{id}")
    public ResponseEntity<ParkingDto> get(@PathVariable Long id) {
        return ResponseEntity.ok(parkingService.get(id));
    }

    @GetMapping
    public ResponseEntity<List<ParkingDto>> getAll() {
        return ResponseEntity.ok(parkingService.getAll());
    }

    @PutMapping
    public ResponseEntity<String> update(@RequestBody ParkingDto dto) {
        parkingService.update(dto);
        return ResponseEntity.ok("수정 완료");
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable Long id) {
        parkingService.delete(id);
        return ResponseEntity.ok("삭제 완료");
    }

    @GetMapping("/live-status")
    public LiveParkingStatusDto getLiveStatus() {
        return parkingService.getLiveParkingStatus();
    }

    @GetMapping("/status")
    public ParkingStatusResponseDto getParkingStatus(
            @AuthenticationPrincipal com.aipms.security.CustomUserDetails user) {

        if (user == null) {
            throw new RuntimeException("❌ 인증 정보가 없습니다.");
        }

        Long memberId = user.getMember().getMemberId();
        return parkingStatusService.getParkingStatus(memberId);
    }


    // 토큰에서 사용자 ID 추출하는 부분 (임시용)
    private Long extractMemberIdFromToken(String authHeader) {
        // TODO: 실제 JWT 파싱 로직으로 교체
        return 1L; // 테스트용
    }

    @GetMapping("/realtime-status")
    public ResponseEntity<Map<String, Object>> getRealtimeStatus() {
        List<ParkingRealtimeStatusResponseDto> zones = realtimeStatusService.getRealtimeZoneStatus();

        Map<String, Object> response = new HashMap<>();
        response.put("zones", zones);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-availability")
    public ResponseEntity<?> checkParkingAvailability() {
        int available = parkingAvailabilityService.getAvailableNormalSpots();
        if (available <= 0) {
            return ResponseEntity.ok(Map.of(
                    "available", false,
                    "message", "현재 주차 공간이 부족하여 예약 또는 입차가 불가능합니다."
            ));
        }
        return ResponseEntity.ok(Map.of(
                "available", true,
                "remaining", available
        ));
    }

    @GetMapping("/space")
    public ResponseEntity<?> getParkingStatus() {
        var config = parkingConfigMapper.getConfig();

        int total = config.getTotalSpaces();
        int fixed = config.getFixedSubscriptionSpaces();
        int used = parkingLogMapper.countCurrentlyParkedCars();
        int available = parkingAvailabilityService.getAvailableNormalSpots();
        int usageRate = (int) ((used / (double) total) * 100);

        return ResponseEntity.ok(Map.of(
                "total", total,
                "used", used,
                "available", available,
                "usageRate", usageRate
        ));
    }
}
