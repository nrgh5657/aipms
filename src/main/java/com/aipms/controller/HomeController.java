package com.aipms.controller;

import com.aipms.domain.Member;
import com.aipms.security.CustomUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

import java.util.HashMap;
import java.util.Map;

@Controller
public class HomeController {

    @GetMapping("/")
    public String index(@org.springframework.security.core.annotation.AuthenticationPrincipal com.aipms.security.CustomUserDetails userDetails,
                        org.springframework.ui.Model model) {
        if (userDetails != null) {
            model.addAttribute("member", userDetails.getMember());
        }
        return "index";
    }

    @GetMapping("/member/login")
    public String login(){
        return "login";
    }

    @GetMapping("/member/signup")
    public String memberSignup() {
        return "signup"; // 같은 템플릿 반환
    }

    @GetMapping("/dashboard")
    public String dashboard(HttpServletRequest request,
                            @AuthenticationPrincipal Object principal,
                            Model model) {

        Member member = null;

        if (principal instanceof CustomUserDetails userDetails) {
            member = userDetails.getMember();
        } else if (principal instanceof OAuth2User oauthUser) {
            Map<String, Object> attributes = oauthUser.getAttributes();
            Map<String, Object> props = (Map<String, Object>) attributes.get("properties");

            member = new Member();
            member.setName((String) props.get("nickname"));
            member.setRole("USER");

            Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
            if (kakaoAccount != null && kakaoAccount.get("email") != null) {
                member.setEmail((String) kakaoAccount.get("email"));
            }
        } else {
            return "redirect:/member/login?error=noauth";
        }

        // Thymeleaf에서 직접 사용될 사용자 정보 주입
        model.addAttribute("member", member); // 단순 참조용

        Map<String, Object> userDataMap = new HashMap<>();
        userDataMap.put("user", member.getName());
        userDataMap.put("role", member.getRole());
        userDataMap.put("email", member.getEmail());
        userDataMap.put("phone", member.getPhone());
        userDataMap.put("carNumber", member.getCarNumber());

        // ✅ 문자열(JSON)로 변환하지 말고 객체 그대로 넘김
        model.addAttribute("userDataJson", userDataMap);

        // 대시보드 분기
        if (request.isUserInRole("ROLE_ADMIN")) {
            return "admin-dashboard";
        } else if (request.isUserInRole("ROLE_USER")) {
            return "viewport";
        } else {
            return "redirect:/member/login?error=noauth";
        }
    }

}
