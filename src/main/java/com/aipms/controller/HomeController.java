package com.aipms.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
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
                            @org.springframework.security.core.annotation.AuthenticationPrincipal Object principal,
                            org.springframework.ui.Model model) {

        if (principal instanceof com.aipms.security.CustomUserDetails userDetails) {
            model.addAttribute("member", userDetails.getMember());
        } else if (principal instanceof OAuth2User oauthUser) {
            model.addAttribute("member", oauthUser.getAttributes()); // 또는 필요한 속성 추출
        } else {
            return "redirect:/member/login?error=noauth";
        }

        // 권한에 따라 분기
        if (request.isUserInRole("ROLE_ADMIN")) {
            return "admin-dashboard";
        } else if (request.isUserInRole("ROLE_USER")) {
            return "my-records";
        } else {
            return "redirect:/member/login?error=noauth";
        }
    }

}
