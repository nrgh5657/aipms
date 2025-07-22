package com.aipms.service;

import com.aipms.mapper.ParkingConfigMapper;
import com.aipms.mapper.ParkingLogMapper;
import com.aipms.mapper.ReservationMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ParkingAvailabilityServiceImpl implements ParkingAvailabilityService {

    private final ReservationMapper reservationMapper;
    private final ParkingLogMapper parkingLogMapper;
    private final ParkingConfigMapper parkingConfigMapper;

    @Override
    public int getAvailableNormalSpots() {
        int total = parkingConfigMapper.getConfig().getTotalSpaces();
        int fixed = parkingConfigMapper.getConfig().getFixedSubscriptionSpaces();

        int normalSpots = total - fixed;
        int activeReservations = reservationMapper.countPaidReservations();
        int activeParkingLogs = parkingLogMapper.countCurrentlyParkedCars(); // 출차 안 된 차량 수

        return normalSpots - activeReservations - activeParkingLogs;
    }
}
