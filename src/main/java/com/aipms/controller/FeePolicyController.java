package com.aipms.controller;

import com.aipms.dto.FeePolicyDto;
import com.aipms.service.FeePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/policy/fee")
@RequiredArgsConstructor
public class FeePolicyController {

    private final FeePolicyService feePolicyService;

    @GetMapping("/all")
    public List<FeePolicyDto> getAllPolicies() {
        return feePolicyService.getAllPolicies();
    }

    @GetMapping("/{id}")
    public FeePolicyDto getPolicy(@PathVariable Long id) {
        return feePolicyService.getPolicyById(id);
    }

    @PostMapping("/update")
    public ResponseEntity<String> updatePolicy(@RequestBody FeePolicyDto dto) {
        boolean updated = feePolicyService.updatePolicy(dto);
        return updated ? ResponseEntity.ok("수정 완료") : ResponseEntity.status(500).body("수정 실패");
    }
}
