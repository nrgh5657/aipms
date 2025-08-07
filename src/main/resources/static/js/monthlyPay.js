document.addEventListener('DOMContentLoaded', () => {
    if (window.IMP) {
        IMP.init("imp18655565"); // ✅ 아임포트 가맹점 코드
    } else {
        console.error("❌ IMP 객체가 없습니다.");
    }

    // ✅ 정기권 결제 버튼 연결
    const subscribeBtn = document.getElementById('subscribe-btn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', openMonthlyReservationModal);
    }
});

async function openMonthlyReservationModal() {
    const modal = document.getElementById('reservationModal');
    modal.style.display = 'flex';

    try {
        const res = await fetch('/api/reservations/unpaid/monthly', { credentials: 'include' });
        const reservations = await res.json();

        const listContainer = document.getElementById('reservationList');
        listContainer.innerHTML = '';

        if (!reservations.length) {
            listContainer.innerHTML = '<p>미결제 월주차 예약이 없습니다.</p>';
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
                  요금: ₩${r.fee.toLocaleString()}</p>
                </div>
                <button onclick="payForMonthlyReservation(${r.reservationId})">결제</button>
            `;
            listContainer.appendChild(item);
        });
    } catch (e) {
        console.error('❌ 월주차 예약 불러오기 실패:', e);
        document.getElementById('reservationList').innerHTML = '<p>불러오기 실패</p>';
    }
}

function closeMonthlyReservationModal() {
    document.getElementById('monthlyReservationModal').style.display = 'none';
}

async function payForMonthlyReservation(reservationId) {
    const reservation = await apiRequest(`/api/reservations/pay/${reservationId}`);
    if (!reservation || reservation.status !== 'UNPAID') {
        alert("❌ 유효하지 않은 예약입니다.");
        return;
    }

    const fee = reservation.fee;
    const merchantUid = 'monthly_' + Date.now();

    IMP.request_pay({
        pg: "kakaopay",
        pay_method: "card",
        merchant_uid: merchantUid,
        name: "월주차 정기권 결제",
        amount: fee,
        buyer_email: serverUserData.email,
        buyer_name: serverUserData.user,
        buyer_tel: serverUserData.phone
    }, async function (rsp) {
        if (rsp.success) {
            try {
                const res = await fetch('/api/payment/reservation/monthly', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        reservationId: reservationId,
                        impUid: rsp.imp_uid,
                        merchantUid: rsp.merchant_uid,
                        memberId: serverUserData.memberId,
                        paymentMethod: rsp.pay_method,
                        gateway: rsp.pg_provider,
                        amount: rsp.paid_amount
                    })
                });

                const data = await res.json();
                if (data.success) {
                    alert("✅ 월주차 결제가 완료되었습니다!");
                    window.location.href = '/my-records';
                } else {
                    alert(`⚠️ 결제 처리 실패: ${data.message}`);
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
