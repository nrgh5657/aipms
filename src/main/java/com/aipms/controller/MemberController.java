package com.aipms.controller;

import com.aipms.domain.Member;
import com.aipms.dto.MemberDto;
import com.aipms.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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
    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody MemberDto memberDto) {
        memberService.register(memberDto); // 등록 + memberCode 생성까지 끝남

        Member registered = memberService.getMemberByEmail(memberDto.getEmail());
        if (registered == null) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "회원가입 실패: 등록된 회원 정보를 찾을 수 없습니다."));
        }

        return ResponseEntity.ok(Map.of(
                "message", "회원가입 완료",
                "memberCode", registered.getMemberCode()
        ));
    }

    // ✅ 이메일로 회원 정보 조회
    @ResponseBody
    @GetMapping("/{email}")
    public ResponseEntity<Member> getMember(@PathVariable String email) {
        return ResponseEntity.ok(memberService.getMemberByEmail(email));
    }

    //✅모든 정보 조회
    @GetMapping("/all")
    public ResponseEntity<List<Member>> getAllMembers() {
        return ResponseEntity.ok(memberService.findAllMembers());
    }

    //✅멤버 리스트 페이징 처리
    @GetMapping("/list")
    @ResponseBody
    public Map<String, Object> getMemberList(
            @RequestParam(defaultValue ="1") int page,
            @RequestParam(defaultValue = "10") int size) {
        int offset = (page - 1) * size;

        List<Member> members = memberService.findPagedMembers(offset, size);
        int totalCount = memberService.countAllMembers();

        Map<String, Object> result = new HashMap<>();
        result.put("content", members);
        result.put("totalPages", (int) Math.ceil((double) totalCount / size));
        result.put("totalElements", totalCount);
        result.put("page", page);
        result.put("size", size);

        return result;
    }

    //✅ 회원 정보 수정
    @PutMapping("/modify/{id}")
    public ResponseEntity<?> updateMember(
            @PathVariable String id,
            @RequestBody MemberDto dto
    ) {
        memberService.updateMember(id, dto);
        return ResponseEntity.ok(Map.of("message", "회원 수정 완료"));
    }
    //✅ 회원 정보 완전 삭제 - 코드만 남아 있음
    @DeleteMapping("/delete/{memberCode}")
    @ResponseBody
    public ResponseEntity<String> deleteMember(@PathVariable String memberCode) {
        System.out.println("삭제 요청 수신: " + memberCode);
        memberService.deleteByMemberCode(memberCode); // memberCode 기준으로 삭제
        return ResponseEntity.ok("삭제 완료");
    }

    //✅회원 비활성화
    @PutMapping("/deactivate/{memberCode}")
    @ResponseBody
    public ResponseEntity<String> deactivateMember(@PathVariable String memberCode) {
        try {
            memberService.deactivateMember(memberCode); // 서비스에서 status만 INACTIVE로 바꿈
            return ResponseEntity.ok("회원이 비활성화되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("비활성화 중 오류 발생: " + e.getMessage());
        }
    }
    //✅회원 활성화
    @PutMapping("/activate/{memberCode}")
    @ResponseBody
    public ResponseEntity<String> activateMember(@PathVariable String memberCode) {
        try {
            memberService.activateMember(memberCode); // 서비스에서 status만 INACTIVE로 바꿈
            return ResponseEntity.ok("회원이 활성화되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("활성화 중 오류 발생: " + e.getMessage());
        }
    }


}
