package com.aipms.controller;

import com.aipms.domain.FireLog;
import com.aipms.service.FireLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

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
}
