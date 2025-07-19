package com.aipms.mapper;

import com.aipms.domain.ParkingLog;
import com.aipms.dto.ParkingLogWithMemberDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface ParkingLogMapper {
    void insertLog(ParkingLog log);

    List<ParkingLogWithMemberDto> selectPagedLogs(@Param("limit") int limit, @Param("offset") int offset);

    int countAllLogs();

    ParkingLog findLatestUnexitedLog(String carNumber);

    void updateExitTime(ParkingLog existing);

    ParkingLog findLatestUnpaidByMemberId(Long memberId);

    void updatePaymentInfoOnly(@Param("entryId") Long entryId,
                                  @Param("paymentId") Long paymentId,
                                  @Param("isPaid") boolean isPaid,
                                  @Param("paidAt") LocalDateTime paidAt,
                                  @Param("paymentMethod") String paymentMethod,
                                  @Param("fee") int fee);

    Long selectPaymentIdByEntryId(Long entryId);

    ParkingLog selectById(Long entryId);

    void updatePaymentAndExitInfo(Map<String,? extends Serializable> entryId);
}
