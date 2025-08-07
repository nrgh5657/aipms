package com.aipms.service;

import com.aipms.dto.CarDto;
import com.aipms.dto.MemberDto;
import com.aipms.dto.MembershipInfoResponseDto;
import com.aipms.dto.MyPageInfoDto;
import com.aipms.mapper.MemberMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MyPageInfoServiceImpl implements MyPageInfoService {

    private final MemberMapper memberMapper;
    private final MemberService memberService;
    private final MembershipService membershipService;
    private final CarService carService;

    @Override
    public MyPageInfoDto getMyPageInfo(Long memberId) {
        MyPageInfoDto dto = new MyPageInfoDto();

        MemberDto memberInfo = memberService.getMemberInfo(memberId);
        MembershipInfoResponseDto membershipInfo = membershipService.getMembershipInfo(memberId);
        List<CarDto> carList = carService.getCarsByMemberId(memberId);

        dto.setMemberInfo(memberInfo);
        dto.setMembershipInfo(membershipInfo);
        dto.setCarList(carList);

        return dto;
    }

    @Override // 인터페이스에도 반드시 추가!
    public void updateMemberInfo(Long memberId, MemberDto dto) {
        dto.setMemberId(memberId); // 혹시 dto에 memberId가 안들어오면 여기서 넣어줌
        memberMapper.updateMemberInfo(dto); // MyBatis의 update 쿼리 필요!
    }
}
