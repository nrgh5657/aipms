package com.aipms.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
public class ParkingStatusResponseDto {

    private CurrentStatus currentStatus;
    private ReservationStatus reservationStatus;
    private List<ParkingHistory> history;

    @Getter
    @Setter
    public static class CurrentStatus {
        private String slotName;
        private LocalDateTime entryTime;
        private int elapsedTime;
        private int estimatedFee;
    }

    @Getter
    @Setter
    public static class ReservationStatus {
        private String vehicleNumber;
        private LocalDateTime reservationStart;
        private LocalDateTime reservationEnd;
        private String status;
    }

    @Getter
    @Setter
    public static class ParkingHistory {
        private LocalDate date;
        private String slotName;
        private LocalTime startTime;
        private LocalTime endTime;
        private String duration;
        private int fee;
        private String status;
    }
}
