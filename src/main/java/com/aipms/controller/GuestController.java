package com.aipms.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/guest")
public class GuestController {

    @PostMapping("/token")
    public ResponseEntity<Map<String, Object>> issueGuestToken() {
        // UUID 또는 랜덤 토큰 생성
        String guestToken = UUID.randomUUID().toString();

        Map<String, Object> response = new HashMap<>();
        response.put("guestToken", guestToken);
        response.put("issuedAt", LocalDateTime.now());

        return ResponseEntity.ok(response);
    }
}
