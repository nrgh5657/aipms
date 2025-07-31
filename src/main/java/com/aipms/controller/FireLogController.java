package com.aipms.controller;

import com.aipms.domain.FireLog;
import com.aipms.dto.FireAlertDto;
import com.aipms.dto.FireAlertLogRequestDto;
import com.aipms.dto.FireAlertResponseDto;
import com.aipms.dto.PageDto;
import com.aipms.service.FireLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/fire")
@RequiredArgsConstructor
public class FireLogController {

    private final FireLogService fireLogService;

    //화재 감지 로그 페이징 처리
    @GetMapping("/logs/paged")
    public ResponseEntity<PageDto<FireAlertResponseDto>> getPagedFireLogs(
            @RequestParam int page,
            @RequestParam int size,
            @RequestParam(required = false) String label,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String date
    ) {
        FireAlertLogRequestDto req = new FireAlertLogRequestDto();
        req.setPage(page);
        req.setLimit(size);
        req.setLabel(label);
        req.setLocation(location);
        req.setDate(date);

        PageDto<FireAlertResponseDto> result = fireLogService.getPagedFireLogs(req);
        return ResponseEntity.ok(result);
    }

    //화재 감지 관리자 코멘트 수정
    @PostMapping("/update-note")
    @ResponseBody
    public String updateLogs(@RequestBody FireLog log) {
        fireLogService.updateLogs(log);
        return "노트 저장 완료";
    }

}
