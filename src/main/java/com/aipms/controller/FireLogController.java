package com.aipms.controller;

import com.aipms.domain.FireLog;
import com.aipms.dto.PageDto;
import com.aipms.service.FireLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/fire")
@RequiredArgsConstructor
public class FireLogController {

    private final FireLogService fireLogService;

    //화재 감지 로그 페이징 처리
    @GetMapping("/logs/paged")
    @ResponseBody
    public PageDto<FireLog> getFireLogsPaged(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size)
    {
        return fireLogService.getPagedFireLogs(page, size);
    }
    //화재 감지 관리자 코멘트 수정
    @PostMapping("/update-note")
    @ResponseBody
    public String updateLogs(@RequestBody FireLog log) {
        fireLogService.updateLogs(log);
        return "노트 저장 완료";
    }

}
