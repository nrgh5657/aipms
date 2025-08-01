package com.aipms.controller;

import com.aipms.dto.CctvLogSearchRequestDto;
import com.aipms.dto.CctvLogStatisticsDto;
import com.aipms.service.CctvLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/cctv/")
@RequiredArgsConstructor
public class CctvLogController {

    private final CctvLogService cctvLogService;

    @GetMapping("/logs")
    public ResponseEntity<Map<String, Object>> getCctvLogs(
            @ModelAttribute CctvLogSearchRequestDto dto) {
        return ResponseEntity.ok(cctvLogService.getPagedLogs(dto));
    }

    @GetMapping("/countLog")
    public ResponseEntity<CctvLogStatisticsDto> getLogSummary() {
        return ResponseEntity.ok(cctvLogService.getLogSummary());
    }

}
