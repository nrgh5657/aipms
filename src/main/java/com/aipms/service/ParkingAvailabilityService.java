package com.aipms.service;

import java.time.LocalDate;
import java.util.List;

public interface ParkingAvailabilityService {
    int getAvailableNormalSpots();

    boolean isReservableForPeriod(LocalDate startDate, LocalDate endDate, List<LocalDate> insufficientDates);

    int getAvailableFixedSpots();
}
