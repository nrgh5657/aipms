package com.aipms.mapper;

import com.aipms.domain.ParkingLog;
import com.aipms.dto.ParkingLogWithMemberDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ParkingLogMapper {
    void insertLog(ParkingLog log);

    List<ParkingLogWithMemberDto> selectPagedLogs(@Param("limit") int limit, @Param("offset") int offset);

    int countAllLogs();

    ParkingLog findLatestUnexitedLog(String carNumber);

    void updateExitTime(ParkingLog existing);

    ParkingLog findLatestUnpaidByMemberId(Long memberId);

    void updatePaymentAndExitInfo(@Param("entryId") Long entryId,
                                  @Param("paymentId") Long paymentId,
                                  @Param("exitTime") LocalDateTime exitTime,
                                  @Param("isPaid") boolean isPaid,
                                  @Param("paidAt") LocalDateTime paidAt,
                                  @Param("paymentMethod") String paymentMethod,
                                  @Param("fee") int fee);

    Long selectPaymentIdByEntryId(Long entryId);

    ParkingLog selectById(Long entryId);
}
