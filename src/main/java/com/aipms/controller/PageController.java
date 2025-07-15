    package com.aipms.controller;

    import com.aipms.security.CustomUserDetails;
    import jakarta.servlet.http.HttpServletRequest;
    import org.springframework.stereotype.Controller;
    import org.springframework.ui.Model;
    import org.springframework.web.bind.annotation.GetMapping;
    import org.springframework.security.core.annotation.AuthenticationPrincipal;

    @Controller
    public class PageController {

        // ✅ 주차 예약 페이지
        @GetMapping("/reservation")
        public String reservationPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
            if (userDetails == null) return "redirect:/member/login";
            model.addAttribute("member", userDetails.getMember());
            return "reservation";
        }

        // ✅ 요금 결제 페이지
        @GetMapping("/payment")
        public String paymentPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
            if (userDetails == null) return "redirect:/member/login";
            model.addAttribute("member", userDetails.getMember());
            return "payment";
        }

        // ✅ 이용 내역 페이지
        @GetMapping("/my-records")
        public String recordsPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
            if (userDetails == null) return "redirect:/member/login";
            model.addAttribute("member", userDetails.getMember());
            return "my-records";
        }

        // ✅ 내 정보 페이지
        @GetMapping("/my-info")
        public String infoPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
            if (userDetails == null) return "redirect:/member/login";
            model.addAttribute("member", userDetails.getMember());
            return "my-info";
        }

        // ✅ 고객지원 페이지
        @GetMapping("/support")
        public String supportPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
            if (userDetails == null) return "redirect:/member/login";
            model.addAttribute("member", userDetails.getMember());
            return "support";
        }
    }
