package com.aipms.controller;

import com.aipms.domain.Member;
import com.aipms.dto.MemberDto;
import com.aipms.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Controller
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final BCryptPasswordEncoder passwordEncoder; // ✅ 해결 포인트: passwordEncoder 주입

    // ✅ 회원가입
//    @PostMapping("/register")
//    public ResponseEntity<Map<String, String>> register(@RequestBody MemberDto memberDto) {
//        // ❌ 암호화하지 말고 그대로 넘긴다
//        memberService.register(memberDto);
//
//        return ResponseEntity.ok(Map.of("message", "회원가입 완료"));
    //}

    @PostMapping("/register")
    public String register(@ModelAttribute MemberDto memberDto) {
        memberService.register(memberDto);
        return "redirect:/member/login"; // 또는 가입 완료 페이지로 이동
    }

    // ✅ 이메일로 회원 정보 조회
    @ResponseBody
    @GetMapping("/{email}")
    public ResponseEntity<Member> getMember(@PathVariable String email) {
        return ResponseEntity.ok(memberService.getMemberByEmail(email));
    }


}
