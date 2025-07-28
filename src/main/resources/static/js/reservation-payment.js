// ========================================
// 예약 시스템 초기화
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    if (window.IMP) {
        IMP.init("imp18655565"); // ✅ 너의 아임포트 가맹점 코드로 교체
    } else {
        console.error("❌ IMP 객체를 찾을 수 없습니다.");
    }
    initializeCommon();
});



async function payForReservation(reservationId) {
    // ✅ 서버에서 예약 정보 불러오기
    const reservation = await apiRequest(`/api/reservations/${reservationId}`);
    if (!reservation || reservation.status !== 'UNPAID') {
        alert("❌ 유효하지 않은 예약입니다.");
        return;
    }

    const fee = reservation.fee;
    const merchantUid = 'daily_' + new Date().getTime();

    IMP.request_pay({
        pg: "kakaopay",
        pay_method: "card",
        merchant_uid: merchantUid,
        name: "일일 주차 예약",
        amount: fee,
        buyer_email: userData.email,
        buyer_name: userData.user
    }, async function (rsp) {
        if (rsp.success) {
            const paymentPayload = {
                reservationId,
                memberId: userData.memberId,
                impUid: rsp.imp_uid,
                merchantUid: rsp.merchant_uid,
                paymentMethod: rsp.pay_method,
                gateway: rsp.pg_provider
            };

            const paymentRes = await apiPost('/api/payment/reservation', paymentPayload);
            if (paymentRes?.success) {
                alert("✅ 결제 완료!");
                loadUnpaidReservations(); // 갱신
            } else {
                alert("⚠️ 결제는 성공했지만 서버 저장 실패");
            }
        } else {
            alert("❌ 결제 실패 또는 취소됨");
        }
    });
}