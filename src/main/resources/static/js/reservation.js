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
  const data = await apiRequest('/api/parking/realtime-status');
  if (!data?.zones) return;

  const container = document.querySelector('.status-grid');
  container.innerHTML = '';

  data.zones.forEach(zone => {
    const { zoneCode, used, total, usageRate } = zone;
    const statusClass = usageRate > 80 ? 'high' : usageRate > 50 ? 'medium' : 'low';

    container.innerHTML += `
      <div class="zone-status">
        <h4>${zoneCode}구역</h4>
        <div class="availability">
          <span class="available">${total - used}</span>/<span class="total">${total}</span>
        </div>
        <div class="zone-rate">
          가용률: ${usageRate}%
          <div class="rate-progress">
            <div class="progress-fill ${statusClass}" style="width: ${usageRate}%; height: 8px; background: ${
        statusClass === 'high' ? 'red' : statusClass === 'medium' ? 'orange' : 'green'
    }"></div>
          </div>
        </div>
      </div>
    `;
  });
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
  const res = await apiPost('/api/reservations/apply', {
    vehicleNumber: car,
    reservationStart: `${start}T00:00:00`,
    reservationEnd: `${end}T23:59:59`
  });

  if (res?.success) {
    alert("✅ 예약 완료! 결제를 진행해주세요.");
    window.location.href = '/payment'; // 💡 결제 페이지로 이동
  } else {
    alert("❌ 예약에 실패했습니다.");
  }
}

// ========================================
// 예약 제출 - 월 주차
// ========================================
async function submitMonthlyReservation(event) {
  event.preventDefault();
  let userData = null;
  try {
    userData = JSON.parse(serverUserData);
  } catch {
    alert("⚠️ 로그인 정보를 불러올 수 없습니다.");
    return;
  }

  const memberId = userData?.memberId;
  const startMonth = document.getElementById('monthly-start')?.value;
  const period = parseInt(document.getElementById('monthly-period')?.value);
  const car = document.getElementById('monthly-car')?.value;

  if (!memberId || !startMonth || !period || !car) {
    alert('❗ 정보를 모두 입력하세요.');
    return;
  }

  const startDate = `${startMonth}-01T00:00:00`;
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + period);
  const endStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-01T00:00:00`;

  const payload = {
    memberId,
    vehicleNumber: car,
    reservationStart: startDate,
    reservationEnd: endStr,
    status: "WAITING"
  };

  const response = await apiPost('/api/reservations/apply', payload);
  if (response?.success) {
    alert("✅ 월 주차 신청 완료!");
  } else {
    alert("❌ 예약 실패: " + (response?.message || "서버 오류"));
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
