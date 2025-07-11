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

 // 결제 서비스 함수들
    function payCurrentParking() {
      showToast('현재 주차중인 차량이 없습니다.', 'info');
    }

    function buySubscription() {
      window.location.href = 'subscription.html';
    }

    function chargeBalance() {
      showToast('선불 충전 페이지로 이동합니다.', 'info');
    }

    function quickPay() {
      showQR();
    }

    function addPaymentMethod() {
      showToast('새 결제수단 추가 페이지로 이동합니다.', 'info');
    }

    // 자동결제 설정 토글
    document.addEventListener('DOMContentLoaded', function() {
      const autoPayCheckbox = document.getElementById('auto-pay');
      const autoSettings = document.getElementById('auto-settings');
      
      function toggleAutoPaymentSettings() {
        if (autoSettings) {
          autoSettings.style.display = autoPayCheckbox.checked ? 'block' : 'none';
        }
      }
      
      if (autoPayCheckbox) {
        autoPayCheckbox.addEventListener('change', toggleAutoPaymentSettings);
        toggleAutoPaymentSettings(); // 초기 상태 설정
      }
    });
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
  window.location.href = 'my-info.html';
}

// 고객지원
function showSupport() {
  window.location.href = 'support.html';
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

 // 정보 탭 전환
    function switchInfoTab(tabType) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      
      document.querySelectorAll('.info-content').forEach(content => content.classList.remove('active'));
      document.getElementById(tabType + '-info').classList.add('active');
    }

    // 개인정보 저장
    function savePersonalInfo() {
      showLoading('개인정보를 저장하는 중...');
      setTimeout(() => {
        hideLoading();
        showToast('개인정보가 저장되었습니다.', 'success');
      }, 1500);
    }

    // 주소 검색
    function searchAddress() {
      showToast('주소 검색 기능을 준비중입니다.', 'info');
    }

    // 차량 관련 함수들
    function addVehicle() {
      document.getElementById('vehicle-form-title').textContent = '차량 정보 추가';
      document.getElementById('vehicle-form').style.display = 'block';
      document.getElementById('car-number').value = '';
      document.getElementById('car-model').value = '';
      document.getElementById('car-year').value = '';
      document.getElementById('car-color').value = '';
    }

    function editVehicle(carNumber) {
      document.getElementById('vehicle-form-title').textContent = '차량 정보 수정';
      document.getElementById('vehicle-form').style.display = 'block';
      document.getElementById('car-number').value = carNumber;
      
      if (carNumber === '12가3456') {
        document.getElementById('car-model').value = '현대 아반떼';
        document.getElementById('car-year').value = '2022';
        document.getElementById('car-color').value = '화이트';
      }
    }

    function cancelVehicleForm() {
      document.getElementById('vehicle-form').style.display = 'none';
    }

    function saveVehicle() {
      const carNumber = document.getElementById('car-number').value;
      if (!carNumber) {
        showToast('차량번호를 입력해주세요.', 'error');
        return;
      }
      
      showLoading('차량 정보를 저장하는 중...');
      setTimeout(() => {
        hideLoading();
        showToast('차량 정보가 저장되었습니다.', 'success');
        cancelVehicleForm();
      }, 1500);
    }

    function deleteVehicle(carNumber) {
      if (confirm('차량을 삭제하시겠습니까?')) {
        showToast(`${carNumber} 차량이 삭제되었습니다.`, 'success');
      }
    }

    function setPrimary(carNumber) {
      showToast(`${carNumber}이(가) 주차량으로 설정되었습니다.`, 'success');
    }

    // 알림설정 저장
    function saveNotificationSettings() {
      showLoading('알림 설정을 저장하는 중...');
      setTimeout(() => {
        hideLoading();
        showToast('알림 설정이 저장되었습니다.', 'success');
      }, 1500);
    }

    // 비밀번호 변경
    function changePassword() {
      const current = document.getElementById('current-password').value;
      const newPw = document.getElementById('new-password').value;
      const confirm = document.getElementById('confirm-password').value;

      if (!current || !newPw || !confirm) {
        showToast('모든 필드를 입력해주세요.', 'error');
        return;
      }

      if (newPw !== confirm) {
        showToast('새 비밀번호가 일치하지 않습니다.', 'error');
        return;
      }

      showLoading('비밀번호를 변경하는 중...');
      setTimeout(() => {
        hideLoading();
        showToast('비밀번호가 변경되었습니다.', 'success');
        document.querySelector('.password-form').reset();
      }, 2000);
    }

    // 회원 탈퇴
    function deleteAccount() {
      if (confirm('정말로 회원탈퇴를 하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 데이터가 삭제됩니다.')) {
        if (confirm('마지막 확인입니다. 정말로 탈퇴하시겠습니까?')) {
          showToast('회원탈퇴 절차를 시작합니다.', 'warning');
        }
      }
    }

    // ===== 내 정보 페이지 관련 함수들 =====

// 정보 탭 전환
function switchInfoTab(tabType) {
  // 탭 버튼 활성화
  document.querySelectorAll('.info-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // 컨텐츠 전환
  document.querySelectorAll('.info-content').forEach(content => content.classList.remove('active'));
  const targetContent = document.getElementById(tabType + '-info');
  if (targetContent) {
    targetContent.classList.add('active');
  }
}

// 개인정보 저장
function savePersonalInfo() {
  const phone = document.getElementById('phone').value;
  const email = document.getElementById('email').value;
  
  if (!phone || !email) {
    showToast('휴대폰 번호와 이메일을 입력해주세요.', 'error');
    return;
  }
  
  // 이메일 유효성 검사
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    showToast('올바른 이메일 형식을 입력해주세요.', 'error');
    return;
  }
  
  // 휴대폰 번호 유효성 검사
  const phonePattern = /^010-\d{4}-\d{4}$/;
  if (!phonePattern.test(phone)) {
    showToast('올바른 휴대폰 번호 형식을 입력해주세요. (010-0000-0000)', 'error');
    return;
  }
  
  showLoading('개인정보를 저장하는 중...');
  setTimeout(() => {
    hideLoading();
    showToast('개인정보가 저장되었습니다.', 'success');
  }, 1500);
}

// 주소 검색
function searchAddress() {
  showToast('주소 검색 API 연동 준비중입니다.', 'info');
  // 실제로는 다음과 같은 주소 검색 API를 연동
  // - 카카오 주소 검색 API
  // - 네이버 주소 검색 API
  // - 우정사업본부 우편번호 서비스
  
  // 시뮬레이션: 주소 설정
  setTimeout(() => {
    document.getElementById('zipcode').value = '06234';
    document.getElementById('address').value = '서울시 강남구 테헤란로 123';
    showToast('주소가 설정되었습니다.', 'success');
  }, 1000);
}

// === 차량 관련 함수들 ===

// 차량 추가
function addVehicle() {
  const formTitle = document.getElementById('vehicle-form-title');
  const vehicleForm = document.getElementById('vehicle-form');
  
  if (formTitle) formTitle.textContent = '차량 정보 추가';
  if (vehicleForm) {
    vehicleForm.style.display = 'block';
    // 폼 초기화
    document.getElementById('car-number').value = '';
    document.getElementById('car-model').value = '';
    document.getElementById('car-year').value = '';
    document.getElementById('car-color').value = '';
    
    // 차량번호 입력 필드에 포커스
    document.getElementById('car-number').focus();
  }
}

// 차량 수정
function editVehicle(carNumber) {
  const formTitle = document.getElementById('vehicle-form-title');
  const vehicleForm = document.getElementById('vehicle-form');
  
  if (formTitle) formTitle.textContent = '차량 정보 수정';
  if (vehicleForm) {
    vehicleForm.style.display = 'block';
    
    // 기존 데이터 로드 (예시 데이터)
    document.getElementById('car-number').value = carNumber;
    
    if (carNumber === '12가3456') {
      document.getElementById('car-model').value = '현대 아반떼';
      document.getElementById('car-year').value = '2022';
      document.getElementById('car-color').value = '화이트';
    } else if (carNumber === '34나5678') {
      document.getElementById('car-model').value = '기아 K5';
      document.getElementById('car-year').value = '2021';
      document.getElementById('car-color').value = '블랙';
    }
  }
}

// 차량 폼 취소
function cancelVehicleForm() {
  const vehicleForm = document.getElementById('vehicle-form');
  if (vehicleForm) {
    vehicleForm.style.display = 'none';
  }
}

// 차량 저장
function saveVehicle() {
  const carNumber = document.getElementById('car-number').value.trim();
  const carModel = document.getElementById('car-model').value.trim();
  const carYear = document.getElementById('car-year').value;
  const carColor = document.getElementById('car-color').value;
  
  // 유효성 검사
  if (!carNumber) {
    showToast('차량번호를 입력해주세요.', 'error');
    return;
  }
  
  // 차량번호 형식 검사
  const carNumberPattern = /^\d{2,3}[가-힣]\d{4}$/;
  if (!carNumberPattern.test(carNumber)) {
    showToast('올바른 차량번호 형식을 입력해주세요. (예: 12가3456)', 'error');
    return;
  }
  
  if (!carModel) {
    showToast('차종을 입력해주세요.', 'error');
    return;
  }
  
  if (!carYear || !carColor) {
    showToast('연식과 색상을 선택해주세요.', 'error');
    return;
  }
  
  showLoading('차량 정보를 저장하는 중...');
  setTimeout(() => {
    hideLoading();
    showToast('차량 정보가 저장되었습니다.', 'success');
    cancelVehicleForm();
    
    // 실제로는 차량 목록을 새로고침하거나 업데이트
  }, 1500);
}

// 차량 삭제
function deleteVehicle(carNumber) {
  if (confirm(`${carNumber} 차량을 정말 삭제하시겠습니까?`)) {
    showLoading('차량을 삭제하는 중...');
    setTimeout(() => {
      hideLoading();
      showToast(`${carNumber} 차량이 삭제되었습니다.`, 'success');
      
      // 실제로는 해당 차량 항목을 DOM에서 제거
      // event.target.closest('.vehicle-item').remove();
    }, 1000);
  }
}

// 주차량 설정
function setPrimary(carNumber) {
  if (confirm(`${carNumber}을(를) 주차량으로 설정하시겠습니까?`)) {
    showLoading('주차량을 설정하는 중...');
    setTimeout(() => {
      hideLoading();
      showToast(`${carNumber}이(가) 주차량으로 설정되었습니다.`, 'success');
      
      // 실제로는 차량 목록을 업데이트하여 주차량 배지를 이동
    }, 1000);
  }
}

// === 알림설정 관련 함수들 ===

// 알림설정 저장
function saveNotificationSettings() {
  // 모든 알림 설정 수집
  const notifications = {};
  document.querySelectorAll('.notification-item input[type="checkbox"]').forEach((checkbox, index) => {
    notifications[`setting_${index}`] = checkbox.checked;
  });
  
  // 알림 수신 방법 수집
  const channels = {};
  document.querySelectorAll('.channel-option input[type="checkbox"]').forEach((checkbox, index) => {
    channels[`channel_${index}`] = checkbox.checked;
  });
  
  showLoading('알림 설정을 저장하는 중...');
  setTimeout(() => {
    hideLoading();
    showToast('알림 설정이 저장되었습니다.', 'success');
    
    // 실제로는 서버에 설정 저장
    console.log('알림 설정:', notifications);
    console.log('수신 방법:', channels);
  }, 1500);
}

// === 보안설정 관련 함수들 ===

// 비밀번호 변경
function changePassword() {
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;
  
  // 유효성 검사
  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast('모든 필드를 입력해주세요.', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showToast('새 비밀번호가 일치하지 않습니다.', 'error');
    return;
  }
  
  // 비밀번호 강도 검사
  const passwordPattern = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordPattern.test(newPassword)) {
    showToast('비밀번호는 8자 이상, 영문+숫자+특수문자 조합이어야 합니다.', 'error');
    return;
  }
  
  if (currentPassword === newPassword) {
    showToast('새 비밀번호는 현재 비밀번호와 달라야 합니다.', 'error');
    return;
  }
  
  showLoading('비밀번호를 변경하는 중...');
  setTimeout(() => {
    hideLoading();
    showToast('비밀번호가 성공적으로 변경되었습니다.', 'success');
    
    // 폼 초기화
    document.querySelector('.password-form').reset();
  }, 2000);
}

// 회원 탈퇴
function deleteAccount() {
  const confirmMessage = `정말로 회원탈퇴를 하시겠습니까?

⚠️ 주의사항:
• 모든 개인정보가 즉시 삭제됩니다
• 예약 내역 및 결제 정보가 삭제됩니다
• 적립된 포인트가 모두 소멸됩니다
• 이 작업은 되돌릴 수 없습니다

탈퇴를 진행하시려면 "확인"을 클릭해주세요.`;

  if (confirm(confirmMessage)) {
    const finalConfirm = confirm('마지막 확인입니다.\n\n정말로 회원탈퇴를 진행하시겠습니까?');
    
    if (finalConfirm) {
      showLoading('회원탈퇴를 처리하는 중...');
      setTimeout(() => {
        hideLoading();
        alert('회원탈퇴가 완료되었습니다.\n\n그동안 스마트파킹을 이용해주셔서 감사했습니다.');
        
        // 실제로는 로그아웃 처리 후 메인 페이지로 이동
        // window.location.href = 'index.html';
      }, 3000);
    }
  }
}

// ===== 고객지원 페이지 관련 함수들 =====

// FAQ 카테고리 필터링
function filterFAQ(category) {
  // 카테고리 버튼 활성화
  document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  
  // FAQ 항목 필터링
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    if (category === 'all' || item.dataset.category === category) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
  
  // 검색어 초기화
  const searchInput = document.getElementById('faq-search');
  if (searchInput) {
    searchInput.value = '';
  }
}

// FAQ 검색
function searchFAQ() {
  const searchTerm = document.getElementById('faq-search').value.toLowerCase().trim();
  const faqItems = document.querySelectorAll('.faq-item');
  
  if (searchTerm === '') {
    // 검색어가 없으면 모든 항목 표시
    faqItems.forEach(item => {
      item.style.display = 'block';
    });
    return;
  }
  
  let hasResults = false;
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question span').textContent.toLowerCase();
    const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
    
    if (question.includes(searchTerm) || answer.includes(searchTerm)) {
      item.style.display = 'block';
      hasResults = true;
      
      // 검색어가 포함된 FAQ는 자동으로 열기
      const faqAnswer = item.querySelector('.faq-answer');
      const faqToggle = item.querySelector('.faq-toggle');
      if (faqAnswer && faqToggle) {
        faqAnswer.style.display = 'block';
        faqToggle.textContent = '−';
        item.classList.add('active');
      }
    } else {
      item.style.display = 'none';
    }
  });
  
  // 검색 결과가 없는 경우
  if (!hasResults && searchTerm !== '') {
    showToast('검색 결과가 없습니다. 다른 키워드로 검색해보세요.', 'info');
  }
}

// FAQ 토글
function toggleFAQ(element) {
  const faqItem = element.parentElement;
  const answer = faqItem.querySelector('.faq-answer');
  const toggle = element.querySelector('.faq-toggle');
  
  if (answer.style.display === 'block') {
    // 닫기
    answer.style.display = 'none';
    toggle.textContent = '+';
    faqItem.classList.remove('active');
  } else {
    // 다른 열린 FAQ 닫기 (아코디언 효과)
    document.querySelectorAll('.faq-item.active').forEach(item => {
      if (item !== faqItem) {
        item.querySelector('.faq-answer').style.display = 'none';
        item.querySelector('.faq-toggle').textContent = '+';
        item.classList.remove('active');
      }
    });
    
    // 현재 FAQ 열기
    answer.style.display = 'block';
    toggle.textContent = '−';
    faqItem.classList.add('active');
    
    // 스크롤 애니메이션
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }
}

// === 연락처 관련 함수들 ===

// 전화 걸기
function makeCall() {
  if (confirm('1588-1234로 전화를 걸까요?')) {
    // 모바일에서는 실제 전화 앱 실행
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = 'tel:1588-1234';
    } else {
      showToast('전화 앱을 실행합니다.', 'info');
    }
  }
}

// 이메일 보내기
function sendEmail() {
  const subject = encodeURIComponent('스마트파킹 문의사항');
  const body = encodeURIComponent('안녕하세요. 스마트파킹에 문의드릴 내용이 있습니다.\n\n문의내용:\n\n\n연락처:\n이름:');
  
  window.location.href = `mailto:support@smartparking.com?subject=${subject}&body=${body}`;
}

// 위치 보기
function showMap() {
  const address = '서울시 강남구 테헤란로 123';
  const encodedAddress = encodeURIComponent(address);
  
  if (confirm(`${address}\n\n지도 앱으로 연결하시겠습니까?`)) {
    // 모바일에서는 네이티브 지도 앱 실행
    if (/Android/i.test(navigator.userAgent)) {
      window.open(`geo:0,0?q=${encodedAddress}`);
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.open(`maps:0,0?q=${encodedAddress}`);
    } else {
      // 데스크톱에서는 구글 맵스 웹버전
      window.open(`https://maps.google.com/maps?q=${encodedAddress}`, '_blank');
    }
  }
}

// === 실시간 채팅 관련 함수들 ===

// 채팅 시작
function startChat() {
  const chatModal = document.getElementById('chat-modal');
  if (chatModal) {
    chatModal.style.display = 'flex';
    
    // 채팅 입력 필드에 포커스
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      setTimeout(() => chatInput.focus(), 100);
    }
    
    // 접속 알림 메시지 추가
    setTimeout(() => {
      addChatMessage('고객님이 상담을 시작했습니다.', 'system');
    }, 500);
  }
}

// 채팅 닫기
function closeChat() {
  const chatModal = document.getElementById('chat-modal');
  if (chatModal) {
    chatModal.style.display = 'none';
    
    // 채팅 기록은 유지 (실제 서비스에서는 서버에 저장)
  }
}

// 엔터키로 메시지 전송
function handleChatEnter(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendChatMessage();
  }
}

// 채팅 메시지 전송
function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  
  if (!message) {
    return;
  }
  
  // 사용자 메시지 추가
  addChatMessage(message, 'user');
  input.value = '';
  
  // 상담사 응답 시뮬레이션
  setTimeout(() => {
    generateAgentResponse(message);
  }, 1000 + Math.random() * 2000);
}

// 채팅 메시지 추가
function addChatMessage(message, sender) {
  const messagesContainer = document.getElementById('chat-messages');
  if (!messagesContainer) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;
  
  const now = new Date();
  const time = now.getHours().toString().padStart(2, '0') + ':' + 
               now.getMinutes().toString().padStart(2, '0');
  
  messageDiv.innerHTML = `
    <div class="message-content">${escapeHtml(message)}</div>
    <div class="message-time">${time}</div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 상담사 응답 생성
function generateAgentResponse(userMessage) {
  const lowerMessage = userMessage.toLowerCase();
  let response = '';
  
  // 키워드 기반 자동 응답
  if (lowerMessage.includes('예약') || lowerMessage.includes('주차')) {
    response = '주차 예약 관련 문의시군요. 구체적으로 어떤 부분이 궁금하신가요? 예약 방법, 취소, 변경 등에 대해 안내해드릴 수 있습니다.';
  } else if (lowerMessage.includes('결제') || lowerMessage.includes('요금')) {
    response = '결제 관련 문의시군요. 결제 방법, 자동결제 설정, 영수증 발급 등에 대해 도움드릴 수 있습니다. 어떤 부분이 궁금하신가요?';
  } else if (lowerMessage.includes('취소') || lowerMessage.includes('환불')) {
    response = '취소/환불 관련 문의시군요. 예약 취소는 이용 2시간 전까지 무료로 가능하며, 그 이후에는 20% 수수료가 발생합니다. 자세한 안내가 필요하시면 말씀해주세요.';
  } else if (lowerMessage.includes('안녕') || lowerMessage.includes('반갑')) {
    response = '안녕하세요! 스마트파킹 고객센터입니다. 무엇을 도와드릴까요? 😊';
  } else if (lowerMessage.includes('감사') || lowerMessage.includes('고마')) {
    response = '도움이 되어서 다행입니다! 추가로 궁금한 점이 있으시면 언제든 말씀해주세요.';
  } else {
    // 일반적인 응답
    const responses = [
      '네, 확인해드리겠습니다. 잠시만 기다려주세요.',
      '추가로 궁금한 점이 있으시면 언제든지 말씀해주세요.',
      '해당 내용은 담당 부서에 전달하여 빠른 시일 내에 답변드리겠습니다.',
      '더 자세한 안내가 필요하시면 전화(1588-1234)로 연락주시면 더 정확한 도움을 드릴 수 있습니다.',
      '도움이 되셨나요? 다른 문의사항이 있으시면 말씀해주세요.'
    ];
    response = responses[Math.floor(Math.random() * responses.length)];
  }
  
  addChatMessage(response, 'agent');
}

// === 문의하기 폼 관련 함수들 ===

// 문의 제출
function submitInquiry(event) {
  event.preventDefault();
  
  const inquiryType = document.getElementById('inquiry-type').value;
  const inquiryTitle = document.getElementById('inquiry-title').value.trim();
  const inquiryContent = document.getElementById('inquiry-content').value.trim();
  const agreeTerms = document.querySelector('.agreement-item input[type="checkbox"]').checked;
  
  // 유효성 검사
  if (!inquiryType) {
    showToast('문의 유형을 선택해주세요.', 'error');
    return;
  }
  
  if (!inquiryTitle) {
    showToast('제목을 입력해주세요.', 'error');
    return;
  }
  
  if (!inquiryContent) {
    showToast('문의 내용을 입력해주세요.', 'error');
    return;
  }
  
  if (inquiryContent.length < 10) {
    showToast('문의 내용을 10자 이상 입력해주세요.', 'error');
    return;
  }
  
  if (!agreeTerms) {
    showToast('개인정보 수집 및 이용에 동의해주세요.', 'error');
    return;
  }
  
  // 첨부파일 검사 (선택사항)
  const fileInput = document.getElementById('inquiry-file');
  if (fileInput.files.length > 3) {
    showToast('첨부파일은 최대 3개까지 업로드 가능합니다.', 'error');
    return;
  }
  
  for (let file of fileInput.files) {
    if (file.size > 5 * 1024 * 1024) { // 5MB
      showToast('첨부파일은 5MB 이하만 업로드 가능합니다.', 'error');
      return;
    }
  }
  
  showLoading('문의를 접수하는 중...');
  
  setTimeout(() => {
    hideLoading();
    const inquiryId = 'INQ' + Date.now().toString().slice(-8);
    showToast(`문의가 접수되었습니다!\n문의번호: ${inquiryId}\n\n등록하신 연락처로 답변 드리겠습니다.`, 'success');
    
    // 폼 초기화
    resetInquiryForm();
  }, 2000);
}

// 문의 폼 초기화
function resetInquiryForm() {
  const inquiryForm = document.querySelector('.inquiry-form');
  if (inquiryForm) {
    inquiryForm.reset();
  }
}

// === 기존 함수 수정 ===

// 프로필 보기 (기존 함수 수정)
function showProfile() {
  window.location.href = 'my-info.html';
}

// 고객지원 (기존 함수 수정)  
function showSupport() {
  window.location.href = 'support.html';
}

// === 유틸리티 함수들 ===

// HTML 이스케이프 (XSS 방지)
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 파일 크기 포맷팅
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 입력 필드 실시간 유효성 검사 확장
document.addEventListener('input', function(event) {
  // 기존 차량번호 검사
  if (event.target.type === 'text' && event.target.id === 'car-number') {
    const value = event.target.value;
    const pattern = /^\d{2,3}[가-힣]\d{4}$/;
    
    if (value && !pattern.test(value)) {
      event.target.style.borderColor = '#e53e3e';
    } else {
      event.target.style.borderColor = '#e2e8f0';
    }
  }
  
  // 이메일 유효성 검사
  if (event.target.type === 'email') {
    const value = event.target.value;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (value && !emailPattern.test(value)) {
      event.target.style.borderColor = '#e53e3e';
    } else {
      event.target.style.borderColor = '#e2e8f0';
    }
  }
  
  // 휴대폰 번호 자동 포맷팅
  if (event.target.type === 'tel') {
    let value = event.target.value.replace(/[^0-9]/g, '');
    
    if (value.length >= 3 && value.length <= 7) {
      value = value.replace(/(\d{3})(\d{1,4})/, '$1-$2');
    } else if (value.length >= 8) {
      value = value.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    
    event.target.value = value;
  }
});

// 모달 외부 클릭시 닫기 확장
document.addEventListener('click', function(event) {
  // 기존 detail-modal
  const detailModal = document.getElementById('detail-modal');
  if (event.target === detailModal) {
    closeModal();
  }
  
  // 채팅 모달
  const chatModal = document.getElementById('chat-modal');
  if (event.target === chatModal) {
    closeChat();
  }
});

// ESC 키 이벤트 확장
document.addEventListener('keydown', function(event) {
  if (event.key === 'Escape') {
    // 기존 모달 닫기
    closeModal();
    
    // 채팅 모달 닫기
    closeChat();
    
    // 차량 폼 닫기
    cancelVehicleForm();
  }
});

// FAQ 검색 엔터키 지원
document.addEventListener('keydown', function(event) {
  if (event.target.id === 'faq-search' && event.key === 'Enter') {
    searchFAQ();
  }
});

console.log('추가 기능 스크립트가 로드되었습니다. ⚙️🎧');

// ===== 실시간 주차장 현황 관련 함수들 =====

// 주차장 현황 데이터
let parkingData = {
  A: { available: 15, total: 50 },
  B: { available: 8, total: 60 },
  C: { available: 25, total: 40 }
};

// 가용률 계산
function calculateAvailabilityRate(available, total) {
  return Math.round((available / total) * 100);
}

// 주차장 현황 업데이트
function updateParkingStatus() {
  Object.keys(parkingData).forEach((zone, index) => {
    const data = parkingData[zone];
    const rate = calculateAvailabilityRate(data.available, data.total);
    
    // DOM 요소 찾기
    const zoneElement = document.querySelectorAll('.zone-status')[index];
    if (zoneElement) {
      const availableElement = zoneElement.querySelector('.available');
      const totalElement = zoneElement.querySelector('.total');
      const rateElement = zoneElement.querySelector('.zone-rate');
      const progressElement = zoneElement.querySelector('.rate-progress');
      
      // 애니메이션 효과
      zoneElement.classList.add('updating');
      
      setTimeout(() => {
        // 값 업데이트
        if (availableElement) availableElement.textContent = data.available;
        if (totalElement) totalElement.textContent = data.total;
        if (rateElement) {
          rateElement.innerHTML = `가용률: ${rate}%<div class="rate-progress"></div>`;
        }
        
        // 진행 바 업데이트
        const newProgressElement = zoneElement.querySelector('.rate-progress');
        if (newProgressElement) {
          newProgressElement.style.setProperty('--progress', `${rate}%`);
        }
        
        // 가용률에 따른 색상 변경
        updateZoneColor(zoneElement, rate);
        
        // 애니메이션 제거
        zoneElement.classList.remove('updating');
      }, 500);
    }
  });
}

// 가용률에 따른 구역 색상 업데이트
function updateZoneColor(zoneElement, rate) {
  // 기존 상태 클래스 제거
  zoneElement.classList.remove('low-availability', 'medium-availability', 'high-availability');
  
  // 가용률에 따른 클래스 추가
  if (rate < 20) {
    zoneElement.classList.add('low-availability');
  } else if (rate < 50) {
    zoneElement.classList.add('medium-availability');
  } else {
    zoneElement.classList.add('high-availability');
  }
}

// 랜덤 주차장 현황 시뮬레이션
function simulateParkingUpdate() {
  Object.keys(parkingData).forEach(zone => {
    const data = parkingData[zone];
    const change = Math.floor(Math.random() * 6) - 3; // -3 ~ +3 변화
    
    // 범위 내에서만 변경
    const newAvailable = Math.max(0, Math.min(data.total, data.available + change));
    parkingData[zone].available = newAvailable;
  });
  
  updateParkingStatus();
}



// 특정 구역 클릭 시 상세 정보 표시
function showZoneDetails(zoneLetter, available, total) {
  const rate = calculateAvailabilityRate(available, total);
  const status = rate < 20 ? '매우 혼잡' : rate < 50 ? '보통' : '여유';
  
  const details = `
${zoneLetter}구역 상세 정보

📊 현재 상황:
• 사용 가능: ${available}대
• 전체 주차면: ${total}대
• 가용률: ${rate}%
• 상태: ${status}

📍 구역 특징:
${getZoneDescription(zoneLetter)}

💡 추천: ${getRecommendation(rate)}
  `;
  
  alert(details);
}

// 구역별 설명
function getZoneDescription(zone) {
  const descriptions = {
    A: '• 입구와 가장 가까운 위치\n• 짧은 주차에 적합\n• 접근성이 우수',
    B: '• 주차장 중앙 위치\n• 안정적인 주차 공간\n• 적당한 접근성',
    C: '• 지하 주차장\n• 장시간 주차에 적합\n• 날씨의 영향 없음'
  };
  return descriptions[zone] || '정보 없음';
}

// 가용률에 따른 추천사항
function getRecommendation(rate) {
  if (rate < 20) {
    return '다른 구역을 추천합니다';
  } else if (rate < 50) {
    return '빠른 예약을 권장합니다';
  } else {
    return '충분한 주차 공간이 있습니다';
  }
}

// 주차장 현황 새로고침
function refreshParkingStatus() {
  showToast('주차장 현황을 업데이트합니다...', 'info');
  
  // 로딩 효과
  document.querySelectorAll('.zone-status').forEach(zone => {
    zone.classList.add('updating');
  });
  
  setTimeout(() => {
    simulateParkingUpdate();
    showToast('주차장 현황이 업데이트되었습니다', 'success');
  }, 1000);
}

// 예약 시 추천 구역 표시
function getRecommendedZone() {
  let bestZone = null;
  let bestRate = 0;
  
  Object.keys(parkingData).forEach(zone => {
    const data = parkingData[zone];
    const rate = calculateAvailabilityRate(data.available, data.total);
    
    if (rate > bestRate) {
      bestRate = rate;
      bestZone = zone;
    }
  });
  
  return { zone: bestZone, rate: bestRate };
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  // 기존 초기화 함수들 호출
  if (typeof initializePage === 'function') {
    initializePage();
  }
  
  // 주차장 현황 초기 업데이트
  updateParkingStatus();
  
  // 구역 클릭 이벤트 추가
  document.querySelectorAll('.zone-status').forEach((zoneElement, index) => {
    const zones = ['A', 'B', 'C'];
    const zone = zones[index];
    
    zoneElement.addEventListener('click', () => {
      const data = parkingData[zone];
      showZoneDetails(zone, data.available, data.total);
    });
    
    // 호버 효과를 위한 커서 스타일
    zoneElement.style.cursor = 'pointer';
  });
  
  // 5분마다 자동 업데이트
  setInterval(simulateParkingUpdate, 300000); // 5분 = 300000ms
  
  // 새로고침 버튼이 있다면 이벤트 추가
  const refreshBtn = document.getElementById('refresh-parking');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshParkingStatus);
  }
});

// 예약 폼에서 구역 선호도 자동 추천
function autoRecommendZone() {
  const recommended = getRecommendedZone();
  const zoneSelect = document.getElementById('zone-preference');
  
  if (zoneSelect && recommended.zone) {
    // 추천 구역으로 자동 선택
    zoneSelect.value = recommended.zone;
    
    // 사용자에게 알림
    showToast(`${recommended.zone}구역을 추천합니다 (가용률: ${recommended.rate}%)`, 'info');
  }
}

// 실시간 알림 기능
function checkLowAvailability() {
  Object.keys(parkingData).forEach(zone => {
    const data = parkingData[zone];
    const rate = calculateAvailabilityRate(data.available, data.total);
    
    if (rate < 10) {
      showToast(`⚠️ ${zone}구역 주차공간이 부족합니다 (${rate}%)`, 'warning');
    }
  });
}

// 주차 예측 기능 (간단한 시간 기반)
function predictParkingTrend() {
  const currentHour = new Date().getHours();
  let prediction = '';
  
  if (currentHour >= 7 && currentHour <= 9) {
    prediction = '출근 시간대로 주차공간이 빠르게 감소할 예정입니다';
  } else if (currentHour >= 17 && currentHour <= 19) {
    prediction = '퇴근 시간대로 주차공간이 점진적으로 증가할 예정입니다';
  } else if (currentHour >= 12 && currentHour <= 14) {
    prediction = '점심시간으로 일시적으로 혼잡할 수 있습니다';
  } else {
    prediction = '비교적 안정적인 주차 상황이 예상됩니다';
  }
  
  return prediction;
}

console.log('실시간 주차장 현황 스크립트가 로드되었습니다. 🚗📊');

function logout() {
  if (confirm('로그아웃 하시겠습니까?')) {
    document.getElementById('logoutForm').submit();
  }
}


