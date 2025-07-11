package com.aipms.controller;

import com.aipms.dto.FireAlertDto;
import com.aipms.service.CctvLogService;
import com.aipms.service.FireLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/fireDetect")
@RequiredArgsConstructor
public class FireDetectionController {

    private final FireLogService fireLogService;
    private final CctvLogService cctvLogService;

    @PostMapping("/detected")
    public ResponseEntity<String> handleFireDetected(@RequestBody FireAlertDto dto) {
        fireLogService.saveFireLog(dto);
        cctvLogService.saveFireLogAsRegular(dto);
        return ResponseEntity.ok("화재 로그 저장 완료");
    }
}
