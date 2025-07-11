package com.aipms.service;

import com.aipms.mapper.MemberMapper;
import lombok.RequiredArgsConstructor;
import com.aipms.domain.Member;
import com.aipms.dto.MemberDto;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberMapper memberMapper;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    public void register(MemberDto dto) {
        Member member = new Member();

        member.setEmail(dto.getEmail());
        member.setPassword(passwordEncoder.encode(dto.getPassword())); // 암호화
        member.setName(dto.getName());
        member.setPhone(dto.getPhone());
        member.setCarNumber(dto.getCarNumber());

        member.setAgreeToMarketing(dto.isAgreeToMarketing());
        member.setAgreeToTerms(dto.isAgreeToTerms());
        member.setAgreeToPrivacy(dto.isAgreeToPrivacy());

        member.setRole("USER"); // 기본 권한
        member.setSubscription(false); // 정기권 미가입
        member.setKakaoId(null); // 카카오 연동 아님
        member.setLoginType("NORMAL");
        member.setRegDate(dto.getRegDate() != null ? dto.getRegDate() : LocalDateTime.now());

        memberMapper.insertMember(member);
    }


    @Override
    public Member getMemberByEmail(String email) {
        return memberMapper.findByEmail(email);
    }

    @Override
    public List<Member> findAllMembers() {
        return memberMapper.findAll();
    }

    @Override
    public boolean login(String email, String password) {
        Member member = memberMapper.findByEmail(email);
        return member != null && member.getPassword().equals(password);
    }
}
