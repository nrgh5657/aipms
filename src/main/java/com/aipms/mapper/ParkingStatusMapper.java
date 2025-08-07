package com.aipms.mapper;

import com.aipms.dto.ParkingStatusResponseDto;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ParkingStatusMapper {

    ParkingStatusResponseDto.CurrentStatus getCurrentStatus(Long memberId);

    ParkingStatusResponseDto.ReservationStatus getReservationStatus(Long memberId);

    List<ParkingStatusResponseDto.ParkingHistory> getParkingHistory(Long memberId);
}
