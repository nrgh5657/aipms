package com.aipms.service;

import com.aipms.domain.KakaoToken;
import com.aipms.domain.Member;
import com.aipms.mapper.KakaoTokenMapper;
import com.aipms.mapper.MemberMapper;
import com.aipms.security.CustomUserDetails;
import com.aipms.util.AES256Util;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private final MemberMapper memberMapper;
    private final KakaoTokenMapper kakaoTokenMapper;
    private final AES256Util aes256Util;
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User user = new DefaultOAuth2UserService().loadUser(userRequest);
        System.out.println("🟡 OAuth2 Attributes: " + user.getAttributes());

        Map<String, Object> kakaoAccount = (Map<String, Object>) user.getAttributes().get("kakao_account");
        Map<String, Object> profile = (Map<String, Object>) kakaoAccount.get("profile");

        String name = (String) profile.get("nickname");
        String kakaoId = Long.toString((Long) user.getAttribute("id"));
        String email = "kakao_" + kakaoId + "@demo.local";

        // ✅ 회원 등록 또는 갱신
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
            if (existing.getKakaoId() == null || existing.getKakaoId().isBlank()) {
                existing.setKakaoId(kakaoId);
                memberMapper.updateMemberKakaoId(existing);
            }
        }

        // ✅ 본인 토큰 저장
        try {
            OAuth2AccessToken accessToken = userRequest.getAccessToken();

            KakaoToken token = new KakaoToken();
            token.setKakaoId(kakaoId);
            token.setAccessToken(aes256Util.encrypt(accessToken.getTokenValue()));
            token.setNickname(name); // 본인 닉네임 저장

            Object refresh = userRequest.getAdditionalParameters().get("refresh_token");
            if (refresh != null) {
                token.setRefreshToken(aes256Util.encrypt(refresh.toString()));
            }

            token.setIssuedAt(LocalDateTime.now());
            token.setExpiresAt(LocalDateTime.ofInstant(accessToken.getExpiresAt(), ZoneId.systemDefault()));

            if (kakaoTokenMapper.findByKakaoId(kakaoId) == null) {
                kakaoTokenMapper.insertToken(token);
            } else {
                kakaoTokenMapper.updateToken(token);
            }

            // ✅ 친구 목록 조회하여 DB 내 회원에게 uuid 매핑
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setBearerAuth(accessToken.getTokenValue());
                HttpEntity<Void> entity = new HttpEntity<>(headers);

                ResponseEntity<JsonNode> response = restTemplate.exchange(
                        "https://kapi.kakao.com/v1/api/talk/friends",
                        HttpMethod.GET,
                        entity,
                        JsonNode.class
                );

                JsonNode elements = response.getBody().get("elements");

                if (elements != null) {
                    for (JsonNode friend : elements) {
                        String uuid = friend.get("uuid").asText();
                        String nickname = friend.get("profile_nickname").asText();

                        // ✅ 회원 테이블에서 nickname으로 검색
                        Member target = memberMapper.findByName(nickname);
                        if (target != null) {
                            KakaoToken friendToken = kakaoTokenMapper.findByKakaoId(target.getKakaoId());
                            if (friendToken != null) {
                                friendToken.setUuid(uuid);
                                friendToken.setNickname(nickname);
                                kakaoTokenMapper.updateToken(friendToken);
                            }
                        }
                    }
                } else {
                    System.out.println("⚠️ 친구 목록이 비어있음");
                }

            } catch (Exception e) {
                System.err.println("❌ 친구 목록에서 uuid 조회 실패: " + e.getMessage());
            }

        } catch (Exception e) {
            throw new IllegalStateException("🔐 Kakao 토큰 암호화 실패", e);
        }

        Member member = memberMapper.findByEmail(email);
        return new CustomUserDetails(member, user.getAttributes());
    }
}
