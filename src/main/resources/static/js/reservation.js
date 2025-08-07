// ========================================
// 예약 페이지 초기화
// ========================================
async function initializeReservationPage() {
  setupDateInputs();
  setupMonthPicker();
  loadUserCars();
  loadRealtimeZoneStatus();

  await loadFeePolicies();        // ✅ 정책 로딩 완료 후 계산

  addPriceCalculationListeners();
  addMonthlyPriceListeners();

  calculateDailyPrice();          // ✅ 정책 요금으로 계산
  calculateMonthlyPrice();
}

document.addEventListener('DOMContentLoaded', async () => {
  await initializeReservationPage();  // ✅ async 보장
});

// ========================================
// 탭 전환
// ========================================
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.reservation-form').forEach(form => form.classList.remove('active'));

  document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`)?.classList.add('active');
  document.getElementById(`${tabName}-form`)?.classList.add('active');
}

// ========================================
// 일일 날짜 입력 필드 설정
// ========================================
function setupDateInputs() {
  const today = new Date().toISOString().split('T')[0];
  const start = document.getElementById('daily-start');
  const end = document.getElementById('daily-end');
  if (!start || !end) return;

  start.value = today;
  end.value = today;
  start.min = today;
  end.min = today;

  start.addEventListener('change', calculateDailyPrice);
  end.addEventListener('change', calculateDailyPrice);
}

// ========================================
// 월 주차 시작 월 설정
// ========================================
function setupMonthPicker() {
  const now = new Date();
  const monthInput = document.getElementById('monthly-start');
  if (!monthInput) return;

  const thisMonth = now.toISOString().slice(0, 7);
  monthInput.value = thisMonth;
  monthInput.min = thisMonth;
}

// ========================================
// 차량 정보 자동입력 (비동기 통신)
// ========================================
async function loadUserCars() {
  const cars = await apiRequest('/api/user/cars');
  if (cars?.length > 0) {
    const firstCar = cars[0].carNumber;
    document.getElementById('daily-car').value = firstCar;
    document.getElementById('monthly-car').value = firstCar;
  } else {
    console.warn('🚫 등록된 차량 없음');
  }
}

// ========================================
// 실시간 구역 현황 로딩
// ========================================
async function loadRealtimeZoneStatus() {
  const data = await apiRequest('/api/parking/live-status');
  if (!data) return;

  const { totalSlots, occupiedSlots, availableSlots, occupancyRate, subscriptionSlots } = data;
  const statusClass = occupancyRate > 80 ? 'high' : occupancyRate > 50 ? 'medium' : 'low';

  const container = document.querySelector('.status-grid');
  container.innerHTML = `
    <div class="zone-status">
      <h4>천호 주차장</h4>
      <div class="availability">
        <span class="available">${occupiedSlots}</span>/
        <span class="total">${totalSlots-subscriptionSlots}</span>
      </div>
      <div class="zone-rate">
        가용률: ${occupancyRate}%
        <div class="rate-progress">
          <div class="progress-fill ${statusClass}" style="width: ${occupancyRate}%; height: 8px; background: ${
      statusClass === 'high' ? 'red' : statusClass === 'medium' ? 'orange' : 'green'
  }"></div>
        </div>
      </div>
      <div class="subscription-info">
        정기권 구역: ${subscriptionSlots}
      </div>
    </div>
  `;
}


// ========================================
// 요금 계산
// ========================================

let feePolicies = {
  DAILY: 20000,
  MONTHLY: 150000,
  // TIME: 1200 등도 필요시
};

async function loadFeePolicies() {
  try {
    const res = await fetch('/admin/policy/fee/all', {
      credentials: 'include'
    });
    const json = await res.json();

    console.log('📦 전체 응답:', json); // 이제는 배열임

    (json || []).forEach(policy => {
      console.log('🔍 개별 정책:', policy);

      const type = policy.policyType || policy.policy_type;
      const baseFee = policy.baseFee || policy.base_fee;

      if (type && !isNaN(baseFee)) {
        feePolicies[type] = baseFee;
      }
    });

    console.log('📌 최종 정책 요금:', feePolicies);
  } catch (e) {
    console.error('❌ 요금 정책 불러오기 실패:', e);
  }
}


function calculateDailyPrice() {
  const start = new Date(document.getElementById('daily-start')?.value);
  const end = new Date(document.getElementById('daily-end')?.value);
  if (isNaN(start) || isNaN(end)) return;

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const unitPrice = feePolicies.DAILY || 20000; // 백업값 설정

  const total = days * unitPrice;

  document.getElementById('daily-days').textContent = `${days}일`;
  document.getElementById('daily-total').textContent = `₩${total.toLocaleString()}`;

  const unitPriceElement = document.getElementById('daily-unit-price');
  if (unitPriceElement) {
    unitPriceElement.textContent = `₩${unitPrice.toLocaleString()}`;
  }
}

function calculateMonthlyPrice() {
  const months = parseInt(document.getElementById('monthly-period')?.value || '0');
  const unitPrice = feePolicies.MONTHLY || 150000;

  const total = months * unitPrice;

  document.getElementById('monthly-months').textContent = `${months}개월`;
  document.getElementById('monthly-total').textContent = `₩${total.toLocaleString()}`;

  const unitPriceElement = document.getElementById('monthly-unit-price');
  if (unitPriceElement) {
    unitPriceElement.textContent = `₩${unitPrice.toLocaleString()}`;
  }
}

// ========================================
// 이벤트 리스너
// ========================================
function addPriceCalculationListeners() {
  document.getElementById('daily-start')?.addEventListener('change', calculateDailyPrice);
  document.getElementById('daily-end')?.addEventListener('change', calculateDailyPrice);
}

function addMonthlyPriceListeners() {
  document.getElementById('monthly-period')?.addEventListener('change', calculateMonthlyPrice);
}

// ========================================
// 예약 제출 - 일일
// ========================================
async function submitDailyReservation(event) {
  event.preventDefault();

  // 로그인 정보 및 값 확인
  const car = document.getElementById('daily-car')?.value;
  const start = document.getElementById('daily-start')?.value;
  const end = document.getElementById('daily-end')?.value;

  if (!car || !start || !end) {
    alert("❗ 모든 정보를 입력해주세요.");
    return;
  }

  // ✅ 오늘보다 이전 또는 당일은 예약 불가
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = new Date(start);
  if (startDate <= today) {
    alert("❗ 예약은 최소 하루 전부터 가능합니다.");
    return;
  }

  // ✅ 결제 마감 안내 팝업
  const confirmMsg =
      "🚨 예약 안내\n\n" +
      "해당 예약은 오늘 자정까지 결제를 완료해야 합니다.\n" +
      "결제하지 않으면 예약은 자동으로 취소됩니다.\n\n" +
      "계속 진행하시겠습니까?";

  const confirmed = confirm(confirmMsg);
  if (!confirmed) return;

  // 예약 POST
  const res = await apiPost('/api/reservations/daily', {
    vehicleNumber: car,
    reservationStart: `${start}T00:00:00`,
    reservationEnd: `${end}T23:59:59`
  });

  if (res?.success) {
    alert("✅ 예약 완료! 결제를 진행해주세요.");
    window.location.href = '/payment'; // 💡 결제 페이지로 이동
  } else {
    const reasonMap = {
      "DUPLICATE_RESERVATION": "❌ 이미 해당 날짜에 예약이 존재합니다.",
      "NO_AVAILABLE_SPOTS": "🚫 선택한 날짜에는 이용 가능한 주차 공간이 없습니다.",
      "DATE_PASSED": "❌ 과거 또는 당일 날짜로는 예약할 수 없습니다.",
      "NO_POLICY": "⚠️ 요금 정책이 설정되어 있지 않습니다.",
      "INVALID_DATE_RANGE": "❌ 시작일은 종료일보다 앞서야 합니다."
    };

    let message = reasonMap[res?.reason] || "❌ 예약에 실패했습니다.";

    // ✅ 날짜 부족 정보가 있다면 메시지에 추가
    if (res?.reason === "NO_AVAILABLE_SPOTS" && Array.isArray(res.insufficientDates)) {
      const dates = res.insufficientDates.join(', ');
      message += `\n\n부족한 날짜: ${dates}`;
    }

    alert(message);
  }
}

// ========================================
// 예약 제출 - 월 주차
// ========================================
async function submitMonthlyReservation(event) {
  event.preventDefault();

  // ✅ 입력값 수집
  const car = document.getElementById('monthly-car')?.value;
  const startMonth = document.getElementById('monthly-start')?.value; // "yyyy-MM"
  const period = parseInt(document.getElementById('monthly-period')?.value);

  if (!car || !startMonth || !period) {
    alert("❗ 모든 정보를 입력해주세요.");
    return;
  }

  // ✅ 전송용 시작일 문자열
  const startDateStr = `${startMonth}-01T00:00:00`;

  // ✅ 비교용 Date 객체 생성
  const startDate = new Date(startDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expectedMonth = today.getMonth() + 1; // 0-index +1
  const expectedYear = today.getFullYear();

  const actualMonth = startDate.getMonth(); // 0-index
  const actualYear = startDate.getFullYear();

  // ✅ 다음 달 예약인지 확인
  if (actualYear !== expectedYear || actualMonth !== expectedMonth) {
    alert("❌ 월주차는 다음 달만 예약할 수 있습니다.");
    return;
  }

  // ✅ 종료일 계산 (N개월 후 말일)
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + period);
  endDate.setDate(0); // 0일 = 이전 달의 말일

  // ✅ 날짜 포맷 함수
  const format = (date) => date.toISOString().split("T")[0] + "T00:00:00";

  const payload = {
    vehicleNumber: car,
    reservationStart: startDateStr,        // 문자열 그대로 전송
    reservationEnd: format(endDate),
    type: "MONTHLY"
  };

// ✅ 안내 메시지
  const confirmMsg =
      "📅 월주차 예약 안내\n\n" +
      `${startMonth}부터 ${period}개월 간 예약됩니다.\n` +
      "정기권 공간이 부족할 경우 예약이 제한될 수 있습니다.\n" +
      "당일 자정까지 결제하지 않으면 예약은 자동 취소됩니다.\n\n" +
      "계속 진행하시겠습니까?";

  if (!confirm(confirmMsg)) return;

  // ✅ 서버 요청
  const res = await apiPost('/api/reservations/monthly', payload);

  if (res?.success) {
    alert("✅ 예약 완료! 결제를 진행해주세요.");
    window.location.href = '/payment';
  } else {
    const reasonMap = {
      "DUPLICATE_RESERVATION": "❌ 이미 해당 월에 예약이 존재합니다.",
      "NO_AVAILABLE_SPOTS": "🚫 정기권 공간이 부족합니다.",
      "OUT_OF_PERIOD": "❌ 현재는 해당 월 예약이 불가능합니다.",
      "NO_POLICY": "⚠️ 월주차 요금 정책이 설정되어 있지 않습니다.",
    };
    const message = reasonMap[res?.reason] || "❌ 예약에 실패했습니다.";
    alert(message);
  }
}




// ========================================
// API 유틸
// ========================================
async function apiRequest(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('요청 실패');
    return await res.json();
  } catch (e) {
    console.error('GET 요청 실패:', e);
    return null;
  }
}

async function apiPost(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await res.json();
  } catch (e) {
    console.error('POST 요청 실패:', e);
    return null;
  }
}
