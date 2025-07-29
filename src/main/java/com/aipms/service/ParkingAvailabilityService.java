package com.aipms.service;

import java.time.LocalDate;

public interface ParkingAvailabilityService {
    int getAvailableNormalSpots();

    boolean isReservableForPeriod(LocalDate startDate, LocalDate endDate);

    int getAvailableFixedSpots();
}
