package com.aipms.mapper;

import com.aipms.domain.KakaoToken;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface KakaoTokenMapper {

    //카카오 아이디로 카카오 토근 조회
    KakaoToken findByKakaoId(String kakaoId);
    //카카오 회원가입 및 로그인시 토큰 저장
    void insertToken(KakaoToken token);

    //카카오 아이디를 가진 사용자의 카카오 토큰 정보 갱신
    void updateToken(KakaoToken token);
    
    //카카오 아이디를 가진 사용자의 카카오 토큰 정보 삭제
    void deleteByKakaoId(String kakaoId);
}
