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
            channelKey:"channel-key-496491cb-0c2a-44f2-9156-12b62459e1f9",
            pay_method: "card",
            merchant_uid: merchantUid,
            customer_uid: customerUid,
            name: "스마트파킹 1개월 정기권 등록",
            amount: 150000, // 💡 0원 결제로 빌링키만 발급
            buyer_email: email,
            buyer_name: name,
            buyer_tel: phone
        }, async function (rsp) {
            if (rsp.success) {
                // ✅ 서버에 customer_uid 등록 요청
                const res = await fetch("/api/subscriptions/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        memberId,
                        customerUid,
                        merchantUid
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
