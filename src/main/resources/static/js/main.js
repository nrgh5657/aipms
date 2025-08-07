IMP.init("imp84127058");

const button = document.querySelector("#payBtn");

const onClickPay = async () => {
    let guestToken = null;

    const isLoggedIn = window.currentUser != null;

    if (!isLoggedIn) {
        const res = await fetch("/api/guest/token", { method: "POST" });
        const json = await res.json();
        guestToken = json.guestToken;
        console.log("비회원 guestToken 발급됨:", guestToken);
    }

    const merchantUid = "ORD" + new Date().getTime();

    // 주문 저장
    await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            merchantUid: merchantUid,
            totalFee: finalFee
        })
    });

    // 결제 요청
    IMP.request_pay({
        pg: "tosspay",
        pay_method: "card",
        amount: finalFee,
        name: "주차 요금",
        merchant_uid: merchantUid,
    }, function (response) {
        const { success, imp_uid, error_msg, merchant_uid } = response;

        if (success) {
            console.log("✅ 결제 성공:", imp_uid);
            verifyPayment(imp_uid, merchant_uid, guestToken);
        } else {
            alert("❌ 결제 실패: " + error_msg);
        }
    });
};

button.addEventListener("click", onClickPay);

function verifyPayment(impUid, merchantUid, guestToken = null) {
    const id = Number(sessionStorage.getItem("id")); // ✅ 소문자 id로 수정

    if (!id) {
        alert("❌ id가 존재하지 않습니다.");
        console.error("id is null or invalid");
        return;
    }

    fetch("/api/payment/validate", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
            impUid: impUid,
            merchantUid: merchantUid,
            guestToken: guestToken,
            id: id // ✅ 필드명도 id로 일치
        })
    })
        .then(res => res.json())
        .then(data => {
            console.log("검증 응답:", data);
            if (data.data?.status === "paid") {
                alert("🎉 결제 검증 완료!");
                window.location.href = '/'; // ✅ 홈으로 이동
            } else {
                alert("❗ 결제 검증 실패");
            }
        })
        .catch(err => {
            console.error("검증 중 오류 발생", err);
        });
}
