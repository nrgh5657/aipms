package com.aipms.mapper;

import com.aipms.domain.Reservation;
import com.aipms.dto.ReservationDto;
import com.aipms.dto.ReservationHistoryDto;
import com.aipms.dto.ReservationHistoryRequestDto;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface ReservationMapper {
    void insertReservation(Reservation reservation);
    List<Reservation> findByMemberId(Long memberId);

    void updateStatus(Long reservationId, String status);
    List<Reservation> findAll();

    int countPaidReservations();

    ReservationDto findUpcomingReservation(Long memberId, LocalDateTime now);

    int countActiveSubscriptions();

    // 예약 ID + 회원 ID로 예약 정보 조회
    Reservation findByIdAndMemberId(@Param("reservationId") Long reservationId,
                                    @Param("memberId") Long memberId);

    // 예약 상태를 취소로 업데이트
    int cancelReservation(@Param("reservationId") Long reservationId,
                          @Param("cancelReason") String reason,
                          @Param("refundAmount") int refundAmount);

    List<ReservationHistoryDto> getPagedReservationHistory(ReservationHistoryRequestDto dto);
    int countReservationHistory(ReservationHistoryRequestDto dto);

    int existsTodayReservation(Long memberId, LocalDate date);

    int countOverlappingReservation(Long memberId, LocalDateTime start, LocalDateTime end);
}
