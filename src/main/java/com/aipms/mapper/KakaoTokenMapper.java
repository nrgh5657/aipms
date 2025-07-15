package com.aipms.mapper;

import com.aipms.domain.KakaoToken;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface KakaoTokenMapper {
    KakaoToken findByKakaoId(String kakaoId);
    void insertToken(KakaoToken token);
    void updateToken(KakaoToken token);
    void deleteByKakaoId(String kakaoId);
}
