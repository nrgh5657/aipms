package com.aipms.controller;

import com.aipms.dto.ParkingConfigDto;
import com.aipms.service.ParkingConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/parking-config")
@RequiredArgsConstructor
public class ParkingConfigController {
    private final ParkingConfigService parkingConfigService;

    @GetMapping
    public ResponseEntity<ParkingConfigDto> getConfig() {
        ParkingConfigDto config = parkingConfigService.getConfig();
        if (config == null) {
            config = new ParkingConfigDto();
            config.setTotalSpaces(0); // 기본값
            config.setFixedSubscriptionSpaces(0); // 기본값
        }
        return ResponseEntity.ok(config);
    }

    @PostMapping("/setConfig")
    public ResponseEntity<?> updateParkingConfig(@RequestBody ParkingConfigDto dto) {
        try {
            parkingConfigService.setConfig(dto);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", e.getMessage()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "message", "설정 저장 실패: " + e.getMessage()
            ));
        }
    }
}
