package com.aipms.controller;

import com.aipms.domain.FireLog;
import com.aipms.dto.FireAlertTargetDto;
import com.aipms.dto.Page;
import com.aipms.service.FireLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/fire")
@RequiredArgsConstructor
public class FireLogController {

    private final FireLogService fireLogService;

    @GetMapping("/logs/paged")
    @ResponseBody
    public Page<FireLog> getFireLogsPaged(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size)
    {
        return fireLogService.getPagedFireLogs(page, size);
    }

    @PostMapping("/update-note")
    @ResponseBody
    public String updateLogs(@RequestBody FireLog log) {
        fireLogService.updateLogs(log);
        return "노트 저장 완료";
    }

}
