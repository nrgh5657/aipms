package com.aipms.security;

import com.aipms.domain.Member;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@Getter
public class CustomUserDetails implements UserDetails, OAuth2User {

    private final Member member;
    private Map<String, Object> attributes;

    public CustomUserDetails(Member member) {
        this.member = member;
    }

    // ✅ OAuth2User 전용 생성자 추가
    public CustomUserDetails(Member member, Map<String, Object> attributes) {
        this.member = member;
        this.attributes = attributes;
    }

    public Long getMemberId() {
        return member.getMemberId();
    }

    public Long getId() {
        return member.getMemberId();
    }

    public String getEmail() {
        return member.getEmail();
    }


    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singleton(new SimpleGrantedAuthority("ROLE_" + member.getRole()));
    }

    @Override
    public String getUsername() {
        return member.getEmail();
    }

    @Override
    public String getPassword() {
        return member.getPassword();
    }



    @Override public boolean isAccountNonExpired() { return true; }

    @Override public boolean isAccountNonLocked() { return true; }

    @Override public boolean isCredentialsNonExpired() { return true; }

    @Override public boolean isEnabled() { return member.getStatus().equalsIgnoreCase("ACTIVE"); }

    // ✅ OAuth2User의 필수 구현
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }


    // ✅ Thymeleaf나 Security에서 name으로 쓸 값
    @Override
    public String getName() {
        return member.getName(); // 또는 member.getEmail() 등
    }
}
