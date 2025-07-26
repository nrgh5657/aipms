package com.aipms.service;

import com.aipms.domain.Member;
import com.aipms.dto.*;
import com.aipms.mapper.MemberMapper;
import com.aipms.mapper.ParkingLogMapper;
import com.aipms.mapper.UsageHistoryMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UsageHistoryServiceImpl implements UsageHistoryService {

    private final UsageHistoryMapper usageHistoryMapper;
    private final MemberMapper memberMapper;
    private final ParkingLogMapper parkingLogMapper;

    @Override
    public List<UsageHistoryResponseDto> getHistory(Long memberId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime from = startDate.atStartOfDay();
        LocalDateTime to = endDate.plusDays(1).atStartOfDay(); // 끝나는 날 포함

        List<UsageHistoryDto> raw = usageHistoryMapper.getUsageHistory(memberId, from, to);

        return raw.stream()
                .map(this::toResponseDto) // 가공 메서드 호출
                .collect(Collectors.toList());
    }

    @Override
    public Long findMemberIdByKakaoId(String kakaoId) {
        Member member = memberMapper.findByKakaoId(kakaoId);
        if (member == null) throw new IllegalStateException("회원 정보를 찾을 수 없습니다.");
        return member.getMemberId();
    }

    @Override
    public List<UsageHistoryResponseDto> getRecentUsageHistory(Long memberId) {
        List<UsageHistoryDto> rawLogs = usageHistoryMapper.selectRecentUsageHistoryByMemberId(memberId);
        return rawLogs.stream()
                .map(this::toResponseDto)
                .collect(Collectors.toList());
    }

    @Override
    public PageDto<UsageHistoryResponseDto> getPagedUsageHistory(UsageHistoryRequestDto req) {
        List<UsageHistoryDto> list = usageHistoryMapper.getPagedUsageHistory(req);
        int count = usageHistoryMapper.countUsageHistory(req);

        List<UsageHistoryResponseDto> formattedList = list.stream()
                .map(this::toResponseDto)
                .toList();

        int totalPages = (int) Math.ceil((double) count / req.getLimit());

        return new PageDto<>(
                formattedList,
                count,
                req.getPage(),     // ✅ 여기에 totalPages 넣으면 안 됨
                req.getLimit()
        );
    }

    private UsageHistoryResponseDto toResponseDto(UsageHistoryDto dto) {
        LocalDateTime entry = dto.getEntryTime();
        LocalDateTime exit = dto.getExitTime();

        long minutes = Duration.between(entry, exit != null ? exit : LocalDateTime.now()).toMinutes();

        UsageHistoryResponseDto res = new UsageHistoryResponseDto();
        res.setDate(entry.format(DateTimeFormatter.ofPattern("MM/dd")));
        res.setDuration(String.format("%d시간 %d분", minutes / 60, minutes % 60));
        res.setStartTime(entry.format(DateTimeFormatter.ofPattern("HH:mm")));
        res.setEndTime(exit != null ? exit.format(DateTimeFormatter.ofPattern("HH:mm")) : "-");
        res.setCarNumber(dto.getCarNumber());
        res.setFee(dto.getFee());
        res.setStatus(exit == null ? "이용중" : "완료");

        return res;
    }
}
