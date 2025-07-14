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

//    @GetMapping("/test/send-direct")
//    @ResponseBody
//    public String sendDirectMessage() {
//        String kakaoId = "123456789L"; // 여기 실제 존재하는 kakaoId를 넣으세요
//        try {
//            kakaoMessageService.sendMessageToMe(kakaoId);
//            return "✅ 메시지 전송 성공";
//        } catch (Exception e) {
//            e.printStackTrace();
//            return "❌ 전송 실패: " + e.getMessage();
//        }
//    }


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
