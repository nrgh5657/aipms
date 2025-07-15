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
import java.util.List;
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
    public ResponseEntity<Map<String, String>> register(@RequestBody MemberDto memberDto) {
        // ❌ 암호화하지 말고 그대로 넘긴다
        memberService.register(memberDto);

        return ResponseEntity.ok(Map.of("message", "회원가입 완료"));
    }

    // ✅ 이메일로 회원 정보 조회
    @ResponseBody
    @GetMapping("/{email}")
    public ResponseEntity<Member> getMember(@PathVariable String email) {
        return ResponseEntity.ok(memberService.getMemberByEmail(email));
    }

    @GetMapping("/all")
    public ResponseEntity<List<Member>> getAllMembers() {
        return ResponseEntity.ok(memberService.findAllMembers());
    }

    @GetMapping("/list")
    @ResponseBody
    public List<Member> getMemberList() {
        return memberService.findAllMembers();
    }

    @DeleteMapping("/delete/{memberCode}")
    @ResponseBody
    public ResponseEntity<String> deleteMember(@PathVariable String memberCode) {
        System.out.println("삭제 요청 수신: " + memberCode);
        memberService.deleteByMemberCode(memberCode); // memberCode 기준으로 삭제
        return ResponseEntity.ok("삭제 완료");
    }


}
