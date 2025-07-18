// ========================================
// 청구 및 결제 (payment.js)
// ========================================

let paymentUpdateInterval = null;
let appliedCoupons = []; // 적용된 쿠폰 목록
let paymentMethods = []; // 등록된 결제수단 목록

// ========================================
// 초기화
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('💳 결제 모듈 로드됨');

  // 공통 라이브러리 초기화
  if (!initializeCommon()) {
    return;
  }

  // 결제 페이지 초기화
  initializePaymentPage();

  console.log('✅ 결제 페이지 초기화 완료');
});

function initializePaymentPage() {
  // 결제 체크박스 이벤트
  const billCheckboxes = document.querySelectorAll('.bill-checkbox');
  billCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updatePaymentSummary);
  });

  // 자동결제 체크박스 이벤트
  const autoPayCheckbox = document.getElementById('auto-pay');
  if (autoPayCheckbox) {
    autoPayCheckbox.addEventListener('change', toggleAutoPaymentSettings);
  }

  // 포인트 사용 체크박스 이벤트
  const usePointsCheckbox = document.getElementById('use-points');
  if (usePointsCheckbox) {
    usePointsCheckbox.addEventListener('change', updatePaymentSummary);
  }

  // 초기 데이터 로드
  loadInitialPaymentData();

  // 실시간 업데이트 시작 (결제 상태 확인)
  startPaymentUpdates();
}

// ========================================
// 초기 데이터 로드
// ========================================
async function loadInitialPaymentData() {
  showLoading('결제 정보를 불러오는 중...');

  try {
    await Promise.all([
      loadUnpaidBills(),
      loadPaymentMethods(),
      loadAvailableCoupons(),
      loadUserAccountInfo()
    ]);

    hideLoading();
    updatePaymentSummary();

  } catch (error) {
    hideLoading();
    console.error('❌ 초기 결제 데이터 로드 실패:', error);
    showToast('결제 정보를 불러오는데 실패했습니다.', 'error');
  }
}

// ========================================
// 미결제 UI 렌더링만 담당 (데이터는 외부에서 주입)
// ========================================
function renderUnpaidBills(bills = [], page = 1) {
  const container = document.querySelector('.bills-list, .unpaid-bills');
  if (!container) {
    console.warn('⚠️ .bills-list 또는 .unpaid-bills 요소가 없습니다.');
    return;
  }

  // 첫 페이지면 기존 목록 제거
  if (page === 1) {
    container.querySelectorAll('.bill-item, .empty-message').forEach(el => el.remove());
  }

  // 렌더링
  if (Array.isArray(bills) && bills.length > 0) {
    bills.forEach(bill => {
      const item = createBillItem(bill);
      if (item) {
        container.appendChild(item);
      }
    });

    // 체크박스 이벤트 연결
    const checkboxes = container.querySelectorAll('.bill-checkbox:not([data-initialized])');
    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', updatePaymentSummary);
      checkbox.setAttribute('data-initialized', 'true');
    });

  } else if (page === 1) {
    // 미결제 없음 메시지
    const empty = document.createElement('div');
    empty.className = 'empty-message';
    empty.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #64748b;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
        <p>미결제 내역이 없습니다.</p>
      </div>
    `;
    container.appendChild(empty);
  }
}



function createBillItem(bill) {
  const item = document.createElement('div');
  item.className = 'bill-item';
  item.setAttribute('data-bill-id', bill.billId);

  const dueDate = new Date(bill.dueDate);
  const isOverdue = dueDate < new Date();
  const urgencyClass = isOverdue ? 'overdue' :
      (dueDate.getTime() - new Date().getTime()) < (3 * 24 * 60 * 60 * 1000) ? 'urgent' : '';

  item.innerHTML = `
    <div class="bill-checkbox-container">
      <input type="checkbox" class="bill-checkbox" value="${bill.billId}" data-amount="${bill.amount}" />
    </div>
    <div class="bill-info">
      <div class="bill-header">
        <span class="bill-type ${bill.type?.toLowerCase()}">${getBillTypeText(bill.type)}</span>
        <span class="bill-date">${formatDate(bill.usageDate)}</span>
        ${isOverdue ? '<span class="overdue-badge">연체</span>' : ''}
        ${urgencyClass === 'urgent' ? '<span class="urgent-badge">임박</span>' : ''}
      </div>
      <div class="bill-details">
        <div class="bill-location">📍 ${escapeHtml(bill.parkingSpot || '-')}</div>
        <div class="bill-duration">⏱️ ${escapeHtml(bill.duration || '-')}</div>
        <div class="bill-vehicle">🚗 ${escapeHtml(bill.carNumber || '-')}</div>
      </div>
      ${bill.penaltyFee ? `<div class="penalty-notice">연체료: ₩${bill.penaltyFee.toLocaleString()}</div>` : ''}
    </div>
    <div class="bill-amount-section">
      <div class="bill-amount ${urgencyClass}">₩${bill.amount.toLocaleString()}</div>
      ${bill.originalAmount && bill.originalAmount !== bill.amount ?
      `<div class="original-amount">원금: ₩${bill.originalAmount.toLocaleString()}</div>` : ''
  }
    </div>
    <div class="bill-due">
      <span class="due-label">결제 기한</span>
      <span class="due-date ${urgencyClass}">${formatDate(bill.dueDate)}</span>
    </div>
  `;

  return item;
}

function getBillTypeText(type) {
  const typeMap = {
    'parking': '주차 요금',
    'penalty': '과태료',
    'monthly': '월주차',
    'hourly': '시간주차',
    'daily': '일주차'
  };
  return typeMap[type] || type;
}

// ========================================
// 결제 수단 로드
// ========================================
async function loadPaymentMethods() {
  console.log('💳 결제 수단 로드 중...');

  try {
    const data = await apiRequest('/api/payment/methods');
    if (!data) return false;

    paymentMethods = data.methods || [];
    renderPaymentMethods(paymentMethods);

    console.log('✅ 결제 수단 로드 완료', { count: paymentMethods.length });
    return true;
  } catch (error) {
    console.error('❌ 결제 수단 로드 실패:', error);
    return false;
  }
}

function renderPaymentMethods(methods) {
  const container = document.getElementById('payment-methods-container');
  if (!container) return;

  container.innerHTML = '';

  if (methods && methods.length > 0) {
    methods.forEach((method, index) => {
      const methodElement = document.createElement('label');
      methodElement.className = 'payment-method-option';
      methodElement.innerHTML = `
        <input type="radio" name="payment-method" value="${method.id}" ${index === 0 ? 'checked' : ''}>
        <div class="method-info">
          <div class="method-type">${getPaymentMethodIcon(method.type)} ${method.name}</div>
          <div class="method-details">${method.details}</div>
        </div>
      `;
      container.appendChild(methodElement);
    });
  } else {
    container.innerHTML = `
      <div class="no-payment-methods">
        <p>등록된 결제 수단이 없습니다.</p>
        <button onclick="addPaymentMethod()" class="btn-add-method">결제 수단 추가</button>
      </div>
    `;
  }
}

function getPaymentMethodIcon(type) {
  const icons = {
    'card': '💳',
    'bank': '🏦',
    'mobile': '📱',
    'point': '🎯'
  };
  return icons[type] || '💳';
}

// ========================================
// 사용 가능한 쿠폰 로드
// ========================================
async function loadAvailableCoupons() {
  console.log('🎫 사용 가능한 쿠폰 로드 중...');

  try {
    const data = await apiRequest('/api/payment/coupons/available');
    if (!data) return false;

    renderAvailableCoupons(data.coupons || []);

    console.log('✅ 사용 가능한 쿠폰 로드 완료', { count: data.coupons?.length || 0 });
    return true;
  } catch (error) {
    console.error('❌ 쿠폰 로드 실패:', error);
    return false;
  }
}

function renderAvailableCoupons(coupons) {
  const container = document.getElementById('available-coupons');
  if (!container) return;

  container.innerHTML = '';

  if (coupons && coupons.length > 0) {
    coupons.forEach(coupon => {
      const couponElement = document.createElement('div');
      couponElement.className = 'coupon-item';
      couponElement.innerHTML = `
        <div class="coupon-info">
          <div class="coupon-name">${escapeHtml(coupon.name)}</div>
          <div class="coupon-discount">${coupon.discountType === 'rate' ? coupon.discountValue + '%' : '₩' + coupon.discountValue.toLocaleString()} 할인</div>
          <div class="coupon-expire">~${formatDate(coupon.expireDate)}</div>
        </div>
        <button onclick="useCoupon('${coupon.code}')" class="btn-use-coupon">사용</button>
      `;
      container.appendChild(couponElement);
    });
  } else {
    container.innerHTML = '<p class="no-coupons">사용 가능한 쿠폰이 없습니다.</p>';
  }
}

// ========================================
// 사용자 계정 정보 로드
// ========================================
async function loadUserAccountInfo() {
  console.log('👤 사용자 계정 정보 로드 중...');

  try {
    const data = await apiRequest('/api/payment/account-info');
    if (!data) return false;

    // 포인트 잔액 업데이트
    updateElement('available-points', data.point?.toLocaleString() + 'P');
    updateElement('prepaid-balance', '₩' + data.prepaidBalance?.toLocaleString());

    // 포인트 사용 옵션 표시/숨김
    const usePointsContainer = document.getElementById('use-points-container');
    if (usePointsContainer) {
      usePointsContainer.style.display = data.point > 0 ? 'block' : 'none';
    }

    console.log('✅ 사용자 계정 정보 로드 완료');
    return true;
  } catch (error) {
    console.error('❌ 사용자 계정 정보 로드 실패:', error);
    return false;
  }
}

// ========================================
// 결제 요약 업데이트
// ========================================
function updatePaymentSummary() {
  const checkedBoxes = document.querySelectorAll('.bill-checkbox:checked');
  const count = checkedBoxes.length;

  let totalAmount = 0;
  checkedBoxes.forEach(checkbox => {
    const amount = parseInt(checkbox.getAttribute('data-amount')) || 0;
    totalAmount += amount;
  });

  // 쿠폰 할인 계산
  let couponDiscount = 0;
  appliedCoupons.forEach(coupon => {
    if (coupon.discountType === 'rate') {
      couponDiscount += Math.floor(totalAmount * (coupon.discountValue / 100));
    } else {
      couponDiscount += coupon.discountValue;
    }
  });

  // 멤버십 할인 계산
  const membershipDiscountRate = getMembershipDiscountRate();
  const membershipDiscount = Math.floor(totalAmount * membershipDiscountRate);

  // 포인트 사용 계산
  let pointsToUse = 0;
  const usePointsCheckbox = document.getElementById('use-points');
  if (usePointsCheckbox && usePointsCheckbox.checked) {
    const availablePoints = parseInt(document.getElementById('available-points')?.textContent.replace(/[P,]/g, '')) || 0;
    const maxPointsUsable = Math.min(availablePoints, totalAmount - couponDiscount - membershipDiscount);
    pointsToUse = Math.max(0, maxPointsUsable);
  }

  const totalDiscount = couponDiscount + membershipDiscount + pointsToUse;
  const finalAmount = Math.max(0, totalAmount - totalDiscount);

  // UI 업데이트
  updateElement('selected-count', count + '건');
  updateElement('selected-amount', '₩' + totalAmount.toLocaleString());
  updateElement('coupon-discount', couponDiscount > 0 ? '-₩' + couponDiscount.toLocaleString() : '');
  updateElement('membership-discount', membershipDiscount > 0 ? '-₩' + membershipDiscount.toLocaleString() : '');
  updateElement('points-discount', pointsToUse > 0 ? '-' + pointsToUse.toLocaleString() + 'P' : '');
  updateElement('total-discount', totalDiscount > 0 ? '-₩' + totalDiscount.toLocaleString() : '');
  updateElement('total-amount', '₩' + finalAmount.toLocaleString());
  updateElement('pay-btn-amount', '₩' + finalAmount.toLocaleString());

  // 할인 항목들 표시/숨김
  toggleDiscountRows(couponDiscount, membershipDiscount, pointsToUse);

  // 결제 버튼 상태
  const payButton = document.getElementById('pay-button');
  if (payButton) {
    payButton.disabled = finalAmount === 0 || count === 0;
    payButton.style.opacity = (finalAmount === 0 || count === 0) ? '0.5' : '1';
  }
}

function toggleDiscountRows(couponDiscount, membershipDiscount, pointsToUse) {
  const couponRow = document.getElementById('coupon-discount-row');
  const membershipRow = document.getElementById('membership-discount-row');
  const pointsRow = document.getElementById('points-discount-row');

  if (couponRow) couponRow.style.display = couponDiscount > 0 ? 'flex' : 'none';
  if (membershipRow) membershipRow.style.display = membershipDiscount > 0 ? 'flex' : 'none';
  if (pointsRow) pointsRow.style.display = pointsToUse > 0 ? 'flex' : 'none';
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
// 전체 선택/해제
// ========================================
function selectAllBills() {
  const checkboxes = document.querySelectorAll('.bill-checkbox');
  const selectAllBtn = event.target;

  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
  });

  selectAllBtn.style.background = '#10b981';
  selectAllBtn.textContent = '전체 해제';
  selectAllBtn.setAttribute('onclick', 'deselectAllBills()');

  updatePaymentSummary();
}

function deselectAllBills() {
  const checkboxes = document.querySelectorAll('.bill-checkbox');
  const selectAllBtn = event.target;

  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });

  selectAllBtn.style.background = '#3b82f6';
  selectAllBtn.textContent = '전체 선택';
  selectAllBtn.setAttribute('onclick', 'selectAllBills()');

  updatePaymentSummary();
}

// ========================================
// 쿠폰 적용 (API 연동)
// ========================================
async function applyCoupon() {
  const couponCode = document.getElementById('coupon-code')?.value.trim().toUpperCase();
  if (!couponCode) {
    showToast('쿠폰 코드를 입력해주세요.', 'error');
    return;
  }

  // 이미 적용된 쿠폰인지 확인
  if (appliedCoupons.find(c => c.code === couponCode)) {
    showToast('이미 적용된 쿠폰입니다.', 'warning');
    return;
  }

  showLoading('쿠폰을 확인하는 중...');

  try {
    const response = await apiRequest('/api/payment/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({
        couponCode: couponCode,
        billIds: getSelectedBillIds(),
        totalAmount: getSelectedTotalAmount()
      })
    });

    hideLoading();

    if (response && response.valid) {
      applyCouponDiscount(response.coupon);
      showToast(`쿠폰이 적용되었습니다!\n${response.coupon.name}`, 'success');

      // 쿠폰 입력 필드 초기화
      document.getElementById('coupon-code').value = '';

    } else {
      showToast(response?.message || '유효하지 않은 쿠폰 코드입니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 쿠폰 검증 실패:', error);
    showToast('쿠폰 검증 중 오류가 발생했습니다.', 'error');
  }
}

async function useCoupon(couponCode) {
  // 이미 적용된 쿠폰인지 확인
  if (appliedCoupons.find(c => c.code === couponCode)) {
    showToast('이미 적용된 쿠폰입니다.', 'warning');
    return;
  }

  showLoading('쿠폰을 적용하는 중...');

  try {
    const response = await apiRequest('/api/payment/coupons/apply', {
      method: 'POST',
      body: JSON.stringify({
        couponCode: couponCode,
        billIds: getSelectedBillIds(),
        totalAmount: getSelectedTotalAmount()
      })
    });

    hideLoading();

    if (response && response.success) {
      applyCouponDiscount(response.coupon);
      showToast(`쿠폰이 적용되었습니다!\n${response.coupon.name}`, 'success');
    } else {
      showToast(response?.message || '쿠폰 적용에 실패했습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 쿠폰 적용 실패:', error);
    showToast('쿠폰 적용 중 오류가 발생했습니다.', 'error');
  }
}

function applyCouponDiscount(coupon) {
  // 적용된 쿠폰 목록에 추가
  appliedCoupons.push(coupon);

  // 적용된 쿠폰 UI 업데이트
  renderAppliedCoupons();

  // 결제 요약 업데이트
  updatePaymentSummary();
}

function renderAppliedCoupons() {
  const container = document.getElementById('applied-coupons');
  if (!container) return;

  container.innerHTML = '';

  appliedCoupons.forEach((coupon, index) => {
    const couponElement = document.createElement('div');
    couponElement.className = 'applied-coupon-item';
    couponElement.innerHTML = `
      <div class="coupon-info">
        <span class="coupon-name">${escapeHtml(coupon.name)}</span>
        <span class="coupon-discount">
          ${coupon.discountType === 'rate' ? coupon.discountValue + '%' : '₩' + coupon.discountValue.toLocaleString()} 할인
        </span>
      </div>
      <button onclick="removeCoupon(${index})" class="btn-remove-coupon">×</button>
    `;
    container.appendChild(couponElement);
  });

  container.style.display = appliedCoupons.length > 0 ? 'block' : 'none';
}

function removeCoupon(index) {
  appliedCoupons.splice(index, 1);
  renderAppliedCoupons();
  updatePaymentSummary();
  showToast('쿠폰이 제거되었습니다.', 'info');
}

// ========================================
// 유틸리티 함수들
// ========================================
function getSelectedBillIds() {
  const checkedBoxes = document.querySelectorAll('.bill-checkbox:checked');
  return Array.from(checkedBoxes).map(checkbox => checkbox.value);
}

function getSelectedTotalAmount() {
  const checkedBoxes = document.querySelectorAll('.bill-checkbox:checked');
  let total = 0;
  checkedBoxes.forEach(checkbox => {
    total += parseInt(checkbox.getAttribute('data-amount')) || 0;
  });
  return total;
}

// ========================================
// 자동결제 설정
// ========================================
async function toggleAutoPaymentSettings() {
  const autoSettings = document.getElementById('auto-settings');
  const checkbox = document.getElementById('auto-pay');

  if (autoSettings) {
    autoSettings.style.display = checkbox.checked ? 'block' : 'none';

    if (checkbox.checked) {
      // 자동결제 설정 저장
      await saveAutoPaymentSettings(true);
      showToast('자동결제가 활성화되었습니다.', 'info');
    } else {
      await saveAutoPaymentSettings(false);
      showToast('자동결제가 비활성화되었습니다.', 'info');
    }
  }
}

async function saveAutoPaymentSettings(enabled) {
  try {
    const settings = {
      enabled: enabled,
      paymentMethod: getSelectedPaymentMethod(),
      maxAmount: document.getElementById('auto-max-amount')?.value || 100000
    };

    await apiRequest('/api/payment/auto-payment/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });

    console.log('✅ 자동결제 설정 저장 완료');
  } catch (error) {
    console.error('❌ 자동결제 설정 저장 실패:', error);
  }
}

// ========================================
// 결제 처리
// ========================================
async function processPayment() {
  const checkedBoxes = document.querySelectorAll('.bill-checkbox:checked');

  if (checkedBoxes.length === 0) {
    showToast('결제할 항목을 선택해주세요.', 'warning');
    return;
  }

  const billIds = getSelectedBillIds();
  const totalAmount = parseInt(document.getElementById('total-amount').textContent.replace(/[₩,]/g, ''));
  const selectedPaymentMethod = getSelectedPaymentMethod();

  if (!selectedPaymentMethod) {
    showToast('결제 수단을 선택해주세요.', 'warning');
    return;
  }

  const paymentData = {
    billIds: billIds,
    amount: totalAmount,
    paymentMethod: selectedPaymentMethod,
    useAutoPayment: document.getElementById('auto-pay')?.checked || false,
    appliedCoupons: appliedCoupons,
    usePoints: document.getElementById('use-points')?.checked || false
  };

  // 결제 확인
  if (!confirm(`₩${totalAmount.toLocaleString()}을(를) 결제하시겠습니까?`)) {
    return;
  }

  showLoading('결제를 처리중입니다...');

  try {
    const response = await apiRequest('/api/payments', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });

    if (response && response.success) {
      hideLoading();
      showToast('결제가 완료되었습니다.', 'success');

      // 결제 완료 처리
      await handlePaymentSuccess(response);
    } else {
      hideLoading();
      showToast(response?.message || '결제 처리에 실패했습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 결제 처리 실패:', error);
    showToast('결제 처리 중 오류가 발생했습니다.', 'error');
  }
}

function getSelectedPaymentMethod() {
  const selectedMethod = document.querySelector('input[name="payment-method"]:checked');
  return selectedMethod ? selectedMethod.value : null;
}

async function handlePaymentSuccess(response) {
  // 결제 완료된 항목들 제거
  const checkedBoxes = document.querySelectorAll('.bill-checkbox:checked');
  checkedBoxes.forEach(checkbox => {
    const billItem = checkbox.closest('.bill-item');
    if (billItem) {
      billItem.remove();
    }
  });

  // 적용된 쿠폰 초기화
  appliedCoupons = [];
  renderAppliedCoupons();

  // 결제 요약 초기화
  updatePaymentSummary();

  // 사용자 계정 정보 새로고침
  await loadUserAccountInfo();

  // 결제 내역이 있는 페이지라면 새로고침
  if (window.loadPaymentHistory) {
    await loadPaymentHistory();
  }

  // 성공 메시지와 함께 리다이렉트 옵션 제공
  setTimeout(() => {
    if (confirm('결제가 완료되었습니다.\n결제 내역을 확인하시겠습니까?')) {
      window.location.href = '/customer/records?tab=payment';
    }
  }, 2000);
}

// ========================================
// 결제 내역 로드 (페이지네이션 지원)
// ========================================
async function loadPaymentHistory(page = 1, limit = 20, filters = {}) {
  console.log('💳 결제 내역 로드 중...', { page, limit, filters });

  try {
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });

    const data = await apiRequest(`/api/payment/history?${queryParams.toString()}`);
    if (!data) return false;

    const historyContainer = document.querySelector('.payment-history, .payments-list');
    if (!historyContainer) return false;

    // 기존 목록 클리어 (첫 페이지일 때만)
    if (page === 1) {
      const existingItems = historyContainer.querySelectorAll('.payment-item');
      existingItems.forEach(item => item.remove());
    }

    // 새 목록 추가
    if (data.payments && data.payments.length > 0) {
      data.payments.forEach(payment => {
        const item = createPaymentItem(payment);
        historyContainer.appendChild(item);
      });
    } else if (page === 1) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #64748b;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">💳</div>
          <p>결제 내역이 없습니다.</p>
        </div>
      `;
      historyContainer.appendChild(emptyMessage);
    }

    // 페이지네이션 정보 업데이트
    updatePaymentPagination(data.pagination || {});

    console.log('✅ 결제 내역 로드 완료', {
      totalPayments: data.payments?.length || 0,
      currentPage: page
    });

    return true;
  } catch (error) {
    console.error('❌ 결제 내역 로드 실패:', error);
    showErrorMessage('결제 내역을 불러오는데 실패했습니다.');
    return false;
  }
}

function createPaymentItem(payment) {
  const item = document.createElement('div');
  item.className = 'payment-item';

  const statusClass = payment.status.toLowerCase();
  const statusText = getPaymentStatusText(payment.status);

  item.innerHTML = `
    <div class="payment-header">
      <div class="payment-id">결제번호: ${payment.paymentId}</div>
      <div class="payment-status status-${statusClass}">${statusText}</div>
    </div>
    <div class="payment-details">
      <div class="detail-row">
        <span>결제일시:</span>
        <span>${formatDateTime(payment.paymentDate)}</span>
      </div>
      <div class="detail-row">
        <span>결제수단:</span>
        <span>${getPaymentMethodText(payment.paymentMethod)}</span>
      </div>
      <div class="detail-row">
        <span>결제금액:</span>
        <span>₩${payment.amount.toLocaleString()}</span>
      </div>
      ${payment.discountAmount > 0 ? `
        <div class="detail-row">
          <span>할인금액:</span>
          <span class="discount-amount">-₩${payment.discountAmount.toLocaleString()}</span>
        </div>
      ` : ''}
      ${payment.pointsUsed > 0 ? `
        <div class="detail-row">
          <span>포인트 사용:</span>
          <span class="points-used">-${payment.pointsUsed.toLocaleString()}P</span>
        </div>
      ` : ''}
    </div>
    <div class="payment-actions">
      <button onclick="showPaymentDetail('${payment.paymentId}')" class="btn-detail">상세</button>
      ${payment.status === 'COMPLETED' ?
      `<button onclick="downloadReceipt('${payment.paymentId}')" class="btn-receipt">영수증</button>` :
      ''
  }
      ${payment.status === 'COMPLETED' && payment.refundable ?
      `<button onclick="requestRefund('${payment.paymentId}')" class="btn-refund">환불요청</button>` :
      ''
  }
    </div>
  `;

  return item;
}

function getPaymentStatusText(status) {
  const statusMap = {
    'COMPLETED': '완료',
    'FAILED': '실패',
    'PENDING': '처리중',
    'CANCELLED': '취소',
    'REFUNDED': '환불'
  };
  return statusMap[status] || status;
}

function getPaymentMethodText(method) {
  const methodMap = {
    'card': '신용카드',
    'bank': '계좌이체',
    'mobile': '모바일결제',
    'point': '포인트',
    'prepaid': '선불결제'
  };
  return methodMap[method] || method;
}

// ========================================
// 결제 상세 보기
// ========================================
async function showPaymentDetail(paymentId) {
  showLoading('결제 상세 정보를 불러오는 중...');

  try {
    const data = await apiRequest(`/api/payment/detail/${paymentId}`);

    if (data) {
      hideLoading();
      renderPaymentDetailModal(data);
    } else {
      hideLoading();
      showToast('결제 상세 정보를 불러올 수 없습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 결제 상세 조회 실패:', error);
    showToast('결제 상세 정보 조회에 실패했습니다.', 'error');
  }
}

function renderPaymentDetailModal(paymentData) {
  // 모달 생성 로직 (간단한 alert로 대체)
  const details = `
결제번호: ${paymentData.paymentId}
결제일시: ${paymentData.paymentDate}
결제금액: ₩${paymentData.amount.toLocaleString()}
결제수단: ${paymentData.paymentMethod}
상태: ${getPaymentStatusText(paymentData.status)}

${paymentData.bills ? '결제 항목:\n' + paymentData.bills.map(bill =>
      `- ${bill.type}: ₩${bill.amount.toLocaleString()}`
  ).join('\n') : ''}
  `;

  alert(details);
}

// ========================================
// 영수증 다운로드
// ========================================
async function downloadReceipt(paymentId) {
  showLoading('영수증을 생성하는 중...');

  try {
    const response = await apiRequest(`/api/payment/receipt/${paymentId}`, {
      method: 'GET',
      responseType: 'blob'
    });

    if (response) {
      hideLoading();

      // 영수증 다운로드
      const filename = `영수증_${paymentId}_${new Date().toISOString().split('T')[0]}.pdf`;
      downloadFile(response, filename);

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

function downloadFile(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// ========================================
// 환불 요청
// ========================================
async function requestRefund(paymentId) {
  const reason = prompt('환불 사유를 입력해주세요:');
  if (!reason) return;

  if (!confirm('환불을 요청하시겠습니까?\n환불 처리까지 3-5일 소요될 수 있습니다.')) {
    return;
  }

  showLoading('환불을 요청하는 중...');

  try {
    const response = await apiRequest(`/api/payment/refund/${paymentId}`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason })
    });

    if (response && response.success) {
      hideLoading();
      showToast('환불 요청이 접수되었습니다.', 'success');

      // 결제 내역 새로고침
      await loadPaymentHistory();
    } else {
      hideLoading();
      showToast(response?.message || '환불 요청에 실패했습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 환불 요청 실패:', error);
    showToast('환불 요청 중 오류가 발생했습니다.', 'error');
  }
}

// ========================================
// 잔액 충전
// ========================================
async function chargeBalance() {
  const amount = document.getElementById('charge-amount')?.value;

  if (!amount || amount < 10000) {
    showToast('충전 금액은 최소 10,000원 이상이어야 합니다.', 'error');
    return;
  }

  const selectedMethod = getSelectedPaymentMethod();
  if (!selectedMethod) {
    showToast('결제 수단을 선택해주세요.', 'warning');
    return;
  }

  if (!confirm(`₩${parseInt(amount).toLocaleString()}을(를) 충전하시겠습니까?`)) {
    return;
  }

  showLoading('충전을 처리중입니다...');

  try {
    const response = await apiRequest('/api/payment/charge', {
      method: 'POST',
      body: JSON.stringify({
        amount: parseInt(amount),
        paymentMethod: selectedMethod
      })
    });

    if (response && response.success) {
      hideLoading();
      showToast('충전이 완료되었습니다.', 'success');

      // 잔액 정보 새로고침
      await loadUserAccountInfo();

      // 충전 폼 초기화
      document.getElementById('charge-amount').value = '';
    } else {
      hideLoading();
      showToast(response?.message || '충전에 실패했습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 충전 처리 실패:', error);
    showToast('충전 처리 중 오류가 발생했습니다.', 'error');
  }
}

// ========================================
// 결제 수단 관리
// ========================================
async function addPaymentMethod() {
  // 결제 수단 추가 페이지로 이동하거나 모달 표시
  window.location.href = '/customer/payment-methods/add';
}

async function removePaymentMethod(methodId) {
  if (!confirm('이 결제 수단을 삭제하시겠습니까?')) {
    return;
  }

  showLoading('결제 수단을 삭제하는 중...');

  try {
    const response = await apiRequest(`/api/payment/methods/${methodId}`, {
      method: 'DELETE'
    });

    if (response && response.success) {
      hideLoading();
      showToast('결제 수단이 삭제되었습니다.', 'success');

      // 결제 수단 목록 새로고침
      await loadPaymentMethods();
    } else {
      hideLoading();
      showToast('결제 수단 삭제에 실패했습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 결제 수단 삭제 실패:', error);
    showToast('결제 수단 삭제 중 오류가 발생했습니다.', 'error');
  }
}

// ========================================
// 페이지네이션 처리
// ========================================
function updateBillsPagination(pagination) {
  updatePaginationControls('bills', pagination, loadUnpaidBills);
}

function updatePaymentPagination(pagination) {
  updatePaginationControls('payment', pagination, loadPaymentHistory);
}

function updatePaginationControls(type, pagination, loadFunction) {
  const { currentPage = 1, totalPages = 1, totalCount = 0 } = pagination;

  // 페이지 정보 업데이트
  const pageInfo = document.getElementById(`${type}-page-info`);
  if (pageInfo) {
    pageInfo.textContent = `${currentPage} / ${totalPages} 페이지 (총 ${totalCount}건)`;
  }

  // 페이지네이션 버튼 업데이트
  const prevBtn = document.getElementById(`${type}-prev-page`);
  const nextBtn = document.getElementById(`${type}-next-page`);

  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        loadFunction(currentPage - 1);
      }
    };
  }

  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        loadFunction(currentPage + 1);
      }
    };
  }
}

// ========================================
// 실시간 업데이트
// ========================================
function startPaymentUpdates() {
  // 5분마다 결제 상태 확인
  paymentUpdateInterval = setInterval(async () => {
    console.log('🔄 결제 정보 실시간 업데이트...');

    try {
      await loadUserAccountInfo();
    } catch (error) {
      console.error('❌ 결제 정보 업데이트 실패:', error);
    }
  }, 300000); // 5분

  console.log('⏰ 결제 정보 실시간 업데이트 시작');
}

function stopPaymentUpdates() {
  if (paymentUpdateInterval) {
    clearInterval(paymentUpdateInterval);
    paymentUpdateInterval = null;
    console.log('⏰ 결제 정보 실시간 업데이트 중지');
  }
}

// ========================================
// 에러 메시지 표시
// ========================================
function showErrorMessage(message) {
  const errorContainer = document.getElementById('payment-error-message');
  if (errorContainer) {
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';

    // 5초 후 자동 숨김
    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  } else {
    showToast(message, 'error');
  }
}

// ========================================
// 날짜 포맷팅 함수들
// ========================================
function formatDate(dateString) {
  if (!dateString) return '-';

  try {
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${yyyy}-${MM}-${dd}`;
  } catch (error) {
    console.error('❌ 날짜 포맷팅 실패:', error);
    return '-';
  }
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '-';

  try {
    const date = new Date(dateTimeString);
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
  } catch (error) {
    console.error('❌ 날짜시간 포맷팅 실패:', error);
    return '-';
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function updateElement(id, content) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = content;
  }
}

// ========================================
// 페이지 정리
// ========================================
window.addEventListener('beforeunload', function() {
  stopPaymentUpdates();
});

// ========================================
// 전역 함수 노출
// ========================================
window.selectAllBills = selectAllBills;
window.deselectAllBills = deselectAllBills;
window.applyCoupon = applyCoupon;
window.useCoupon = useCoupon;
window.removeCoupon = removeCoupon;
window.processPayment = processPayment;
window.loadPaymentHistory = loadPaymentHistory;
window.showPaymentDetail = showPaymentDetail;
window.downloadReceipt = downloadReceipt;
window.requestRefund = requestRefund;
window.chargeBalance = chargeBalance;
window.addPaymentMethod = addPaymentMethod;
window.removePaymentMethod = removePaymentMethod;
window.updatePaymentSummary = updatePaymentSummary;
window.loadUnpaidBills = loadUnpaidBills;