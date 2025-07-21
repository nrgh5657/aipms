document.addEventListener('DOMContentLoaded', function () {
    const subscribeBtn = document.getElementById('subscribe-btn');
    if (subscribeBtn) {
        subscribeBtn.addEventListener('click', requestSubscriptionBillingKey);
    }
});

// ✅ 아임포트 초기화
IMP.init("imp18655565"); // 너의 가맹점 코드로 교체

async function requestSubscriptionBillingKey() {
    try {
        // 👉 로그인된 유저 정보 가져오기 (서버에서 세팅해줘야 함)
        const memberId = serverUserData?.memberId;
        const email = serverUserData?.email || "test@example.com";
        const name = serverUserData?.user || "홍길동";
        const phone = serverUserData?.phone || "01012345678";

        if (!memberId) {
            showToast("로그인이 필요합니다.", "error");
            return;
        }

        const customerUid = `user_${memberId}`;
        const merchantUid = `subscribe_${Date.now()}`;

        // ✅ IMP.request_pay 호출로 빌링키 발급
        IMP.request_pay({
            channelKey:"channel-key-a1e4672f-4755-4957-80c6-152515cb79ab",
            pay_method: "card",
            merchant_uid: merchantUid,
            customer_uid: customerUid,
            name: "스마트파킹 1개월 정기권 등록",
            amount: 150000,
            buyer_email: email,
            buyer_name: name,
            buyer_tel: phone
        }, async function (rsp) {
            console.log(rsp);
            if (rsp.success) {

                // ✅ 서버에 customer_uid 등록 요청
                const res = await fetch("/api/subscriptions/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        memberId,
                        customerUid,
                        merchantUid: rsp.merchant_uid,
                        impUid: rsp.imp_uid,
                        amount: rsp.paid_amount,
                        paymentMethod: rsp.pay_method || "card",
                        gateway: rsp.pg_provider || "kakaopay",
                        paymentType: "정기권",
                        carNumber: serverUserData?.carNumber || null
                    })
                });

                const result = await res.json();
                if (result.success) {
                    showToast("정기권이 등록되었습니다.");
                } else {
                    showToast("서버 저장 실패: " + result.message, "error");
                }
            } else {
                showToast("결제 실패: " + rsp.error_msg, "error");
            }
        });
    } catch (error) {
        console.error("❌ 오류 발생", error);
        showToast("정기권 등록 중 오류가 발생했습니다.", "error");
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const autoPayBtn = document.getElementById('trigger-auto-pay-btn');

    if (autoPayBtn) {
        autoPayBtn.addEventListener('click', () => {
            const customerUid = serverUserData?.customerUid || `user_${serverUserData?.memberId}`;
            if (!customerUid) {
                showToast("정기권 등록이 필요합니다.", "error");
                return;
            }

            requestRecurringPayment(customerUid);
        });
    }
});

// 💳 정기결제 실행
async function requestRecurringPayment(customerUid, amount = 150000) {
    try {
        const merchantUid = `auto_${Date.now()}`; // 매번 고유 UID

        IMP.request_pay({
            channelKey:"channel-key-a1e4672f-4755-4957-80c6-152515cb79ab",
            pay_method: "card",
            customer_uid: customerUid, // 저장된 빌링키 사용
            merchant_uid: merchantUid,
            name: "스마트파킹 정기권 자동결제",
            amount: amount
        }, async function (rsp) {
            console.log(rsp);
            if (rsp.success) {
                showToast("정기결제 성공");

                // ✅ 서버에 결제 내역 저장
                const res = await fetch("/api/payment/record", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        memberId: serverUserData?.memberId,
                        customerUid: customerUid,
                        merchantUid: rsp.merchant_uid,
                        impUid: rsp.imp_uid,
                        amount: rsp.paid_amount,
                        paymentType: "정기권",
                        carNumber: serverUserData?.carNumber || null
                    })
                });

                const result = await res.json();
                if (!result.success) {
                    showToast("서버 저장 실패: " + result.message, "error");
                }
            } else {
                showToast("정기결제 실패: " + rsp.error_msg, "error");
            }
        });
    } catch (error) {
        console.error("❌ 정기결제 오류", error);
        showToast("정기결제 중 오류가 발생했습니다.", "error");
    }
}



