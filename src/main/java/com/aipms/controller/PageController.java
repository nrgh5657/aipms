package com.aipms.controller;

import com.aipms.domain.Member;
import com.aipms.security.CustomUserDetails;
import com.google.gson.Gson;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.HashMap;
import java.util.Map;

@Controller
public class PageController {

    // 공통 유저 JSON 처리
    private void addUserDataToModel(CustomUserDetails userDetails, Model model) {
        Member member = userDetails.getMember();
        model.addAttribute("member", member);

        Map<String, Object> userData = new HashMap<>();
        userData.put("memberId", member.getMemberId());
        userData.put("user", member.getName());
        userData.put("role", member.getRole());
        userData.put("email", member.getEmail());
        userData.put("phone", member.getPhone());

        String userDataJson = new Gson().toJson(userData);
        model.addAttribute("userDataJson", userDataJson);
    }


    @GetMapping("/reservation")
    public String reservationPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails == null) return "redirect:/member/login";
        addUserDataToModel(userDetails, model);
        return "reservation";
    }

    @GetMapping("/payment")
    public String paymentPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails == null) return "redirect:/member/login";
        addUserDataToModel(userDetails, model);
        return "payment";
    }

    @GetMapping("/my-records")
    public String recordsPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails == null) return "redirect:/member/login";
        addUserDataToModel(userDetails, model);
        return "my-records";
    }

    @GetMapping("/my-info")
    public String infoPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails == null) return "redirect:/member/login";
        addUserDataToModel(userDetails, model);
        return "my-info";
    }

    @GetMapping("/support")
    public String supportPage(@AuthenticationPrincipal CustomUserDetails userDetails, Model model) {
        if (userDetails == null) return "redirect:/member/login";
        addUserDataToModel(userDetails, model);
        return "support";
    }
}
