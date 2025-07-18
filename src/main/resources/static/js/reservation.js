// ========================================
// 예약 시스템 초기화
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  initializeCommon()
  initializeReservationPage();
});

function initializeReservationPage() {
  setupDateInputs();              // 일일 주차 날짜 필드
  setupMonthPicker();             // 월 주차 시작월
  loadUserCars();                 // 차량 정보
  loadRealtimeZoneStatus();       // 실시간 주차장 정보
  addPriceCalculationListeners(); // 일일 계산 리스너
  addMonthlyPriceListeners();     // 월 요금 계산 리스너
  calculateDailyPrice();          // 초기 일일 요금
  calculateMonthlyPrice();        // 초기 월 요금

  // 탭 전환 버튼
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.textContent.includes('월') ? 'monthly' : 'daily');
    });
  });

  // 예약 버튼
  document.getElementById('daily-submit-btn')?.addEventListener('click', submitDailyReservation);
  document.getElementById('monthly-submit-btn')?.addEventListener('click', submitMonthlyReservation);
}

// ========================================
// 탭 전환
// ========================================
function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const clicked = Array.from(document.querySelectorAll('.tab-btn'))
      .find(btn => btn.getAttribute('onclick')?.includes(`switchTab('${tabName}')`));
  if (clicked) clicked.classList.add('active');

  const forms = ['daily', 'monthly'];
  forms.forEach(type => {
    const section = document.getElementById(`${type}-form`);
    if (section) section.style.display = (type === tabName) ? 'block' : 'none';
  });
}

// ========================================
// 일일 날짜 선택
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
// 월 주차 시작 월
// ========================================
function setupMonthPicker() {
  const now = new Date();
  const monthInput = document.getElementById('monthly-start');
  if (!monthInput) return;
  monthInput.value = now.toISOString().slice(0, 7);
  monthInput.min = now.toISOString().slice(0, 7);
}

// ========================================
// 차량 목록 불러오기
// ========================================
async function loadUserCars() {
  const data = await apiRequest('/api/user/cars');
  if (!data?.cars) return;

  const dailyCar = document.getElementById('daily-car');
  const monthlyCar = document.getElementById('monthly-car');
  if (dailyCar) dailyCar.value = data.cars[0]?.carNumber || '';
  if (monthlyCar) monthlyCar.value = data.cars[0]?.carNumber || '';
}

// ========================================
// 실시간 구역 상태
// ========================================
async function loadRealtimeZoneStatus() {
  const data = await apiRequest('/api/parking/realtime-status');
  if (!data?.zones) return;

  const container = document.getElementById('zone-status-container');
  if (!container) return;
  container.innerHTML = '';

  data.zones.forEach(zone => {
    const rate = zone.usageRate;
    const status = rate > 80 ? 'high' : rate > 50 ? 'medium' : 'low';

    container.innerHTML += `
      <div class="zone-card">
        <div class="zone-header"><strong>${zone.zoneCode}</strong>구역</div>
        <div class="zone-stats">${zone.used}/${zone.total} (가용률: ${rate}%)</div>
        <div class="progress-bar">
          <div class="progress-fill ${status}" style="width: ${rate}%;"></div>
        </div>
      </div>
    `;
  });
}

// ========================================
// 일일 요금 계산
// ========================================
function calculateDailyPrice() {
  const start = new Date(document.getElementById('daily-start')?.value);
  const end = new Date(document.getElementById('daily-end')?.value);
  if (isNaN(start) || isNaN(end)) return;

  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  const rate = 20000;
  const total = days * rate;

  updateElement('daily-days', `${days}일`);
  updateElement('daily-total', `₩${total.toLocaleString()}`);
}

// ========================================
// 월 주차 요금 계산
// ========================================
function calculateMonthlyPrice() {
  const months = parseInt(document.getElementById('monthly-period')?.value || 0);
  const fixed = document.getElementById('fixed-spot')?.value;
  const base = 150000;
  const fixedFee = fixed === 'fixed' ? 10000 : 0;
  const total = (base + fixedFee) * months;

  updateElement('monthly-months', `${months}개월`);
  updateElement('fixed-price', `₩${fixedFee.toLocaleString()}`);
  updateElement('monthly-total', `₩${total.toLocaleString()}`);
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
  document.getElementById('fixed-spot')?.addEventListener('change', calculateMonthlyPrice);
}

// ========================================
// 예약 제출
// ========================================
function submitDailyReservation() {
  const start = document.getElementById('daily-start')?.value;
  const end = document.getElementById('daily-end')?.value;
  const car = document.getElementById('daily-car')?.value;

  if (!start || !end || !car) {
    alert('❗ 일일 주차 정보를 모두 입력하세요.');
    return;
  }
  alert(`✅ ${start} ~ ${end} 일일 주차 신청 완료!`);
}

function submitMonthlyReservation() {
  const month = document.getElementById('monthly-start')?.value;
  const period = document.getElementById('monthly-period')?.value;
  const car = document.getElementById('monthly-car')?.value;

  if (!month || !period || !car) {
    alert('❗ 월 주차 정보를 모두 입력하세요.');
    return;
  }
  alert(`✅ ${month}부터 ${period}개월 월 주차 신청 완료!`);
}

// ========================================
// 유틸
// ========================================
function updateElement(id, content) {
  const el = document.getElementById(id);
  if (el) el.textContent = content;
}

async function apiRequest(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('서버 오류');
    return await res.json();
  } catch (e) {
    console.error('API 요청 실패:', e);
    return null;
  }
}
