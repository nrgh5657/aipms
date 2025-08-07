package com.aipms.controller;

import com.aipms.dto.FeePolicyDto;
import com.aipms.service.FeePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fee-policy")
@RequiredArgsConstructor
public class PublicFeePolicyController {

    private final FeePolicyService feePolicyService;

    @GetMapping("/latest")
    public ResponseEntity<FeePolicyDto> getLatestFeePolicy() {
        FeePolicyDto latestPolicy = feePolicyService.getActivePolicyByType("TIME");
        if (latestPolicy == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(latestPolicy);
    }

}
