package com.aipms.service;

import com.aipms.domain.Car;
import com.aipms.mapper.CarMapper;
import com.aipms.mapper.KakaoTokenMapper;
import com.aipms.mapper.MemberMapper;
import lombok.RequiredArgsConstructor;
import com.aipms.domain.Member;
import com.aipms.dto.MemberDto;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberMapper memberMapper;
    private final KakaoTokenMapper kakaoTokenMapper;
    private final BCryptPasswordEncoder passwordEncoder;
    private final CarMapper carMapper;

    //회원 등록
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

        String memberCode = String.format("M%03d", member.getMemberId());

        memberMapper.updateMemberCode(member.getMemberId(), memberCode);

        Car car = new Car();
        car.setMemberId(member.getMemberId());
        car.setCarNumber(dto.getCarNumber());
        car.setCarType("null"); // 기본값, 또는 dto에서 받아도 됨
        car.setRegDate(LocalDateTime.now());

        carMapper.insertCar(car); // 매퍼 호출
    }

    //멤버 코드 업데이트
    @Override
    public void updateMemberCode(Long memberId, String memberCode) {
        memberMapper.updateMemberCode(memberId, memberCode);

    }

    //이메일로 회원 조회
    @Override
    public Member getMemberByEmail(String email) {
        return memberMapper.findByEmail(email);
    }

    //전체 회원 조회
    @Override
    public List<Member> findAllMembers() {
        return memberMapper.findAll();
    }

    //멤버 코드로 멤버 삭제
    @Override
    @Transactional
    public void deleteByMemberCode(String memberCode) {
        Member member = memberMapper.findByMemberCode(memberCode);
        if (member != null) {
            if (member.getKakaoId() != null && !member.getKakaoId().isBlank()) {
                kakaoTokenMapper.deleteByKakaoId(member.getKakaoId());
            }
            memberMapper.deleteByMemberCode(memberCode);
        }
    }

    //회원 계정 비활성화
    @Override
    public void deactivateMember(String memberCode) {
        memberMapper.deactivateMember(memberCode);
    }

    //회원 계성 활성화
    @Override
    public void activateMember(String memberCode) {
        memberMapper.activateMember(memberCode);
    }
    
    //회원 정보 수정
    @Override
    public void updateMember(String id, MemberDto dto) {
        Member member = memberMapper.findById(id);
        if (member == null) {
            throw new RuntimeException("존재하지 않는 회원입니다: " + id);
        }

        // DTO 값으로 덮어쓰기
        member.setName(dto.getName());
        member.setCarNumber(dto.getCarNumber());
        member.setCarModel(dto.getCarModel());
        member.setPhone(dto.getPhone());
        member.setEmail(dto.getEmail());
        member.setStatus(dto.getStatus());
        member.setSubscription(dto.isSubscription());

        memberMapper.update(member);

    }
    
    //페이징 처리 적용 회원 조회
    @Override
    public List<Member> findPagedMembers(int offset, int size) {
        return memberMapper.findPagedMembers(offset, size);
    }
    //페이징 처리를 위한 전체 회원수 카운트
    @Override
    public int countAllMembers() {
        return memberMapper.countAllMembers();
    }
    
    //로그인 확인
    @Override
    public boolean login(String email, String password) {
        Member member = memberMapper.findByEmail(email);
        return member != null && member.getPassword().equals(password);
    }
}
