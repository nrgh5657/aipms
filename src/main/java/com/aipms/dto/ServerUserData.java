package com.aipms.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ServerUserData {
    private String name;
    private String role;        // 실제 ROLE_USER, ROLE_ADMIN 등
    private String displayRole; // JS에서 쓸 별칭 예: "CUSTOMER"
}
