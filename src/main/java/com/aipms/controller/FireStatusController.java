package com.aipms.controller;

import com.aipms.domain.FireLog;
import com.aipms.service.FireDetectionService;
import com.aipms.service.FireLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class FireStatusController {
    private final FireDetectionService fireDetectionService;

    @PostMapping("/reset")
    public ResponseEntity<String> resetFireStatus(@RequestParam String cameraId){
        boolean result = fireDetectionService.resetFireStatus(cameraId);
        return ResponseEntity.ok(result ? "상태 리셋 완료" : "카메라 ID를 찾을수 없습니다.");
    }

}
