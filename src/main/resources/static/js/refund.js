let selectedReservationId = null;

// 모달 엘리먼트
const modal = document.getElementById("refundModal");
const reasonInput = document.getElementById("refundReasonInput");

// 예약 취소 버튼 (동적 바인딩 대응 - 이벤트 위임 방식)
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('cancel-btn')) {
        selectedReservationId = e.target.dataset.reservationId;
        reasonInput.value = "";
        modal.classList.remove("hidden");
    }
});

// 모달 내 취소
document.getElementById("cancelRefundBtn").addEventListener("click", () => {
    modal.classList.add("hidden");
});

// 모달 내 환불 확인
document.getElementById("confirmRefundBtn").addEventListener("click", async () => {
    const reason = reasonInput.value.trim();

    if (!reason) {
        alert("취소 사유를 입력해주세요.");
        return;
    }

    // ✅ 확인 다이얼로그 추가
    const isSure = confirm("정말 환불하시겠습니까?");
    if (!isSure) return;

    try {
        const res = await fetch('/api/reservations/refund', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                reservationId: Number(selectedReservationId),
                reason
            })
        });

        const result = await res.json();

        if (result.success) {
            alert("✅ 환불 요청 완료");
            location.reload();
        } else {
            alert("❌ 환불 실패: " + result.message);
        }

    } catch (err) {
        console.error(err);
        alert("서버 오류가 발생했습니다.");
    }

    modal.classList.add("hidden");
});
