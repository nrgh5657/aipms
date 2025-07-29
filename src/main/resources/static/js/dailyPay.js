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

    document.getElementById('reservationPayBtn').addEventListener('click', openReservationModal);
});



async function openReservationModal() {
    const modal = document.getElementById('reservationModal');
    modal.style.display = 'flex';

    try {
        const res = await fetch('/api/reservations/unpaid/daily', { credentials: 'include' });
        const reservations = await res.json();

        const listContainer = document.getElementById('reservationList');
        listContainer.innerHTML = '';

        if (!reservations.length) {
            listContainer.innerHTML = '<p>미결제 예약이 없습니다.</p>';
            return;
        }

        reservations.forEach(r => {
            const start = new Date(r.reservationStart).toLocaleDateString();
            const end = new Date(r.reservationEnd).toLocaleDateString();

            const item = document.createElement('div');
            item.className = 'reservation-item';
            item.innerHTML = `
        <div>
          <p><strong>${start} ~ ${end}</strong><br>
          차량번호: ${r.vehicleNumber}<br>
          요금: ₩${r.fee}</p>
        </div>
        <button onclick="payForReservation(${r.reservationId})">예약 결제</button>
      `;
            listContainer.appendChild(item);
        });
    } catch (e) {
        console.error('❌ 예약 불러오기 실패:', e);
    }
}

function closeReservationModal() {
    document.getElementById('reservationModal').style.display = 'none';
}



async function payForReservation(reservationId) {
    const reservation = await apiRequest(`/api/reservations/pay/${reservationId}`);
    if (!reservation || reservation.status !== 'UNPAID') {
        alert("❌ 유효하지 않은 예약입니다.");
        return;
    }

    const fee = reservation.fee;
    const merchantUid = 'reservation_' + Date.now();

    IMP.request_pay({
        pg: "kakaopay",  // 또는 "kakaopay"
        pay_method: "card",
        merchant_uid: merchantUid,
        name: "일일 주차 예약",
        amount: fee,
        buyer_email: serverUserData.email,
        buyer_name: serverUserData.user,
        buyer_tel: serverUserData.phone
    }, async function (rsp) {
        if (rsp.success) {
            try {
                const res = await fetch('/api/payment/reservation/daily', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        reservationId: reservationId,
                        impUid: rsp.imp_uid,
                        merchantUid: rsp.merchant_uid,
                        memberId: serverUserData.memberId
                    })
                });

                const data = await res.json();
                if (data.status?.includes("결제 완료")) {
                    alert("✅ 예약 결제가 완료되었습니다!");
                    window.location.href = '/my/records';
                } else {
                    alert(`⚠️ 결제 처리 실패: ${data.status}`);
                }
            } catch (err) {
                console.error("🚨 서버 처리 오류:", err);
                alert("⚠️ 서버 처리 중 오류 발생");
            }
        } else {
            alert("❌ 결제 실패: " + rsp.error_msg);
        }
    });
}