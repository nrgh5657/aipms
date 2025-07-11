package com.aipms.controller;

import com.aipms.domain.FireLog;
import com.aipms.dto.FireAlertTargetDto;
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

    @GetMapping("/logs/json")
    @ResponseBody
    public List<FireLog> getFireLogsJson() {
        return fireLogService.getAllFireLogs();
    }

    @PostMapping("/update-note")
    @ResponseBody
    public String updateLogs(@RequestBody FireLog log) {
        fireLogService.updateLogs(log);
        return "노트 저장 완료";
    }

}
