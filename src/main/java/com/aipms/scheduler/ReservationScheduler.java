package com.aipms.scheduler;

import com.aipms.service.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReservationScheduler {
    private final ReservationService reservationService;

    @Scheduled(cron = "0 5 0 * * *") // 매일 00:05
    public void autoCancelUnpaidReservations() {
        int cancelled = reservationService.cancelExpiredUnpaidReservations();
        log.info("⛔ 미결제 만료 예약 자동 취소됨: {}건", cancelled);
    }

}
