// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  initializePage();
  updateElapsedTime();
  setInterval(updateElapsedTime, 60000); // 1분마다 업데이트
});

// 페이지 초기화
function initializePage() {
  // 현재 날짜 설정
  const today = new Date().toISOString().split('T')[0];
  const dateInputs = document.querySelectorAll('input[type="date"]');
  dateInputs.forEach(input => {
    if (!input.value) {
      input.min = today;
      input.value = today;
    }
  });

  // 가격 계산 이벤트 리스너 추가
  addPriceCalculationListeners();
  
  // 자동결제 체크박스 이벤트
  const autoPayCheckbox = document.getElementById('auto-pay');
  if (autoPayCheckbox) {
    autoPayCheckbox.addEventListener('change', toggleAutoPaymentSettings);
  }

  // 결제 체크박스 이벤트
  const billCheckboxes = document.querySelectorAll('.bill-checkbox');
  billCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updatePaymentSummary);
  });
}

// 경과 시간 업데이트
function updateElapsedTime() {
  const elapsedElement = document.getElementById('elapsed-time');
  if (elapsedElement) {
    const entryTime = new Date('2025-07-02 09:30:00');
    const now = new Date();
    const elapsed = now - entryTime;
    
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    
    elapsedElement.textContent = `${hours}시간 ${minutes}분`;
  }
}

// === 예약 관련 함수들 ===

// 예약 탭 전환
function switchTab(tabType) {
  // 탭 버튼 활성화
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // 폼 전환
  document.querySelectorAll('.reservation-form').forEach(form => form.classList.remove('active'));
  document.getElementById(tabType + '-form').classList.add('active');
  
  // 가격 계산
  calculatePrice();
}

// 가격 계산 이벤트 리스너 추가
function addPriceCalculationListeners() {
  const priceInputs = document.querySelectorAll('#duration, #daily-start, #daily-end, #monthly-period, #fixed-spot');
  priceInputs.forEach(input => {
    input.addEventListener('change', calculatePrice);
  });
}

// 가격 계산
function calculatePrice() {
  // 시간 주차 가격 계산
  const duration = document.getElementById('duration');
  if (duration && duration.value) {
    const hours = parseInt(duration.value);
    const basePrice = hours * 2000; // 시간당 2000원
    const tax = Math.floor(basePrice * 0.1);
    const total = basePrice + tax;
    
    updatePriceDisplay('base-price', basePrice);
    updatePriceDisplay('tax', tax);
    updatePriceDisplay('total-price', total);
  }
  
  // 일일 주차 가격 계산
  const dailyStart = document.getElementById('daily-start');
  const dailyEnd = document.getElementById('daily-end');
  if (dailyStart && dailyEnd && dailyStart.value && dailyEnd.value) {
    const start = new Date(dailyStart.value);
    const end = new Date(dailyEnd.value);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    const total = days * 20000; // 일일 20,000원
    
    updatePriceDisplay('daily-days', days + '일');
    updatePriceDisplay('daily-total', total);
  }
  
  // 월 주차 가격 계산
  const monthlyPeriod = document.getElementById('monthly-period');
  const fixedSpot = document.getElementById('fixed-spot');
  if (monthlyPeriod && monthlyPeriod.value) {
    const months = parseInt(monthlyPeriod.value);
    const baseMonthly = months * 150000; // 월 150,000원
    const fixedPrice = fixedSpot && fixedSpot.value === 'fixed' ? months * 10000 : 0;
    const total = baseMonthly + fixedPrice;
    
    updatePriceDisplay('monthly-months', months + '개월');
    updatePriceDisplay('fixed-price', fixedPrice);
    updatePriceDisplay('monthly-total', total);
  }
}

// 가격 표시 업데이트
function updatePriceDisplay(elementId, price) {
  const element = document.getElementById(elementId);
  if (element) {
    if (typeof price === 'number') {
      element.textContent = '₩' + price.toLocaleString();
    } else {
      element.textContent = price;
    }
  }
}

// 예약 신청 처리
function submitReservation() {
  event.preventDefault();
  
  const formData = {
    type: 'hourly',
    date: document.getElementById('date').value,
    startTime: document.getElementById('start-time').value,
    duration: document.getElementById('duration').value,
    carNumber: document.getElementById('car-number').value,
    zone: document.getElementById('zone-preference').value
  };
  
  // 유효성 검사
  if (!formData.date || !formData.startTime || !formData.duration || !formData.carNumber) {
    showToast('모든 필수 항목을 입력해주세요.', 'error');
    return;
  }
  
  // 예약 처리 시뮬레이션
  showLoading('예약을 처리중입니다...');
  
  setTimeout(() => {
    hideLoading();
    const reservationId = 'R' + Date.now();
    showToast(`예약이 완료되었습니다! 예약번호: ${reservationId}`, 'success');
    
    // 폼 초기화
    document.querySelector('.booking-form').reset();
    calculatePrice();
  }, 2000);
}

function submitDailyReservation() {
  event.preventDefault();
  showToast('일일 주차 예약이 신청되었습니다!', 'success');
}

function submitMonthlyReservation() {
  event.preventDefault();
  showToast('월 주차 예약이 신청되었습니다!', 'success');
}

// === 결제 관련 함수들 ===

// 전체 선택/해제
function selectAllBills() {
  const checkboxes = document.querySelectorAll('.bill-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });
  updatePaymentSummary();
}

function deselectAllBills() {
  const checkboxes = document.querySelectorAll('.bill-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  updatePaymentSummary();
}

// 결제 요약 업데이트
function updatePaymentSummary() {
  const checkedBoxes = document.querySelectorAll('.bill-checkbox:checked');
  const count = checkedBoxes.length;
  
  let totalAmount = 0;
  checkedBoxes.forEach(checkbox => {
    const billItem = checkbox.closest('.bill-item');
    const amountText = billItem.querySelector('.bill-amount').textContent;
    const amount = parseInt(amountText.replace(/[₩,]/g, ''));
    totalAmount += amount;
  });
  
  // 할인 적용
  const discountElement = document.getElementById('discount');
  const discountAmount = discountElement ? parseInt(discountElement.textContent.replace(/[₩,-]/g, '')) || 0 : 0;
  const finalAmount = totalAmount - discountAmount;
  
  // UI 업데이트
  updateElement('selected-count', count + '건');
  updateElement('selected-amount', '₩' + totalAmount.toLocaleString());
  updateElement('total-amount', '₩' + finalAmount.toLocaleString());
  updateElement('pay-btn-amount', '₩' + finalAmount.toLocaleString());
}

// 쿠폰 적용
function applyCoupon() {
  const couponCode = document.getElementById('coupon-code').value.trim();
  if (!couponCode) {
    showToast('쿠폰 코드를 입력해주세요.', 'error');
    return;
  }
  
  // 쿠폰 코드 확인 (시뮬레이션)
  const validCoupons = {
    'WELCOME10': 0.1,
    'MONTH5': 0.05,
    'SUMMER20': 0.2
  };
  
  if (validCoupons[couponCode]) {
    const discountRate = validCoupons[couponCode];
    applyCouponDiscount(discountRate, couponCode);
    showToast(`쿠폰이 적용되었습니다! ${Math.floor(discountRate * 100)}% 할인`, 'success');
  } else {
    showToast('유효하지 않은 쿠폰 코드입니다.', 'error');
  }
}

function useCoupon(couponCode) {
  document.getElementById('coupon-code').value = couponCode;
  applyCoupon();
}

function applyCouponDiscount(rate, couponCode) {
  const selectedAmount = parseInt(document.getElementById('selected-amount').textContent.replace(/[₩,]/g, ''));
  const discountAmount = Math.floor(selectedAmount * rate);
  
  updateElement('discount', '-₩' + discountAmount.toLocaleString());
  updatePaymentSummary();
}

// 자동결제 설정 토글
function toggleAutoPaymentSettings() {
  const autoSettings = document.getElementById('auto-settings');
  const checkbox = document.getElementById('auto-pay');
  
  if (autoSettings) {
    autoSettings.style.display = checkbox.checked ? 'block' : 'none';
  }
}

// 결제 처리
function processPayment() {
  const agreeTerms = document.getElementById('agree-terms');
  if (!agreeTerms.checked) {
    showToast('결제 서비스 이용약관에 동의해주세요.', 'error');
    return;
  }
  
  const selectedMethod = document.querySelector('input[name="payment"]:checked');
  if (!selectedMethod) {
    showToast('결제 방법을 선택해주세요.', 'error');
    return;
  }
  
  const totalAmount = document.getElementById('total-amount').textContent;
  
  showLoading('결제를 처리중입니다...');
  
  setTimeout(() => {
    hideLoading();
    showToast(`결제가 완료되었습니다! ${totalAmount}`, 'success');
    
    // 미납 목록에서 선택된 항목 제거 (시뮬레이션)
    const checkedBoxes = document.querySelectorAll('.bill-checkbox:checked');
    checkedBoxes.forEach(checkbox => {
      const billItem = checkbox.closest('.bill-item');
      billItem.style.opacity = '0.5';
      billItem.style.textDecoration = 'line-through';
    });
    
    // 요약 정보 초기화
    setTimeout(() => {
      checkedBoxes.forEach(checkbox => {
        checkbox.closest('.bill-item').remove();
      });
      updatePaymentSummary();
    }, 1500);
    
  }, 3000);
}

// === 이용내역 관련 함수들 ===

// 내역 탭 전환
function switchRecordTab(tabType) {
  // 탭 버튼 활성화
  document.querySelectorAll('.records-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // 컨텐츠 전환
  document.querySelectorAll('.records-content').forEach(content => content.classList.remove('active'));
  document.getElementById(tabType + '-records').classList.add('active');
}

// 필터 적용
function applyFilter() {
  const dateFrom = document.getElementById('date-from').value;
  const dateTo = document.getElementById('date-to').value;
  const recordType = document.getElementById('record-type').value;
  const status = document.getElementById('status-filter').value;
  
  showToast('필터가 적용되었습니다.', 'info');
  // 실제로는 서버에 요청을 보내서 필터링된 데이터를 받아옴
}

// 내역 내보내기
function exportRecords() {
  showLoading('내역을 내보내는 중...');
  
  setTimeout(() => {
    hideLoading();
    showToast('이용내역이 다운로드되었습니다.', 'success');
    
    // 실제로는 CSV나 Excel 파일 다운로드
    const link = document.createElement('a');
    link.href = 'data:text/csv;charset=utf-8,날짜,구역,시간,요금\n2025-07-01,A-08,8시간30분,15000';
    link.download = '주차이용내역_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
  }, 1500);
}

// 상세보기 모달
function showDetail(recordId) {
  const modal = document.getElementById('detail-modal');
  if (modal) {
    // 상세 정보 로드 (시뮬레이션)
    loadDetailData(recordId);
    modal.style.display = 'flex';
  }
}

function loadDetailData(recordId) {
  // 실제로는 서버에서 상세 데이터를 가져옴
  const sampleData = {
    'P240701001': {
      id: 'P240701001',
      spot: 'A-08번',
      car: '12가3456',
      entry: '2025-07-01 09:00:15',
      exit: '2025-07-01 17:30:22',
      duration: '8시간 30분 7초',
      base: 13500,
      tax: 1500,
      total: 15000
    }
  };
  
  const data = sampleData[recordId] || sampleData['P240701001'];
  
  updateElement('detail-id', data.id);
  updateElement('detail-spot', data.spot);
  updateElement('detail-car', data.car);
  updateElement('detail-entry', data.entry);
  updateElement('detail-exit', data.exit);
  updateElement('detail-duration', data.duration);
  updateElement('detail-base', '₩' + data.base.toLocaleString());
  updateElement('detail-tax', '₩' + data.tax.toLocaleString());
  updateElement('detail-total', '₩' + data.total.toLocaleString());
}

function closeModal() {
  const modal = document.getElementById('detail-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function downloadReceipt() {
  showToast('영수증을 다운로드합니다.', 'info');
  // 실제로는 PDF 영수증 생성 및 다운로드
}

// 예약 취소
function cancelReservation(reservationId) {
  if (confirm('예약을 정말 취소하시겠습니까?')) {
    showLoading('예약을 취소하는 중...');
    
    setTimeout(() => {
      hideLoading();
      showToast('예약이 취소되었습니다.', 'success');
      
      // 해당 예약 항목 제거
      event.target.closest('.reservation-record-item').remove();
    }, 1500);
  }
}

// === 대시보드 관련 함수들 ===

// 출차 요청
function requestExit() {
  if (confirm('출차를 요청하시겠습니까?')) {
    showLoading('출차를 처리중입니다...');
    
    setTimeout(() => {
      hideLoading();
      showToast('출차가 완료되었습니다! 최종요금: ₩5,000', 'success');
      
      // 주차 상태 업데이트
      const statusCard = event.target.closest('.status-card');
      statusCard.querySelector('.status-badge').textContent = '출차완료';
      statusCard.querySelector('.status-badge').style.background = '#718096';
      event.target.remove();
    }, 2000);
  }
}

// QR 코드 표시
function showQR() {
  showToast('QR 코드를 생성중입니다...', 'info');
  
  setTimeout(() => {
    alert('QR 코드가 생성되었습니다!\n입차시 게이트에 스캔해주세요.\n\n[QR 코드 이미지가 여기에 표시됩니다]');
  }, 1000);
}

// 프로필 보기
function showProfile() {
  alert('내 정보 페이지로 이동합니다.\n\n- 개인정보 수정\n- 차량정보 관리\n- 알림설정\n- 이용약관');
}

// 고객지원
function showSupport() {
  alert('고객지원 센터\n\n📞 1588-1234\n📧 support@smartparking.com\n🕐 운영시간: 09:00-18:00\n\nFAQ 바로가기도 준비되어 있습니다.');
}

// 페이지네이션
function prevPage() {
  showToast('이전 페이지로 이동합니다.', 'info');
}

function nextPage() {
  showToast('다음 페이지로 이동합니다.', 'info');
}

// === 유틸리티 함수들 ===

// 요소 업데이트
function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

// 토스트 알림
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast show';
  toast.textContent = message;
  
  // 타입별 스타일
  switch(type) {
    case 'success':
      toast.style.background = '#48bb78';
      break;
    case 'error':
      toast.style.background = '#e53e3e';
      break;
    case 'warning':
      toast.style.background = '#ed8936';
      break;
    default:
      toast.style.background = '#4299e1';
  }
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// 로딩 표시
function showLoading(message = '처리중...') {
  const loading = document.createElement('div');
  loading.id = 'loading-overlay';
  loading.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    color: white;
    font-size: 1.2rem;
    font-weight: 600;
  `;
  loading.innerHTML = `
    <div style="text-align: center;">
      <div style="margin-bottom: 1rem;">⏳</div>
      <div>${message}</div>
    </div>
  `;
  
  document.body.appendChild(loading);
}

function hideLoading() {
  const loading = document.getElementById('loading-overlay');
  if (loading) {
    document.body.removeChild(loading);
  }
}

// 모달 외부 클릭시 닫기
document.addEventListener('click', function(event) {
  const modal = document.getElementById('detail-modal');
  if (event.target === modal) {
    closeModal();
  }
});

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    closeModal();
  }
});

// 실시간 현황 업데이트 (5분마다)
setInterval(() => {
  // 주차장 현황 업데이트
  const zones = document.querySelectorAll('.zone-status .available');
  zones.forEach(zone => {
    const current = parseInt(zone.textContent);
    const change = Math.random() > 0.5 ? 1 : -1;
    const newValue = Math.max(0, current + change);
    zone.textContent = newValue;
  });
  
  showToast('주차장 현황이 업데이트되었습니다.', 'info');
}, 300000); // 5분

// 입력 필드 실시간 유효성 검사
document.addEventListener('input', function(event) {
  if (event.target.type === 'text' && event.target.id === 'car-number') {
    // 차량번호 형식 검사
    const value = event.target.value;
    const pattern = /^\d{2,3}[가-힣]\d{4}$/;
    
    if (value && !pattern.test(value)) {
      event.target.style.borderColor = '#e53e3e';
    } else {
      event.target.style.borderColor = '#e2e8f0';
    }
  }
});

console.log('고객용 스크립트가 로드되었습니다. 🚗');