package com.aipms.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

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
                            @org.springframework.security.core.annotation.AuthenticationPrincipal com.aipms.security.CustomUserDetails userDetails,
                            org.springframework.ui.Model model) {

        // 사용자 정보 바인딩
        model.addAttribute("member", userDetails.getMember());

        // 권한에 따라 분기
        if (request.isUserInRole("ROLE_ADMIN")) {
            return "admin-dashboard";
        } else if (request.isUserInRole("ROLE_USER")) {
            return "my-records"; // 사용자용 페이지
        } else {
            return "redirect:/member/login?error=noauth";
        }
    }
}
