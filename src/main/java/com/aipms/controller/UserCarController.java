package com.aipms.controller;

import com.aipms.dto.CarDto;
import com.aipms.security.CustomUserDetails;
import com.aipms.service.CarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserCarController {

    private final CarService carService;

    @GetMapping("/cars")
    public ResponseEntity<List<CarDto>> getUserCars(@AuthenticationPrincipal Object principal) {
        Long userId = null;

        if (principal instanceof CustomUserDetails userDetails) {
            userId = userDetails.getMember().getMemberId();

        } else if (principal instanceof org.springframework.security.oauth2.core.user.OAuth2User oauthUser) {
            // 예: nickname으로 DB 조회해서 userId 가져오기
            var props = (java.util.Map<String, Object>) oauthUser.getAttributes().get("properties");
            String nickname = (String) props.get("nickname");

            // 실제 DB에 저장된 회원 정보에서 userId를 가져와야 함 (예: nickname 기반)
            userId = carService.findMemberIdByNickname(nickname); // 이 메서드를 서비스에 구현 필요
        }

        if (userId == null) {
            return ResponseEntity.badRequest().build(); // 또는 401 Unauthorized
        }

        List<CarDto> cars = carService.getMyCars(userId);
        return ResponseEntity.ok(cars);
    }
}
