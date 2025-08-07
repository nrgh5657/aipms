package com.aipms.service;

import com.aipms.dto.RefundPolicyDto;

public interface RefundPolicyService {
    RefundPolicyDto getActivePolicy();
    RefundPolicyDto getPolicyById(Long id);
    void updatePolicy(RefundPolicyDto policyDto);
}
