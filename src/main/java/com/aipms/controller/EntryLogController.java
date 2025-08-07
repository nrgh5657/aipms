package com.aipms.controller;

import com.aipms.domain.EntryLog;
import com.aipms.dto.EntryLogDto;
import com.aipms.service.EntryLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/entry")
@RequiredArgsConstructor
public class EntryLogController {

    private final EntryLogService entryLogService;

    @PostMapping("/in")
    public ResponseEntity<String> logEntry(@RequestBody EntryLogDto dto) {
        entryLogService.logEntry(dto);
        return ResponseEntity.ok("입차 완료");
    }

    @PostMapping("/out/{vehicleId}")
    public ResponseEntity<String> logExit(@PathVariable Long vehicleId) {
        entryLogService.logExit(vehicleId);
        return ResponseEntity.ok("출차 완료");
    }

    @GetMapping("/parking/{parkingId}")
    public ResponseEntity<List<EntryLog>> getLogsByParking(@PathVariable Long parkingId) {
        return ResponseEntity.ok(entryLogService.getLogsByParking(parkingId));
    }
}
