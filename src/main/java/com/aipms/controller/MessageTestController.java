package com.aipms.controller;

import com.aipms.security.CustomUserDetails;
import com.aipms.service.KakaoMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequiredArgsConstructor
@RequestMapping("/api/alert")
public class MessageTestController {
    private final KakaoMessageService kakaoMessageService;

    @GetMapping("/test/send-alert")
    public String sendTestAlert(@AuthenticationPrincipal CustomUserDetails userDetails) {
        String kakaoId = userDetails.getMember().getKakaoId();
        kakaoMessageService.sendMessageToMe(kakaoId);
        return "redirect:/dashboard"; // 또는 다른 화면
    }

    @PostMapping("/send-messages")
    @ResponseBody
    public String sendMessagesToUsers(@RequestBody List<String> kakaoIdList) {
        int count = 0;
        for (String kakaoId : kakaoIdList) {
            try {
                kakaoMessageService.sendMessageToMe(kakaoId);
                count++;
            } catch (Exception e) {
                System.out.println("❌ 전송 실패: " + kakaoId + " - " + e.getMessage());
            }
        }
        return count + "명의 사용자에게 메시지를 전송했습니다.";
    }

}
