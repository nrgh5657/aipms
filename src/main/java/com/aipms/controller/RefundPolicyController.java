package com.aipms.controller;

import com.aipms.dto.RefundPolicyDto;
import com.aipms.service.RefundPolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/policy/refund")
@RequiredArgsConstructor
public class RefundPolicyController {

    private final RefundPolicyService refundPolicyService;

    @GetMapping("/active")
    public ResponseEntity<RefundPolicyDto> getActivePolicy() {
        return ResponseEntity.ok(refundPolicyService.getActivePolicy());
    }

    @GetMapping("/{id}")
    public ResponseEntity<RefundPolicyDto> getPolicy(@PathVariable Long id) {
        return ResponseEntity.ok(refundPolicyService.getPolicyById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> updatePolicy(@PathVariable Long id, @RequestBody RefundPolicyDto dto) {
        dto.setId(id);
        refundPolicyService.updatePolicy(dto);
        return ResponseEntity.ok().build();
    }
}
