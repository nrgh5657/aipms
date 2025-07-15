package com.aipms.service;

import com.aipms.domain.KakaoToken;
import com.aipms.domain.Member;
import com.aipms.mapper.KakaoTokenMapper;
import com.aipms.mapper.MemberMapper;
import com.aipms.util.AES256Util;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Collections;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {
    private final MemberMapper memberMapper;
    private final KakaoTokenMapper kakaoTokenMapper;
    private final AES256Util aes256Util;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User user = new DefaultOAuth2UserService().loadUser(userRequest);
        System.out.println("🟡 OAuth2 Attributes: " + user.getAttributes());

        Map<String, Object> kakaoAccount = (Map<String, Object>) user.getAttributes().get("kakao_account");
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");

        String name = (String) profile.get("nickname");
        String kakaoId = Long.toString((Long) user.getAttribute("id"));
        String email = kakaoAccount.containsKey("email") ? (String) kakaoAccount.get("email") : "kakao_" + kakaoId + "@noemail.com";

        Member existing = memberMapper.findByEmail(email);
        if (existing == null) {
            Member newMember = new Member();
            newMember.setEmail(email);
            newMember.setPassword("OAUTH_USER");
            newMember.setName(name);
            newMember.setKakaoId(kakaoId);
            newMember.setLoginType("KAKAO");
            newMember.setRole("USER");
            newMember.setRegDate(LocalDateTime.now());
            newMember.setAgreeToTerms(true);
            newMember.setAgreeToPrivacy(true);
            newMember.setAgreeToMarketing(false);
            memberMapper.insertMember(newMember);
            Member inserted = memberMapper.findByEmail(email);
            String memberCode = String.format("M%03d", inserted.getMemberId());

            memberMapper.updateMemberCode(inserted.getMemberId(), memberCode);

        } else {
            // ✅ 기존 회원인데 kakaoId 없을 경우 업데이트
            if (existing.getKakaoId() == null || existing.getKakaoId().isBlank()) {
                existing.setKakaoId(kakaoId);
                memberMapper.updateMemberKakaoId(existing);
            }
        }

        try {
            OAuth2AccessToken accessToken = userRequest.getAccessToken();

            KakaoToken token = new KakaoToken();
            token.setKakaoId(kakaoId);

            // 🔐 암호화된 access_token 저장
            token.setAccessToken(aes256Util.encrypt(accessToken.getTokenValue()));

            // 🔐 refresh_token도 있으면 암호화
            Object refresh = userRequest.getAdditionalParameters().get("refresh_token");
            if (refresh != null) {
                token.setRefreshToken(aes256Util.encrypt(refresh.toString()));
            }

            token.setIssuedAt(LocalDateTime.now());
            token.setExpiresAt(LocalDateTime.ofInstant(accessToken.getExpiresAt(), ZoneId.systemDefault()));

            // 기존 insert/update 로직 유지
            if (kakaoTokenMapper.findByKakaoId(kakaoId) == null) {
                kakaoTokenMapper.insertToken(token);
            } else {
                kakaoTokenMapper.updateToken(token);
            }

        } catch (Exception e) {
            throw new IllegalStateException("🔐 Kakao 토큰 암호화 실패", e);
        }


        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_USER")),
                user.getAttributes(),
                "id"
        );
    }
}
