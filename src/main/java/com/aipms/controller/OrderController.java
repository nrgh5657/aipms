package com.aipms.controller;

import com.aipms.dto.OrderRequestDto;
import com.aipms.mapper.OrderMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderMapper orderMapper;

    @PostMapping
    public ResponseEntity<String> saveOrder(@RequestBody OrderRequestDto dto) {
        orderMapper.insertOrder(dto);
        return ResponseEntity.ok("✅ 주문 저장 완료");
    }
}
