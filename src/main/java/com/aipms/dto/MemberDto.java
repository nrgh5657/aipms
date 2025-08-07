package com.aipms.dto;

import com.aipms.domain.Member;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class MemberDto {
    private Long memberId;
    private String email;
    private String password;
    private String newPassword;
    private String name;
    private String phone;
    private String carNumber; // 차량 번호 (선택)
    private String carModel;
    private boolean agreeToMarketing; // 마케팅 수신 동의 여부
    private boolean agreeToTerms;     // 서비스 약관 동의 여부 (필수)
    private boolean agreeToPrivacy;   // 개인정보 수집 동의 여부 (필수)
    private boolean subscription; // false 기본
    private String role;
    private String status;        // 기본 "ACTIVE"
    private String kakaoId;       // null
    private String loginType;     // "NORMAL", "KAKAO"
    private LocalDateTime regDate;
    private String profileImage;
    private LocalDate birth; // 가입일
    private MultipartFile profileImageFile;

    public MemberDto() {
    }

    // Member 객체를 기반으로 초기화하는 생성자 추가 (어노테이션 없이)
    public MemberDto(Member member) {
        this.memberId = member.getMemberId();
        this.email = member.getEmail();
        this.password = member.getPassword();
        this.name = member.getName();
        this.phone = member.getPhone();
        this.carNumber = member.getCarNumber();
        this.carModel = member.getCarModel();
        this.agreeToMarketing = member.getAgreeToMarketing();
        this.agreeToTerms = member.getAgreeToTerms();
        this.agreeToPrivacy = member.getAgreeToPrivacy();
        this.subscription = member.getSubscription();
        this.role = member.getRole();
        this.status = member.getStatus();
        this.kakaoId = member.getKakaoId();
        this.loginType = member.getLoginType();
        this.regDate = member.getRegDate();
        this.profileImage = member.getProfileImage();
        this.birth = member.getBirth();
    }
}
