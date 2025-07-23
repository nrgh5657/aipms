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
  initializeReservationPage();
});

// ========================================
// 예약 페이지 초기화
// ========================================
function initializeReservationPage() {
  setupDateInputs();              // 일일 날짜 설정
  setupMonthPicker();             // 월 주차 시작월
  loadUserCars();                 // 차량 번호 자동입력
  loadRealtimeZoneStatus();       // 주차장 현황
  addPriceCalculationListeners(); // 일일 계산
  addMonthlyPriceListeners();     // 월 요금 계산
  calculateDailyPrice();          // 기본 일일 요금 표시
  calculateMonthlyPrice();        // 기본 월 요금 표시
}

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
function calculateDailyPrice() {
  const start = new Date(document.getElementById('daily-start')?.value);
  const end = new Date(document.getElementById('daily-end')?.value);
  if (isNaN(start) || isNaN(end)) return;

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const total = days * 20000;

  document.getElementById('daily-days').textContent = `${days}일`;
  document.getElementById('daily-total').textContent = `₩${total.toLocaleString()}`;
}

function calculateMonthlyPrice() {
  const months = parseInt(document.getElementById('monthly-period')?.value || '0');
  const total = months * 150000;

  document.getElementById('monthly-months').textContent = `${months}개월`;
  document.getElementById('monthly-total').textContent = `₩${total.toLocaleString()}`;
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
  let userData = null;
  try {
    userData = JSON.parse(serverUserData);
  } catch {
    alert("⚠️ 로그인 정보를 불러올 수 없습니다.");
    return;
  }

  const memberId = userData?.memberId;
  const start = document.getElementById('daily-start')?.value;
  const end = document.getElementById('daily-end')?.value;
  const car = document.getElementById('daily-car')?.value;

  if (!memberId || !start || !end || !car) {
    alert('❗ 정보를 모두 입력하세요.');
    return;
  }

  const days = Math.ceil((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
  const totalAmount = days * 20000;

  const merchantUid = 'daily_' + new Date().getTime();

  IMP.request_pay({
    pg: "kakaopay", // 결제사
    pay_method: "card",
    merchant_uid: merchantUid,
    name: "일일 주차 예약",
    amount: totalAmount,
    buyer_email: userData.email,
    buyer_name: userData.user
  }, async function (rsp) {
    if (rsp.success) {
      const payload = {
        memberId,
        vehicleNumber: car,
        reservationStart: `${start}T00:00:00`,
        reservationEnd: `${end}T23:59:59`,
        status: "CONFIRMED",  // 결제 완료 시 확정
        fee: totalAmount,
        impUid: rsp.imp_uid,
        merchantUid: rsp.merchant_uid,
        paymentMethod: rsp.pay_method,         // ✅ 추가
        gateway: rsp.pg_provider,              // ✅ 필요 시 추가
      };

      const result = await apiPost('/api/reservations/apply', payload);
      if (result?.success) {
        alert("✅ 예약 및 결제 완료!");
      } else {
        alert("⚠️ 예약 저장 실패");
      }
    } else {
      alert("❌ 결제 실패 또는 취소됨");
    }
  });
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
