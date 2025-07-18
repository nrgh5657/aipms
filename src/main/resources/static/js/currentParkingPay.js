document.addEventListener('DOMContentLoaded', () => {
    const IMP = window.IMP;

    if (!IMP) {
        console.error("❌ IMP 객체가 아직 로드되지 않았습니다.");
        return;
    }

    IMP.init('imp18655565'); // 테스트 가맹점 코드

    const payBtn = document.querySelector('.service-btn[data-action="current-parking"]');
    if (payBtn) {
        payBtn.addEventListener('click', async () => {
            const entryInfo = await fetchCurrentEntryInfo(); // ✅ 동적 조회 구현
            if (!entryInfo) return alert("결제 대상 주차 정보가 없습니다.");

            const { entryId, amount } = entryInfo;
            payCurrentParking(entryId, amount, IMP); // IMP를 넘겨줌
        });
    }

    async function payCurrentParking(entryId, amount, IMP) {
        if (!serverUserData || !serverUserData.user) {
            alert("로그인 정보가 없습니다.");
            return;
        }

        const buyer = {
            name: serverUserData.user,
            email: serverUserData.email,
            phone: serverUserData.phone
        };

        IMP.request_pay({
            pg: 'kakaopay',
            pay_method: 'card',
            merchant_uid: 'order_' + Date.now(),
            name: '현재 주차 요금 결제',
            amount: amount,
            buyer_name: buyer.name,
            buyer_email: buyer.email,
            buyer_tel: buyer.phone,
        }, async function (rsp) {
            if (rsp.success) {
                try {
                    const res = await fetch('/api/payment/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            impUid: rsp.imp_uid,
                            merchantUid: rsp.merchant_uid,
                            entryId: entryId
                        })
                    });
                    const data = await res.json();
                    if (data.status === '결제 완료') {
                        alert('✅ 결제 성공!');
                    } else {
                        alert('⚠️ 결제는 되었지만 상태 저장 실패');
                    }
                } catch (err) {
                    console.error('🚨 서버 검증 중 오류:', err);
                    alert('⚠️ 서버와 통신 중 오류가 발생했습니다.');
                }
            } else {
                alert('❌ 결제 실패: ' + rsp.error_msg);
            }
        });
    }

    async function fetchCurrentEntryInfo() {
        try {
            const res = await fetch('/api/parking-log/current', {
                method: 'GET',
                credentials: 'include',
            });

            if (!res.ok) throw new Error("서버 응답 실패");

            const data = await res.json();
            if (!data.entryId) return null;

            return {
                entryId: data.entryId,
                amount: data.amount
            };
        } catch (err) {
            console.error("🚨 주차 정보 조회 실패:", err);
            return null;
        }
    }
});
