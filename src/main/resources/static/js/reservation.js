// ========================================
// 예약 및 취소 (reservation.js)
// ========================================

let reservationUpdateInterval = null;
let availabilityCheckInterval = null;
let currentReservationType = 'hourly';
let priceRates = {};
let availableZones = [];
let selectedZone = null;

// ========================================
// 초기화
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📅 예약 모듈 로드됨');
  
  // 공통 라이브러리 초기화
  if (!initializeCommon()) {
    return;
  }
  
  // 예약 페이지 초기화
  initializeReservationPage();
  
  console.log('✅ 예약 페이지 초기화 완료');
});

function initializeReservationPage() {
  // 현재 날짜 및 시간 설정
  setupDateTime();
  
  // 가격 계산 이벤트 리스너
  addPriceCalculationListeners();
  
  // 실시간 가용성 체크 이벤트 리스너
  addAvailabilityCheckListeners();
  
  // 초기 데이터 로드
  loadInitialReservationData();
  
  // 실시간 업데이트 시작
  startReservationUpdates();
}

// ========================================
// 초기 데이터 로드
// ========================================
async function loadInitialReservationData() {
  showLoading('예약 정보를 불러오는 중...');
  
  try {
    await Promise.all([
      loadUserCars(),
      loadParkingZones(),
      loadPriceRates(),
      loadUserReservations()
    ]);
    
    hideLoading();
    calculatePrice();
    
  } catch (error) {
    hideLoading();
    console.error('❌ 초기 예약 데이터 로드 실패:', error);
    showToast('예약 정보를 불러오는데 실패했습니다.', 'error');
  }
}

// ========================================
// 날짜 및 시간 설정
// ========================================
function setupDateTime() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentTime = now.getHours().toString().padStart(2, '0') + ':' + 
                     now.getMinutes().toString().padStart(2, '0');
  
  // 날짜 입력 필드 설정
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => {
    input.min = today;
    if (!input.value) {
      input.value = today;
    }
    
    // 날짜 변경 시 가용성 체크
    input.addEventListener('change', debounce(checkRealtimeAvailability, 500));
  });

  // 시간 입력 필드 설정
  const timeInputs = document.querySelectorAll('input[type="time"]');
  timeInputs.forEach(input => {
    if (!input.value && input.id === 'start-time') {
      // 현재 시간보다 1시간 후로 설정
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      input.value = nextHour.getHours().toString().padStart(2, '0') + ':00';
    }
    
    // 시간 변경 시 가용성 체크
    input.addEventListener('change', debounce(checkRealtimeAvailability, 500));
  });
}

// ========================================
// 예약 탭 전환
// ========================================
function switchTab(tabType) {
  currentReservationType = tabType;
  
  // 탭 버튼 업데이트
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // 폼 업데이트
  document.querySelectorAll('.reservation-form').forEach(form => form.classList.remove('active'));
  const targetForm = document.getElementById(tabType + '-form');
  if (targetForm) {
    targetForm.classList.add('active');
  }
  
  // 선택된 구역 초기화
  selectedZone = null;
  
  // 가격 계산 및 가용성 체크
  calculatePrice();
  checkRealtimeAvailability();
  
  console.log(`📋 예약 탭 전환: ${tabType}`);
}

// ========================================
// 사용자 차량 로드
// ========================================
async function loadUserCars() {
  console.log('🚙 등록된 차량 로드 중...');
  
  try {
    const data = await apiRequest('/api/user/vehicles');
    if (!data || !data.vehicles) return false;
    
    // 차량 선택 드롭다운 업데이트
    const carSelects = document.querySelectorAll('.car-select, #car-number, #daily-car-number, #monthly-car-number');
    carSelects.forEach(select => {
      if (select.tagName === 'SELECT') {
        // 기존 옵션 클리어 (첫 번째 기본 옵션 제외)
        const firstOption = select.querySelector('option:first-child');
        select.innerHTML = '';
        if (firstOption) {
          select.appendChild(firstOption.cloneNode(true));
        }
        
        // 새 차량 옵션 추가
        data.vehicles.forEach(car => {
          const option = document.createElement('option');
          option.value = car.carNumber;
          option.textContent = `${car.carNumber} (${car.manufacturer} ${car.model})`;
          option.setAttribute('data-car-type', car.type);
          option.setAttribute('data-car-size', car.size);
          
          if (car.isPrimary) {
            option.selected = true;
          }
          select.appendChild(option);
        });
      }
    });
    
    console.log('✅ 차량 정보 로드 완료', { count: data.vehicles.length });
    return true;
  } catch (error) {
    console.error('❌ 차량 정보 로드 실패:', error);
    return false;
  }
}

// ========================================
// 주차 구역 정보 로드
// ========================================
async function loadParkingZones() {
  console.log('🏢 주차 구역 정보 로드 중...');
  
  try {
    const data = await apiRequest('/api/parking/zones');
    if (!data || !data.zones) return false;
    
    availableZones = data.zones;
    updateZoneSelectors(data.zones);
    
    console.log('✅ 주차 구역 정보 로드 완료', { count: data.zones.length });
    return true;
  } catch (error) {
    console.error('❌ 주차 구역 정보 로드 실패:', error);
    return false;
  }
}

function updateZoneSelectors(zones) {
  const zoneSelects = document.querySelectorAll('.zone-select, #zone-preference, #daily-zone-preference, #monthly-zone-preference');
  
  zoneSelects.forEach(select => {
    if (select.tagName === 'SELECT') {
      // 자동 배정 옵션 유지
      const autoOption = select.querySelector('option[value="auto"], option[value="ANY"]');
      select.innerHTML = '';
      if (autoOption) {
        select.appendChild(autoOption.cloneNode(true));
      } else {
        const option = document.createElement('option');
        option.value = 'auto';
        option.textContent = '자동 배정 (추천)';
        select.appendChild(option);
      }
      
      // 구역 옵션 추가
      zones.forEach(zone => {
        const option = document.createElement('option');
        option.value = zone.zoneCode;
        option.textContent = `${zone.zoneName} (${zone.totalSpots}자리)`;
        option.setAttribute('data-zone-type', zone.type);
        option.setAttribute('data-premium', zone.isPremium);
        select.appendChild(option);
      });
    }
  });
}

// ========================================
// 가격 정책 로드
// ========================================
async function loadPriceRates() {
  console.log('💰 가격 정책 로드 중...');
  
  try {
    const data = await apiRequest('/api/parking/rates');
    if (!data || !data.rates) return false;
    
    priceRates = data.rates;
    
    // 가격 정보 UI 업데이트
    updatePriceInfo(data.rates);
    
    console.log('✅ 가격 정책 로드 완료');
    return true;
  } catch (error) {
    console.error('❌ 가격 정책 로드 실패:', error);
    return false;
  }
}

function updatePriceInfo(rates) {
  // 시간당 요금 표시
  const hourlyRateElement = document.getElementById('hourly-rate-info');
  if (hourlyRateElement && rates.hourly) {
    hourlyRateElement.textContent = `₩${rates.hourly.baseRate.toLocaleString()}/시간`;
  }
  
  // 일일 요금 표시
  const dailyRateElement = document.getElementById('daily-rate-info');
  if (dailyRateElement && rates.daily) {
    dailyRateElement.textContent = `₩${rates.daily.baseRate.toLocaleString()}/일`;
  }
  
  // 월간 요금 표시
  const monthlyRateElement = document.getElementById('monthly-rate-info');
  if (monthlyRateElement && rates.monthly) {
    monthlyRateElement.textContent = `₩${rates.monthly.baseRate.toLocaleString()}/월`;
  }
}

// ========================================
// 사용자 예약 내역 로드
// ========================================
async function loadUserReservations() {
  console.log('📋 사용자 예약 내역 로드 중...');
  
  try {
    const data = await apiRequest('/api/reservations/current');
    if (!data) return false;
    
    // 현재 활성 예약 표시
    updateCurrentReservations(data.reservations || []);
    
    console.log('✅ 사용자 예약 내역 로드 완료');
    return true;
  } catch (error) {
    console.error('❌ 사용자 예약 내역 로드 실패:', error);
    return false;
  }
}

function updateCurrentReservations(reservations) {
  const container = document.getElementById('current-reservations');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (reservations.length > 0) {
    const header = document.createElement('h3');
    header.textContent = '현재 예약 내역';
    header.className = 'current-reservations-header';
    container.appendChild(header);
    
    reservations.forEach(reservation => {
      const item = createCurrentReservationItem(reservation);
      container.appendChild(item);
    });
  }
}

function createCurrentReservationItem(reservation) {
  const item = document.createElement('div');
  item.className = 'current-reservation-item';
  
  const statusClass = reservation.status.toLowerCase();
  const statusText = getReservationStatusText(reservation.status);
  
  item.innerHTML = `
    <div class="reservation-info">
      <div class="reservation-header">
        <span class="reservation-id">${reservation.id}</span>
        <span class="reservation-status status-${statusClass}">${statusText}</span>
      </div>
      <div class="reservation-details">
        <div class="detail-item">
          <span class="detail-label">📅</span>
          <span class="detail-value">${formatReservationDate(reservation)}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">🚗</span>
          <span class="detail-value">${reservation.carNumber}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">📍</span>
          <span class="detail-value">${reservation.zoneName || '자동 배정'}</span>
        </div>
      </div>
    </div>
    <div class="reservation-actions">
      ${reservation.status === 'CONFIRMED' ? 
        `<button onclick="cancelReservation('${reservation.id}')" class="btn-cancel-small">취소</button>` : ''
      }
      ${reservation.status === 'CONFIRMED' && reservation.modifiable ? 
        `<button onclick="modifyReservation('${reservation.id}')" class="btn-modify-small">변경</button>` : ''
      }
    </div>
  `;
  
  return item;
}

// ========================================
// 실시간 가용성 체크
// ========================================
function addAvailabilityCheckListeners() {
  const checkInputs = document.querySelectorAll('#date, #start-time, #duration, #daily-start, #daily-end, #monthly-start, #monthly-period');
  
  checkInputs.forEach(input => {
    input.addEventListener('change', debounce(checkRealtimeAvailability, 500));
    input.addEventListener('input', debounce(checkRealtimeAvailability, 1000));
  });
}

async function checkRealtimeAvailability() {
  const params = getReservationParams();
  if (!params || !isValidParams(params)) {
    clearAvailabilityDisplay();
    return;
  }
  
  try {
    const data = await apiRequest('/api/parking/availability', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    
    if (data) {
      updateAvailabilityDisplay(data);
      updateZoneRecommendations(data.recommendations || []);
    }
  } catch (error) {
    console.error('❌ 실시간 가용성 체크 실패:', error);
  }
}

function getReservationParams() {
  const type = currentReservationType;
  
  if (type === 'hourly') {
    return {
      type: 'hourly',
      date: document.getElementById('date')?.value,
      startTime: document.getElementById('start-time')?.value,
      duration: parseInt(document.getElementById('duration')?.value) || 0,
      carType: getSelectedCarType(),
      zonePreference: document.getElementById('zone-preference')?.value
    };
  } else if (type === 'daily') {
    return {
      type: 'daily',
      startDate: document.getElementById('daily-start')?.value,
      endDate: document.getElementById('daily-end')?.value,
      carType: getSelectedCarType('daily-car-number'),
      zonePreference: document.getElementById('daily-zone-preference')?.value
    };
  } else if (type === 'monthly') {
    return {
      type: 'monthly',
      startDate: document.getElementById('monthly-start')?.value,
      period: parseInt(document.getElementById('monthly-period')?.value) || 0,
      fixedSpot: document.getElementById('fixed-spot')?.value === 'fixed',
      carType: getSelectedCarType('monthly-car-number'),
      zonePreference: document.getElementById('monthly-zone-preference')?.value
    };
  }
  
  return null;
}

function getSelectedCarType(selectId = 'car-number') {
  const carSelect = document.getElementById(selectId);
  if (!carSelect || !carSelect.selectedOptions[0]) return 'standard';
  
  const option = carSelect.selectedOptions[0];
  return option.getAttribute('data-car-type') || 'standard';
}

function isValidParams(params) {
  if (params.type === 'hourly') {
    return params.date && params.startTime && params.duration > 0;
  } else if (params.type === 'daily') {
    return params.startDate && params.endDate;
  } else if (params.type === 'monthly') {
    return params.startDate && params.period > 0;
  }
  return false;
}

function updateAvailabilityDisplay(data) {
  const { totalAvailable, zoneAvailability, peakTimeWarning, recommendedSlots } = data;
  
  // 전체 가용성 표시
  const availabilityElement = document.getElementById('availability-info');
  if (availabilityElement) {
    const availabilityClass = totalAvailable > 10 ? 'high' : totalAvailable > 3 ? 'medium' : 'low';
    availabilityElement.innerHTML = `
      <div class="availability-status ${availabilityClass}">
        <span class="availability-count">${totalAvailable}</span>
        <span class="availability-text">자리 이용 가능</span>
      </div>
      ${peakTimeWarning ? '<div class="peak-warning">⚠️ 피크 시간대입니다</div>' : ''}
    `;
  }
  
  // 구역별 가용성 업데이트
  if (zoneAvailability) {
    updateZoneAvailability(zoneAvailability);
  }
  
  // 추천 슬롯 표시
  if (recommendedSlots && recommendedSlots.length > 0) {
    updateRecommendedSlots(recommendedSlots);
  }
}

function updateZoneAvailability(zoneAvailability) {
  const zoneSelect = document.querySelector('.zone-select:not([style*="display: none"])');
  if (!zoneSelect) return;
  
  // 각 구역 옵션의 가용성 정보 업데이트
  zoneSelect.querySelectorAll('option').forEach(option => {
    const zoneCode = option.value;
    if (zoneCode !== 'auto' && zoneAvailability[zoneCode]) {
      const availability = zoneAvailability[zoneCode];
      option.textContent = option.textContent.replace(/\(\d+자리\)/, `(${availability.available}/${availability.total}자리)`);
      option.disabled = availability.available === 0;
    }
  });
}

function updateRecommendedSlots(recommendedSlots) {
  const container = document.getElementById('recommended-slots');
  if (!container) return;
  
  container.innerHTML = '<h4>추천 슬롯</h4>';
  
  recommendedSlots.slice(0, 3).forEach(slot => {
    const slotElement = document.createElement('div');
    slotElement.className = 'recommended-slot';
    slotElement.innerHTML = `
      <div class="slot-info">
        <div class="slot-name">${slot.slotName}</div>
        <div class="slot-details">${slot.zoneName} • ${slot.distance}m</div>
      </div>
      <div class="slot-price">₩${slot.estimatedPrice.toLocaleString()}</div>
      <button onclick="selectRecommendedSlot('${slot.slotCode}')" class="btn-select-slot">선택</button>
    `;
    container.appendChild(slotElement);
  });
}

function clearAvailabilityDisplay() {
  const availabilityElement = document.getElementById('availability-info');
  if (availabilityElement) {
    availabilityElement.innerHTML = '<div class="availability-status">날짜와 시간을 선택해주세요</div>';
  }
  
  const recommendedContainer = document.getElementById('recommended-slots');
  if (recommendedContainer) {
    recommendedContainer.innerHTML = '';
  }
}

// ========================================
// 가격 계산 (고도화)
// ========================================
function addPriceCalculationListeners() {
  const priceInputs = document.querySelectorAll('#duration, #daily-start, #daily-end, #monthly-period, #fixed-spot, .zone-select, .car-select');
  
  priceInputs.forEach(input => {
    input.addEventListener('change', calculatePrice);
    input.addEventListener('input', debounce(calculatePrice, 300));
  });
}

async function calculatePrice() {
  const type = currentReservationType;
  
  try {
    const params = getReservationParams();
    if (!params || !isValidParams(params)) {
      clearPriceDisplay();
      return;
    }
    
    // 서버에서 정확한 가격 계산
    const data = await apiRequest('/api/parking/calculate-price', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    
    if (data) {
      updatePriceDisplay(data, type);
    } else {
      // 대체: 클라이언트 사이드 계산
      calculateClientSidePrice(params, type);
    }
  } catch (error) {
    console.error('❌ 가격 계산 실패:', error);
    calculateClientSidePrice(getReservationParams(), type);
  }
}

function calculateClientSidePrice(params, type) {
  if (!priceRates[type]) return;
  
  let calculation = {
    baseAmount: 0,
    premiumFee: 0,
    membershipDiscount: 0,
    promoDiscount: 0,
    taxAmount: 0,
    totalAmount: 0
  };
  
  if (type === 'hourly') {
    calculation.baseAmount = params.duration * (priceRates.hourly.baseRate || 2000);
  } else if (type === 'daily') {
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    calculation.baseAmount = days * (priceRates.daily.baseRate || 20000);
  } else if (type === 'monthly') {
    calculation.baseAmount = params.period * (priceRates.monthly.baseRate || 150000);
    if (params.fixedSpot) {
      calculation.premiumFee = params.period * 10000;
    }
  }
  
  // 멤버십 할인
  const discountRate = getMembershipDiscountRate();
  calculation.membershipDiscount = Math.floor((calculation.baseAmount + calculation.premiumFee) * discountRate);
  
  // 세금 계산
  const subtotal = calculation.baseAmount + calculation.premiumFee - calculation.membershipDiscount - calculation.promoDiscount;
  calculation.taxAmount = Math.floor(subtotal * 0.1);
  calculation.totalAmount = subtotal + calculation.taxAmount;
  
  updatePriceDisplay(calculation, type);
}

function updatePriceDisplay(calculation, type) {
  const prefix = type === 'hourly' ? '' : type === 'daily' ? 'daily-' : 'monthly-';
  
  updatePriceElement(prefix + 'base-amount', calculation.baseAmount);
  updatePriceElement(prefix + 'premium-fee', calculation.premiumFee);
  updatePriceElement(prefix + 'membership-discount', calculation.membershipDiscount, true);
  updatePriceElement(prefix + 'promo-discount', calculation.promoDiscount, true);
  updatePriceElement(prefix + 'tax-amount', calculation.taxAmount);
  updatePriceElement(prefix + 'total-amount', calculation.totalAmount);
  
  // 구형 호환성
  updateElement('base-price', calculation.baseAmount);
  updateElement('discount-amount', calculation.membershipDiscount);
  updateElement('tax', calculation.taxAmount);
  updateElement('total-price', calculation.totalAmount);
  
  // 일별/월별 특수 정보
  if (type === 'daily') {
    const start = new Date(document.getElementById('daily-start')?.value);
    const end = new Date(document.getElementById('daily-end')?.value);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    updateElement('daily-days', days + '일');
  } else if (type === 'monthly') {
    const months = parseInt(document.getElementById('monthly-period')?.value) || 0;
    updateElement('monthly-months', months + '개월');
  }
  
  // 가격 비교 정보 표시
  if (calculation.comparison) {
    updatePriceComparison(calculation.comparison);
  }
}

function updatePriceElement(elementId, amount, isDiscount = false) {
  const element = document.getElementById(elementId);
  if (element && amount !== undefined) {
    const prefix = isDiscount ? '-' : '';
    element.textContent = prefix + '₩' + amount.toLocaleString();
  }
}

function updatePriceComparison(comparison) {
  const container = document.getElementById('price-comparison');
  if (!container || !comparison.alternativeOptions) return;
  
  container.innerHTML = '<h4>다른 옵션과 비교</h4>';
  
  comparison.alternativeOptions.forEach(option => {
    const optionElement = document.createElement('div');
    optionElement.className = 'price-option';
    optionElement.innerHTML = `
      <div class="option-info">
        <div class="option-name">${option.name}</div>
        <div class="option-details">${option.details}</div>
      </div>
      <div class="option-price">₩${option.price.toLocaleString()}</div>
      <div class="price-diff ${option.priceDiff > 0 ? 'more-expensive' : 'cheaper'}">
        ${option.priceDiff > 0 ? '+' : ''}₩${option.priceDiff.toLocaleString()}
      </div>
    `;
    container.appendChild(optionElement);
  });
}

function clearPriceDisplay() {
  const elements = ['base-amount', 'premium-fee', 'membership-discount', 'tax-amount', 'total-amount'];
  elements.forEach(id => {
    updateElement(id, '₩0');
  });
}

function getMembershipDiscountRate() {
  const discountElement = document.querySelector('.discount-rate');
  if (discountElement) {
    const rate = parseInt(discountElement.textContent.replace('%', ''));
    return rate / 100;
  }
  return 0.05; // 기본 5% 할인
}

// ========================================
// 스마트 예약 추천
// ========================================
function updateZoneRecommendations(recommendations) {
  const container = document.getElementById('zone-recommendations');
  if (!container || !recommendations.length) return;
  
  container.innerHTML = '<h4>🎯 추천 구역</h4>';
  
  recommendations.slice(0, 3).forEach((rec, index) => {
    const recElement = document.createElement('div');
    recElement.className = `recommendation-item ${index === 0 ? 'best-choice' : ''}`;
    recElement.innerHTML = `
      <div class="rec-badge">${index === 0 ? '최고' : index === 1 ? '추천' : '대안'}</div>
      <div class="rec-info">
        <div class="rec-zone">${rec.zoneName}</div>
        <div class="rec-reasons">${rec.reasons.join(', ')}</div>
      </div>
      <div class="rec-price">₩${rec.estimatedPrice.toLocaleString()}</div>
      <button onclick="selectRecommendedZone('${rec.zoneCode}')" class="btn-select-rec">선택</button>
    `;
    container.appendChild(recElement);
  });
}

function selectRecommendedZone(zoneCode) {
  const zoneSelect = document.querySelector('.zone-select:not([style*="display: none"])');
  if (zoneSelect) {
    zoneSelect.value = zoneCode;
    selectedZone = zoneCode;
    calculatePrice();
    showToast('추천 구역이 선택되었습니다.', 'success');
  }
}

function selectRecommendedSlot(slotCode) {
  // 슬롯 선택 로직
  showToast('슬롯이 선택되었습니다.', 'success');
}

// ========================================
// 예약 제출 (고도화)
// ========================================
async function submitReservation() {
  if (event) event.preventDefault();
  
  const formData = getReservationParams();
  if (!formData) {
    showToast('예약 정보를 확인해주세요.', 'error');
    return;
  }
  
  // 고급 유효성 검사
  const validationResult = await validateReservationForm(formData);
  if (!validationResult.valid) {
    showToast(validationResult.message, 'error');
    return;
  }
  
  // 예약 충돌 체크
  const conflictCheck = await checkReservationConflicts(formData);
  if (conflictCheck.hasConflict) {
    if (!confirm(`${conflictCheck.message}\n계속 진행하시겠습니까?`)) {
      return;
    }
  }
  
  showLoading('예약을 처리중입니다...');
  
  try {
    const response = await apiRequest('/api/reservations', {
      method: 'POST',
      body: JSON.stringify({
        ...formData,
        selectedZone: selectedZone,
        agreementAccepted: true,
        notificationSettings: getNotificationSettings()
      })
    });
    
    if (response && response.reservationId) {
      hideLoading();
      
      // 성공 메시지
      const successMessage = `
예약이 완료되었습니다! 🎉
예약번호: ${response.reservationId}
${response.assignedSlot ? `배정된 슬롯: ${response.assignedSlot}` : ''}
${response.estimatedArrivalTime ? `예상 도착시간: ${response.estimatedArrivalTime}` : ''}
      `;
      
      showToast(successMessage, 'success');
      
      // 예약 확인 모달 표시
      showReservationConfirmationModal(response);
      
      // 폼 초기화
      resetReservationForm();
      
      // 사용자 예약 내역 새로고침
      await loadUserReservations();
      
    } else {
      hideLoading();
      showToast(response?.message || '예약 처리에 실패했습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 예약 제출 실패:', error);
    showToast('예약 처리 중 오류가 발생했습니다.', 'error');
  }
}

async function validateReservationForm(formData) {
  const type = formData.type;
  
  // 기본 유효성 검사
  if (type === 'hourly') {
    if (!formData.date || !formData.startTime || !formData.duration || !formData.carType) {
      return { valid: false, message: '모든 필수 항목을 입력해주세요.' };
    }
    
    const reservationDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const now = new Date();
    const minReservationTime = new Date(now.getTime() + 30 * 60 * 1000); // 30분 후
    
    if (reservationDateTime <= minReservationTime) {
      return { valid: false, message: '예약은 최소 30분 이후부터 가능합니다.' };
    }
    
    if (formData.duration < 1 || formData.duration > 24) {
      return { valid: false, message: '이용 시간은 1시간 이상 24시간 이하여야 합니다.' };
    }
  }
  
  // 서버 측 유효성 검사
  try {
    const validation = await apiRequest('/api/reservations/validate', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    
    return validation || { valid: true };
  } catch (error) {
    console.error('❌ 서버 유효성 검사 실패:', error);
    return { valid: true }; // 서버 검사 실패 시 계속 진행
  }
}

async function checkReservationConflicts(formData) {
  try {
    const conflicts = await apiRequest('/api/reservations/check-conflicts', {
      method: 'POST',
      body: JSON.stringify(formData)
    });
    
    return conflicts || { hasConflict: false };
  } catch (error) {
    console.error('❌ 예약 충돌 체크 실패:', error);
    return { hasConflict: false };
  }
}

function getNotificationSettings() {
  return {
    sms: document.getElementById('notification-sms')?.checked || false,
    email: document.getElementById('notification-email')?.checked || true,
    push: document.getElementById('notification-push')?.checked || true,
    reminderBefore: parseInt(document.getElementById('reminder-time')?.value) || 30
  };
}

function showReservationConfirmationModal(reservationData) {
  // 예약 확인 모달 표시 (실제 구현에서는 모달 컴포넌트 사용)
  const modalContent = `
예약이 성공적으로 완료되었습니다!

📋 예약 정보
• 예약번호: ${reservationData.reservationId}
• 날짜: ${reservationData.date}
• 시간: ${reservationData.startTime}
• 구역: ${reservationData.assignedZone}
• 슬롯: ${reservationData.assignedSlot || '도착 시 배정'}
• 차량: ${reservationData.carNumber}
• 요금: ₩${reservationData.totalAmount.toLocaleString()}

📱 알림 설정
• SMS: ${reservationData.notifications.sms ? '활성화' : '비활성화'}
• 이메일: ${reservationData.notifications.email ? '활성화' : '비활성화'}

⏰ 도착 예정 시간 30분 전에 알림을 보내드립니다.
  `;
  
  alert(modalContent);
}

function resetReservationForm() {
  const forms = document.querySelectorAll('.reservation-form');
  forms.forEach(form => {
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
      if (input.type !== 'hidden') {
        if (input.type === 'checkbox') {
          input.checked = false;
        } else if (input.tagName === 'SELECT') {
          input.selectedIndex = 0;
        } else {
          input.value = '';
        }
      }
    });
  });
  
  // 날짜/시간 다시 설정
  setupDateTime();
  calculatePrice();
}

// ========================================
// 예약 변경/수정
// ========================================
async function modifyReservation(reservationId) {
  showLoading('예약 정보를 불러오는 중...');
  
  try {
    const data = await apiRequest(`/api/reservations/${reservationId}`);
    
    if (data) {
      hideLoading();
      showReservationModificationModal(data);
    } else {
      hideLoading();
      showToast('예약 정보를 불러올 수 없습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 예약 정보 조회 실패:', error);
    showToast('예약 정보 조회에 실패했습니다.', 'error');
  }
}

function showReservationModificationModal(reservationData) {
  // 예약 수정 모달 표시 (간단한 구현)
  const modifications = prompt(`
예약 수정이 가능한 항목:
1. 시간 변경
2. 차량 변경  
3. 구역 변경

수정하실 항목 번호를 입력해주세요 (1-3):
  `);
  
  if (modifications) {
    processReservationModification(reservationData.id, modifications);
  }
}

async function processReservationModification(reservationId, modificationType) {
  showLoading('예약을 수정하는 중...');
  
  try {
    const response = await apiRequest(`/api/reservations/${reservationId}/modify`, {
      method: 'PATCH',
      body: JSON.stringify({
        modificationType: modificationType,
        newData: {} // 실제로는 사용자 입력 데이터
      })
    });
    
    if (response && response.success) {
      hideLoading();
      showToast('예약이 수정되었습니다.', 'success');
      
      // 예약 내역 새로고침
      await loadUserReservations();
    } else {
      hideLoading();
      showToast(response?.message || '예약 수정에 실패했습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 예약 수정 실패:', error);
    showToast('예약 수정 중 오류가 발생했습니다.', 'error');
  }
}

// ========================================
// 예약 취소 (고도화)
// ========================================
async function cancelReservation(reservationId) {
  // 취소 정책 확인
  const cancellationPolicy = await getCancellationPolicy(reservationId);
  
  const confirmMessage = `
예약을 정말 취소하시겠습니까?

${cancellationPolicy ? `
📋 취소 정책
• 취소 수수료: ₩${cancellationPolicy.fee.toLocaleString()}
• 환불 금액: ₩${cancellationPolicy.refundAmount.toLocaleString()}
• 환불 처리 시간: ${cancellationPolicy.refundTime}
` : '취소 수수료가 발생할 수 있습니다.'}
  `;
  
  if (!confirm(confirmMessage)) {
    return;
  }
  
  showLoading('예약을 취소하는 중...');
  
  try {
    const response = await apiRequest(`/api/reservations/${reservationId}/cancel`, {
      method: 'DELETE',
      body: JSON.stringify({
        reason: getCancellationReason(),
        requestRefund: true
      })
    });
    
    if (response && response.success) {
      hideLoading();
      
      const message = `예약이 취소되었습니다.
${response.cancellationFee > 0 ? `취소 수수료: ₩${response.cancellationFee.toLocaleString()}` : ''}
${response.refundAmount > 0 ? `환불 금액: ₩${response.refundAmount.toLocaleString()}` : ''}
${response.refundTime ? `환불 예정일: ${response.refundTime}` : ''}`;
      
      showToast(message, 'success');
      
      // UI에서 해당 예약 제거
      removeReservationFromUI(reservationId);
      
      // 예약 내역 새로고침
      await loadUserReservations();
      
    } else {
      hideLoading();
      showToast(response?.message || '예약 취소에 실패했습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 예약 취소 실패:', error);
    showToast('예약 취소 중 오류가 발생했습니다.', 'error');
  }
}

async function getCancellationPolicy(reservationId) {
  try {
    const policy = await apiRequest(`/api/reservations/${reservationId}/cancellation-policy`);
    return policy;
  } catch (error) {
    console.error('❌ 취소 정책 조회 실패:', error);
    return null;
  }
}

function getCancellationReason() {
  const reasons = [
    '계획 변경',
    '차량 문제',
    '날씨 문제',
    '기타 사유'
  ];
  
  const reason = prompt(`취소 사유를 선택해주세요:\n${reasons.map((r, i) => `${i + 1}. ${r}`).join('\n')}`);
  const index = parseInt(reason) - 1;
  
  return index >= 0 && index < reasons.length ? reasons[index] : '기타 사유';
}

function removeReservationFromUI(reservationId) {
  const reservationElements = document.querySelectorAll(`[data-reservation-id="${reservationId}"]`);
  reservationElements.forEach(element => element.remove());
}

// ========================================
// 예약 내역 로드 (페이지네이션 지원)
// ========================================
async function loadReservationHistory(page = 1, limit = 20, filters = {}) {
  console.log('📋 예약 내역 로드 중...', { page, limit, filters });
  
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    
    const data = await apiRequest(`/api/reservations/history?${params.toString()}`);
    if (!data) return false;
    
    const historyContainer = document.querySelector('.reservation-history, .reservations-list');
    if (!historyContainer) return false;
    
    // 기존 목록 클리어 (첫 페이지일 때만)
    if (page === 1) {
      const existingItems = historyContainer.querySelectorAll('.reservation-item');
      existingItems.forEach(item => item.remove());
    }
    
    // 새 목록 추가
    if (data.reservations && data.reservations.length > 0) {
      data.reservations.forEach(reservation => {
        const item = createReservationHistoryItem(reservation);
        historyContainer.appendChild(item);
      });
    } else if (page === 1) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #64748b;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
          <p>예약 내역이 없습니다.</p>
          <a href="/customer/reservation" style="color: #3b82f6; text-decoration: underline;">지금 예약하기</a>
        </div>
      `;
      historyContainer.appendChild(emptyMessage);
    }
    
    // 페이지네이션 업데이트
    if (data.pagination) {
      updateReservationPagination(data.pagination);
    }
    
    console.log('✅ 예약 내역 로드 완료', { 
      totalReservations: data.reservations?.length || 0,
      currentPage: page 
    });
    
    return true;
  } catch (error) {
    console.error('❌ 예약 내역 로드 실패:', error);
    showErrorMessage('예약 내역을 불러오는데 실패했습니다.');
    return false;
  }
}

function createReservationHistoryItem(reservation) {
  const item = document.createElement('div');
  item.className = 'reservation-item';
  item.setAttribute('data-reservation-id', reservation.id);
  
  const statusClass = reservation.status.toLowerCase();
  const statusText = getReservationStatusText(reservation.status);
  
  item.innerHTML = `
    <div class="reservation-header">
      <div class="reservation-id">예약번호: ${reservation.id}</div>
      <div class="reservation-status status-${statusClass}">${statusText}</div>
    </div>
    <div class="reservation-details">
      <div class="detail-row">
        <span class="detail-label">📅 예약일시:</span>
        <span class="detail-value">${formatReservationDate(reservation)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">⏱️ 이용기간:</span>
        <span class="detail-value">${formatReservationDuration(reservation)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">🚗 차량번호:</span>
        <span class="detail-value">${reservation.carNumber}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">📍 구역:</span>
        <span class="detail-value">${reservation.zoneName || '자동배정'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">💰 결제금액:</span>
        <span class="detail-value">₩${reservation.amount.toLocaleString()}</span>
      </div>
      ${reservation.assignedSlot ? `
        <div class="detail-row">
          <span class="detail-label">🅿️ 배정슬롯:</span>
          <span class="detail-value">${reservation.assignedSlot}</span>
        </div>
      ` : ''}
    </div>
    <div class="reservation-actions">
      ${reservation.status === 'CONFIRMED' ? 
        `<button onclick="cancelReservation('${reservation.id}')" class="btn-cancel">취소</button>` : ''
      }
      ${reservation.status === 'CONFIRMED' && reservation.modifiable ? 
        `<button onclick="modifyReservation('${reservation.id}')" class="btn-modify">변경</button>` : ''
      }
      <button onclick="showReservationDetail('${reservation.id}')" class="btn-detail">상세</button>
      ${reservation.status === 'COMPLETED' && reservation.receiptAvailable ? 
        `<button onclick="downloadReservationReceipt('${reservation.id}')" class="btn-receipt">영수증</button>` : ''
      }
    </div>
  `;
  
  return item;
}

function getReservationStatusText(status) {
  const statusMap = {
    'PENDING': '대기중',
    'CONFIRMED': '확정',
    'ACTIVE': '이용중',
    'COMPLETED': '완료',
    'CANCELLED': '취소됨',
    'EXPIRED': '만료',
    'NO_SHOW': '미이용'
  };
  return statusMap[status] || status;
}

function formatReservationDate(reservation) {
  if (reservation.type === 'hourly') {
    return `${formatDate(reservation.date)} ${formatTime(reservation.startTime)}`;
  } else if (reservation.type === 'daily') {
    return `${formatDate(reservation.startDate)} ~ ${formatDate(reservation.endDate)}`;
  } else if (reservation.type === 'monthly') {
    const endDate = new Date(reservation.startDate);
    endDate.setMonth(endDate.getMonth() + reservation.period);
    return `${formatDate(reservation.startDate)} ~ ${formatDate(endDate.toISOString().split('T')[0])}`;
  }
  return '-';
}

function formatReservationDuration(reservation) {
  if (reservation.type === 'hourly') {
    return `${reservation.duration}시간`;
  } else if (reservation.type === 'daily') {
    const start = new Date(reservation.startDate);
    const end = new Date(reservation.endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return `${days}일`;
  } else if (reservation.type === 'monthly') {
    return `${reservation.period}개월`;
  }
  return '-';
}

// ========================================
// 예약 상세 보기
// ========================================
async function showReservationDetail(reservationId) {
  showLoading('예약 상세 정보를 불러오는 중...');
  
  try {
    const data = await apiRequest(`/api/reservations/${reservationId}/detail`);
    
    if (data) {
      hideLoading();
      renderReservationDetailModal(data);
    } else {
      hideLoading();
      showToast('예약 상세 정보를 불러올 수 없습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 예약 상세 조회 실패:', error);
    showToast('예약 상세 정보 조회에 실패했습니다.', 'error');
  }
}

function renderReservationDetailModal(data) {
  // 상세 정보 모달 표시 (간단한 구현)
  const details = `
📋 예약 상세 정보

🆔 예약번호: ${data.id}
📅 예약일시: ${formatReservationDate(data)}
⏱️ 이용기간: ${formatReservationDuration(data)}
🚗 차량정보: ${data.carNumber} (${data.carModel})
📍 구역정보: ${data.zoneName}
🅿️ 슬롯정보: ${data.assignedSlot || '도착 시 배정'}
💰 결제정보: ₩${data.amount.toLocaleString()}
📱 알림설정: ${data.notifications ? Object.entries(data.notifications).map(([k, v]) => `${k}: ${v ? 'ON' : 'OFF'}`).join(', ') : 'N/A'}
📝 상태: ${getReservationStatusText(data.status)}

${data.notes ? `📌 특이사항: ${data.notes}` : ''}
${data.cancellationPolicy ? `
📋 취소 정책:
• 취소 수수료: ₩${data.cancellationPolicy.fee.toLocaleString()}
• 환불 기준: ${data.cancellationPolicy.refundPolicy}
` : ''}
  `;
  
  alert(details);
}

// ========================================
// 실시간 업데이트
// ========================================
function startReservationUpdates() {
  // 30초마다 가용성 체크
  availabilityCheckInterval = setInterval(() => {
    checkRealtimeAvailability();
  }, 30000);
  
  // 2분마다 예약 상태 업데이트
  reservationUpdateInterval = setInterval(async () => {
    console.log('🔄 예약 정보 실시간 업데이트...');
    
    try {
      await loadUserReservations();
    } catch (error) {
      console.error('❌ 예약 정보 업데이트 실패:', error);
    }
  }, 120000); // 2분
  
  console.log('⏰ 예약 정보 실시간 업데이트 시작');
}

function stopReservationUpdates() {
  if (availabilityCheckInterval) {
    clearInterval(availabilityCheckInterval);
    availabilityCheckInterval = null;
  }
  
  if (reservationUpdateInterval) {
    clearInterval(reservationUpdateInterval);
    reservationUpdateInterval = null;
  }
  
  console.log('⏰ 예약 정보 실시간 업데이트 중지');
}

// ========================================
// 페이지네이션
// ========================================
function updateReservationPagination(pagination) {
  const { currentPage = 1, totalPages = 1, totalCount = 0 } = pagination;
  
  // 페이지 정보 업데이트
  const pageInfo = document.getElementById('reservation-page-info');
  if (pageInfo) {
    pageInfo.textContent = `${currentPage} / ${totalPages} 페이지 (총 ${totalCount}건)`;
  }
  
  // 페이지네이션 버튼 업데이트
  const prevBtn = document.getElementById('reservation-prev-page');
  const nextBtn = document.getElementById('reservation-next-page');
  
  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        loadReservationHistory(currentPage - 1);
      }
    };
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        loadReservationHistory(currentPage + 1);
      }
    };
  }
}

// ========================================
// 영수증 다운로드
// ========================================
async function downloadReservationReceipt(reservationId) {
  showLoading('영수증을 생성하는 중...');
  
  try {
    const response = await apiRequest(`/api/reservations/${reservationId}/receipt`, {
      method: 'GET',
      responseType: 'blob'
    });
    
    if (response) {
      const filename = `예약영수증_${reservationId}_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadFileBlob(response, filename);
      
      hideLoading();
      showToast('영수증이 다운로드되었습니다.', 'success');
    } else {
      hideLoading();
      showToast('영수증 다운로드에 실패했습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 영수증 다운로드 실패:', error);
    showToast('영수증 다운로드에 실패했습니다.', 'error');
  }
}

// ========================================
// 유틸리티 함수들
// ========================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function formatDate(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    
    return `${yyyy}-${MM}-${dd}`;
  } catch (error) {
    return '-';
  }
}

function formatTime(timeString) {
  if (!timeString) return '-';
  
  try {
    return timeString.substring(0, 5); // HH:MM 형식
  } catch (error) {
    return '-';
  }
}

function updateElement(id, content) {
  const element = document.getElementById(id);
  if (element) {
    if (typeof content === 'number') {
      element.textContent = '₩' + content.toLocaleString();
    } else {
      element.textContent = content;
    }
  }
}

function downloadFileBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(link);
}

function showErrorMessage(message) {
  const errorContainer = document.getElementById('reservation-error-message');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  } else {
    showToast(message, 'error');
  }
}

function logout() {
  if (confirm('로그아웃 하시겠습니까?')) {
    document.getElementById('logoutForm').submit();
  }
}

// ========================================
// 페이지 정리
// ========================================
window.addEventListener('beforeunload', function() {
  stopReservationUpdates();
});

// ========================================
// 전역 함수 노출
// ========================================
window.switchTab = switchTab;
window.submitReservation = submitReservation;
window.cancelReservation = cancelReservation;
window.modifyReservation = modifyReservation;
window.loadReservationHistory = loadReservationHistory;
window.showReservationDetail = showReservationDetail;
window.downloadReservationReceipt = downloadReservationReceipt;
window.checkRealtimeAvailability = checkRealtimeAvailability;
window.selectRecommendedZone = selectRecommendedZone;
window.selectRecommendedSlot = selectRecommendedSlot;
window.calculatePrice = calculatePrice;