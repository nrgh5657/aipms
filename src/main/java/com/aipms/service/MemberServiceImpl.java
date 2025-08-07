package com.aipms.service;

import com.aipms.domain.Car;
import com.aipms.dto.MemberFilterRequestDto;
import com.aipms.dto.MemberSummaryDto;
import com.aipms.mapper.CarMapper;
import com.aipms.mapper.KakaoTokenMapper;
import com.aipms.mapper.MemberMapper;
import lombok.RequiredArgsConstructor;
import com.aipms.domain.Member;
import com.aipms.dto.MemberDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberMapper memberMapper;
    private final KakaoTokenMapper kakaoTokenMapper;
    private final BCryptPasswordEncoder passwordEncoder;
    private final CarMapper carMapper;
    private final FileService fileService;
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
    public void deactivateMember(Long memberId) {
        memberMapper.deactivateMember(memberId);
    }

    //회원 계성 활성화
    @Override
    public void activateMember(Long memberId) {
        memberMapper.activateMember(memberId);
    }
    
    //회원 정보 수정
    @Override
    public void modifyMember(String id, MemberDto dto) {
        Member member = memberMapper.findById(Long.valueOf(id));
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

        memberMapper.modify(member);

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

    @Override
    public List<Member> findFilteredMembers(MemberFilterRequestDto req) {
        int offset = (req.getPage() - 1) * req.getSize();
        return memberMapper.selectFilteredMembers(req.getStatus(), req.getMembership(), req.getSize(), offset);
    }

    @Override
    public int countFilteredMembers(MemberFilterRequestDto req) {
        return memberMapper.countFilteredMembers(req.getStatus(), req.getMembership());
    }

    @Override
    public MemberSummaryDto getMemberSummary() {
        MemberSummaryDto dto = new MemberSummaryDto();
        dto.setTotal(memberMapper.countAllMembers());
        dto.setActive(memberMapper.countActiveMembers());
        dto.setMonthly(memberMapper.countMonthlyMembers());
        dto.setNewToday(memberMapper.countNewMembersToday());
        return dto;
    }

    //로그인 확인
    @Override
    public boolean login(String email, String password) {
        Member member = memberMapper.findByEmail(email);
        return member != null && member.getPassword().equals(password);
    }

    @Override
    public MemberDto getMemberInfo(Long memberId) {
        Member member = memberMapper.findById(memberId);
        if (member == null) {
            throw new IllegalArgumentException("해당 회원을 찾을 수 없습니다. ID: " + memberId);
        }
        return new MemberDto(member);
    }

    @Override
    public void deleteMember(Long memberId) {
        memberMapper.deleteMember(memberId);
    }

    @Override
    public void save(Member member) {
        memberMapper.updateMember(member);
    }


    @Override
    @Transactional
    public void updateMemberInfo(Long memberId, MemberDto updatedDto) {
        Member member = memberMapper.findById(memberId);
        if (member == null) {
            throw new RuntimeException("회원 정보를 찾을 수 없습니다.");
        }

        // ✅ 프로필 이미지 처리
        MultipartFile profileImageFile = updatedDto.getProfileImageFile();
        if (profileImageFile != null && !profileImageFile.isEmpty()) {
            try {
                String savedFileName = fileService.saveProfileImage(profileImageFile);
                log.info("✅ 저장된 프로필 이미지 파일명: {}", savedFileName);
                member.setProfileImage(savedFileName);
            } catch (Exception e) {
                log.error("❌ 프로필 이미지 저장 실패", e);
                throw new RuntimeException("프로필 이미지 저장 실패", e);
            }
        }


        // ✅ 일반 정보 업데이트
        member.setName(updatedDto.getName());
        member.setEmail(updatedDto.getEmail());
        member.setPhone(updatedDto.getPhone());
        member.setBirth(updatedDto.getBirth());

        // ✅ 비밀번호 변경이 있을 경우만 처리
        if (updatedDto.getPassword() != null && !updatedDto.getPassword().isBlank()) {
            String encodedPw = passwordEncoder.encode(updatedDto.getPassword());
            member.setPassword(encodedPw);
        }

        memberMapper.updateMember(member);
    }

    @Override
    @Transactional
    public void deleteByUsername(String email) {
        Member member = memberMapper.findByEmail(email);
        if (member == null) {
            throw new RuntimeException("회원 정보를 찾을 수 없습니다.");
        }

        if (member.getKakaoId() != null && !member.getKakaoId().isBlank()) {
            kakaoTokenMapper.deleteByKakaoId(member.getKakaoId());
        }

        memberMapper.deleteMember(member.getMemberId());
    }
}
