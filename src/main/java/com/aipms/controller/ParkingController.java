package com.aipms.controller;

import com.aipms.dto.*;
import com.aipms.mapper.ParkingConfigMapper;
import com.aipms.mapper.ParkingLogMapper;
import com.aipms.mapper.ParkingMapper;
import com.aipms.mapper.ReservationMapper;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.*;
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
    private final ReservationService reservationService;
    private final ParkingLogService parkingLogService;
    private final ParkingMapper parkingMapper;
    private final ReservationMapper reservationMapper;

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
        int parkedCars = parkingLogService.countCurrentlyParkedCars();
        int reserved = reservationService.countPaidReservations();
        int used = parkedCars + reserved;
        int available = parkingAvailabilityService.getAvailableNormalSpots();
        int usageRate = (int) ((used / (double) total) * 100);

        return ResponseEntity.ok(Map.of(
                "total", total,
                "fixed", fixed,
                "used", used,
                "available", available,
                "usageRate", usageRate
        ));
    }

    @GetMapping("/data")
    public Map<Long, Map<String, Object>> getParkingData() {
        List<ParkingStatusDto> list = parkingMapper.selectParkingStatus();

        Map<Long, Map<String, Object>> result = new HashMap<>();

        for (ParkingStatusDto dto : list) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", dto.getName());
            item.put("total", dto.getTotal());
            item.put("occupied", dto.getOccupied());
            item.put("rate", dto.getRate());
            result.put(dto.getId(), item);
        }

        return result;
    }
    @GetMapping("/subscription-status")
    public Map<String, Integer> getSubscriptionStatus() {
        // 전체 정기권 공간 (ex. parking_config 테이블 등에서)
        int totalSubscriptionSpots = parkingConfigMapper.getConfig().getFixedSubscriptionSpaces();

        // 현재 활성화된 정기권 수 (결제 완료 + 기간 만료 X)
        int activeSubscriptions = reservationMapper.countActiveSubscriptions(); // 이 함수는 직접 구현해야 함

        // 가용 공간
        int availableSubscriptionSpots = totalSubscriptionSpots - activeSubscriptions;

        Map<String, Integer> result = new HashMap<>();
        result.put("totalSubscriptionSpots", totalSubscriptionSpots);
        result.put("activeSubscriptions", activeSubscriptions);
        result.put("availableSubscriptionSpots", availableSubscriptionSpots);
        return result;
    }

    @GetMapping("/my-parking-status")
    public ResponseEntity<?> getMyParkingStatus(@AuthenticationPrincipal CustomUserDetails userDetails) {
        Long memberId = userDetails.getMember().getMemberId();
        ParkingStatusDto parkingStatus = parkingLogService.getCurrentParkingStatus(memberId);

        Map<String, Object> response = new HashMap<>();
        response.put("parking", parkingStatus); // parkingStatus가 null이어도 예외 안 남

        return ResponseEntity.ok(response);
    }
}
