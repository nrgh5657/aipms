document.addEventListener('DOMContentLoaded', () => {
    const IMP = window.IMP;
    if (!IMP) {
        console.error("❌ IMP 객체가 로드되지 않았습니다.");
        return;
    }
    IMP.init("imp18655565"); // ⚠️ 아임포트 가맹점 코드

    // 출차 처리 함수
    async function handleExit(carNumber) {
        try {
            const res = await fetch(`/api/parking-log/exit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ carNumber })
            });

            const data = await res.json();

            if (data.success) {
                alert(data.message);
                if (typeof refreshParkingTable === 'function') {
                    refreshParkingTable();
                }
            } else {
                if (data.paymentRequired) {
                    requestExtraPayment(data.extraFee, carNumber);
                } else {
                    alert(data.message);
                }
            }
        } catch (error) {
            console.error('🚨 출차 요청 중 오류:', error);
            alert('출차 요청 중 오류가 발생했습니다.');
        }
    }

    // 차액 결제 후 출차 처리
    function requestExtraPayment(amount, carNumber) {
        const merchantUid = `extra_${carNumber}_${Date.now()}`;

        IMP.request_pay({
            pg: "kakaopay",
            pay_method: "card",
            merchant_uid: merchantUid,
            name: "주차요금 차액 결제",
            amount: amount,
            buyer_email: serverUserData?.email || '',
            buyer_name: serverUserData?.user || '비회원',
            buyer_tel: serverUserData?.phone || ''
        }, async function (rsp) {
            if (rsp.success) {
                try {
                    const verifyRes = await fetch('/api/parking-log/confirm-exit', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            imp_uid: rsp.imp_uid,
                            merchant_uid: rsp.merchant_uid,
                            amount: amount,
                            carNumber: carNumber,
                            paymentType: "차액결제"
                        })
                    });

                    const verifyData = await verifyRes.json();

                    if (verifyData.success) {
                        alert("차액 결제 완료. 출차 처리됩니다.");
                    } else {
                        alert("결제 검증 실패: " + verifyData.message);
                    }
                } catch (error) {
                    console.error('결제 검증 중 오류:', error);
                    alert("결제 검증 중 오류가 발생했습니다.");
                }
            } else {
                alert("결제가 취소되었거나 실패했습니다.");
            }
        });
    }

    // ✅ 출차 버튼 이벤트 등록
    const exitBtn = document.getElementById('exitBtn');
    if (exitBtn) {
        exitBtn.addEventListener('click', () => {
            const carNumber = serverUserData?.carNumber;
            if (!carNumber) {
                alert("차량 번호 정보가 없습니다.");
                return;
            }
            handleExit(carNumber);
        });
    }

    // 전역으로도 사용 가능하게
    window.handleExit = handleExit;
});
