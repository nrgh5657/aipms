package com.aipms;

import com.aipms.domain.Member;
import com.aipms.dto.MemberDto;
import com.aipms.mapper.MemberMapper;
import com.aipms.service.MemberService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
//@Transactional // 테스트 후 롤백 처리됨
public class MemberControllerTests {

    @Autowired
    private MemberService memberService;

    @Autowired
    private MemberMapper memberMapper;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @Test
    @DisplayName("회원가입 시 비밀번호 암호화되어 DB에 저장된다")
    void registerMemberWithEncryptedPassword() {
        // given
        MemberDto memberDto = new MemberDto();
        memberDto.setName("관리자유저3");
        memberDto.setEmail("test@aipms.com");
        memberDto.setPhone("01022222222");
        memberDto.setPassword("1234");
        memberDto.setRole("user");

        // when
        String rawPassword = memberDto.getPassword();
        String encodedPassword = passwordEncoder.encode(rawPassword);
        memberDto.setPassword(encodedPassword);

        memberService.register(memberDto); // 실제 저장

        // then
        Member savedMember = memberMapper.findByEmail("test@aipms.com");
        assertThat(savedMember).isNotNull(); // 널 아닌지 체크

        System.out.println("🔐 암호화된 비밀번호: " + savedMember.getPassword());

        assertThat(savedMember.getName()).isEqualTo("테스트유저");
        assertThat(passwordEncoder.matches("1234", savedMember.getPassword())).isTrue(); // 암호화 비교
    }
}
