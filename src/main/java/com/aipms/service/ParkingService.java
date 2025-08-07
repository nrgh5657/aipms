package com.aipms.service;

import com.aipms.dto.LiveParkingStatusDto;
import com.aipms.dto.ParkingDto;

import java.util.List;


public interface ParkingService {
    void register(ParkingDto dto);
    ParkingDto get(Long id);
    List<ParkingDto> getAll();
    void update(ParkingDto dto);
    void delete(Long id);
    LiveParkingStatusDto getLiveParkingStatus();
}
