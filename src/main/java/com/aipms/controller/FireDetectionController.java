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

    //화재 감지 수신
    @PostMapping("/detected")
    public ResponseEntity<String> handleFireDetected(@RequestBody FireAlertDto dto) {
        System.out.println("🔥 수신된 DTO: " + dto);
        if (dto.getCameraId() == null || dto.getLabel() == null) {
            return ResponseEntity.badRequest().body("❌ JSON 파싱 실패 또는 필드 누락");
        }

        fireLogService.saveFireLogAndNotifyAdmins(dto);
        cctvLogService.saveFireLogAsRegular(dto);
        return ResponseEntity.ok("화재 로그 저장 완료");
    }


}
