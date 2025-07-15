// ========================================
// 이용 내역 (records.js)
// ========================================

let recordsUpdateInterval = null;
let currentFilters = {};
let currentPage = 1;
let currentTab = 'usage';

// ========================================
// 초기화
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📊 이용내역 모듈 로드됨');
  
  // 공통 라이브러리 초기화
  if (!initializeCommon()) {
    return;
  }
  
  // 이용내역 페이지 초기화
  initializeRecordsPage();
  
  console.log('✅ 이용내역 페이지 초기화 완료');
});

function initializeRecordsPage() {
  // 날짜 필터 기본값 설정
  setupDateFilters();
  
  // 탭 초기화
  initializeTabs();
  
  // 검색 기능 초기화
  initializeSearchFeatures();
  
  // 실시간 업데이트 시작
  startRecordsUpdates();
  
  // 초기 데이터 로드
  loadInitialRecordsData();
}

// ========================================
// 날짜 필터 설정
// ========================================
function setupDateFilters() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  // 기본 1개월 전부터 오늘까지
  const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  const oneMonthAgoStr = oneMonthAgo.toISOString().split('T')[0];
  
  // 기본 날짜 설정
  const dateFromInput = document.getElementById('date-from');
  const dateToInput = document.getElementById('date-to');
  
  if (dateFromInput && !dateFromInput.value) {
    dateFromInput.value = oneMonthAgoStr;
    currentFilters.startDate = oneMonthAgoStr;
  }
  
  if (dateToInput && !dateToInput.value) {
    dateToInput.value = todayStr;
    currentFilters.endDate = todayStr;
  }
  
  // 날짜 입력 이벤트 리스너
  if (dateFromInput) {
    dateFromInput.addEventListener('change', updateDateFilter);
  }
  if (dateToInput) {
    dateToInput.addEventListener('change', updateDateFilter);
  }
}

function updateDateFilter() {
  currentFilters.startDate = document.getElementById('date-from')?.value;
  currentFilters.endDate = document.getElementById('date-to')?.value;
  currentPage = 1; // 필터 변경 시 첫 페이지로
}

// ========================================
// 검색 기능 초기화
// ========================================
function initializeSearchFeatures() {
  // 검색어 입력 필드
  const searchInput = document.getElementById('search-keyword');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchRecords();
      }
    });
  }
  
  // 필터 선택 박스들
  const filterSelects = ['record-type', 'status-filter', 'car-filter'];
  filterSelects.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.addEventListener('change', () => {
        currentPage = 1;
        applyFilter();
      });
    }
  });
}

// ========================================
// 탭 초기화
// ========================================
function initializeTabs() {
  // URL 파라미터에서 초기 탭 확인
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'usage';
  
  currentTab = initialTab;
  
  // 해당 탭 활성화
  switchRecordTab(initialTab);
}

// ========================================
// 내역 탭 전환
// ========================================
function switchRecordTab(tabType) {
  currentTab = tabType;
  currentPage = 1; // 탭 변경 시 첫 페이지로
  
  // 탭 버튼 업데이트
  document.querySelectorAll('.records-tabs .tab-btn').forEach(btn => btn.classList.remove('active'));
  const targetBtn = document.querySelector(`[onclick*="${tabType}"]`);
  if (targetBtn) {
    targetBtn.classList.add('active');
  }
  
  // 컨텐츠 업데이트
  document.querySelectorAll('.records-content').forEach(content => content.classList.remove('active'));
  const targetContent = document.getElementById(tabType + '-records');
  if (targetContent) {
    targetContent.classList.add('active');
  }
  
  // URL 업데이트 (히스토리에 추가하지 않음)
  const newUrl = window.location.pathname + '?tab=' + tabType;
  window.history.replaceState(null, '', newUrl);
  
  // 해당 탭의 데이터 로드
  loadTabData(tabType);
}

async function loadTabData(tabType) {
  switch(tabType) {
    case 'usage':
      await loadUsageHistory();
      break;
    case 'payment':
      await loadPaymentHistory();
      break;
    case 'reservation':
      await loadReservationHistory();
      break;
  }
}

// ========================================
// 초기 데이터 로드
// ========================================
async function loadInitialRecordsData() {
  showLoading('데이터를 불러오는 중...');
  
  try {
    // 현재 활성 탭의 데이터만 로드
    await loadTabData(currentTab);
    
    // 사용자 차량 목록 로드 (필터용)
    await loadUserVehicles();
    
    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('❌ 초기 데이터 로드 실패:', error);
    showToast('데이터를 불러오는데 실패했습니다.', 'error');
  }
}

// ========================================
// 사용자 차량 목록 로드
// ========================================
async function loadUserVehicles() {
  try {
    const data = await apiRequest('/api/user/cars');
    if (data && data.vehicles) {
      populateCarFilter(data.vehicles);
    }
  } catch (error) {
    console.error('❌ 차량 목록 로드 실패:', error);
  }
}

function populateCarFilter(vehicles) {
  const carFilterSelect = document.getElementById('car-filter');
  if (!carFilterSelect) return;
  
  // 기존 옵션 제거 (전체 옵션 제외)
  const options = carFilterSelect.querySelectorAll('option:not([value="all"])');
  options.forEach(option => option.remove());
  
  // 차량 옵션 추가
  vehicles.forEach(vehicle => {
    const option = document.createElement('option');
    option.value = vehicle.carNumber;
    option.textContent = `${vehicle.carNumber} (${vehicle.model})`;
    carFilterSelect.appendChild(option);
  });
}

// ========================================
// 이용 내역 API (페이지네이션 지원)
// ========================================
async function loadUsageHistory(page = currentPage, filters = currentFilters) {
  console.log('📋 이용 내역 로드 중...', { page, filters });
  
  try {
    // URL 파라미터 구성
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20'
    });
    
    // 필터 추가
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.type && filters.type !== 'all') params.append('type', filters.type);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.carNumber && filters.carNumber !== 'all') params.append('carNumber', filters.carNumber);
    if (filters.keyword) params.append('keyword', filters.keyword);
    
    const data = await apiRequest(`/api/usage/history?${params.toString()}`);
    if (!data) return false;
    
    // 상태 업데이트
    currentPage = page;
    
    // UI 업데이트
    if (data.summary) {
      updateUsageSummary(data.summary);
    }
    
    if (data.history) {
      updateUsageHistoryList(data.history);
    }
    
    if (data.pagination) {
      updatePagination('usage', data.pagination);
    }
    
    // 통계 차트 업데이트
    if (data.statistics) {
      updateUsageStatistics(data.statistics);
    }
    
    console.log('✅ 이용 내역 로드 완료', { 
      totalRecords: data.history?.length || 0,
      currentPage: page 
    });
    
    return true;
  } catch (error) {
    console.error('❌ 이용 내역 로드 실패:', error);
    showErrorMessage('이용 내역을 불러오는데 실패했습니다.');
    return false;
  }
}

function updateUsageSummary(summary) {
  // 총 이용횟수
  updateElement('total-count', summary.totalCount || 0);
  updateElement('usage-count', summary.totalCount || 0);
  
  // 총 이용시간
  const totalHours = Math.floor((summary.totalMinutes || 0) / 60);
  const totalMinutes = (summary.totalMinutes || 0) % 60;
  const timeText = totalHours > 0 ? `${totalHours}시간 ${totalMinutes}분` : `${totalMinutes}분`;
  updateElement('total-time', timeText);
  updateElement('usage-time', timeText);
  
  // 총 결제금액
  updateElement('total-paid', '₩' + (summary.totalPaid || 0).toLocaleString());
  updateElement('usage-paid', '₩' + (summary.totalPaid || 0).toLocaleString());
  
  // 평균 이용시간
  const avgMinutes = summary.averageMinutes || 0;
  const avgHours = Math.floor(avgMinutes / 60);
  const avgMins = avgMinutes % 60;
  const avgText = avgHours > 0 ? `${avgHours}시간 ${avgMins}분` : `${avgMins}분`;
  updateElement('average-time', avgText);
  updateElement('usage-average', avgText);
  
  // 이번달 vs 저번달 비교
  if (summary.comparison) {
    updateComparisonStats(summary.comparison);
  }
}

function updateComparisonStats(comparison) {
  const elements = {
    countChange: document.getElementById('count-change'),
    timeChange: document.getElementById('time-change'),
    costChange: document.getElementById('cost-change')
  };
  
  if (elements.countChange) {
    const countDiff = comparison.countDifference || 0;
    elements.countChange.textContent = countDiff >= 0 ? `+${countDiff}` : `${countDiff}`;
    elements.countChange.className = countDiff >= 0 ? 'positive' : 'negative';
  }
  
  if (elements.timeChange) {
    const timeDiff = comparison.timeDifference || 0;
    elements.timeChange.textContent = timeDiff >= 0 ? `+${timeDiff}분` : `${timeDiff}분`;
    elements.timeChange.className = timeDiff >= 0 ? 'positive' : 'negative';
  }
  
  if (elements.costChange) {
    const costDiff = comparison.costDifference || 0;
    elements.costChange.textContent = costDiff >= 0 ? `+₩${costDiff.toLocaleString()}` : `-₩${Math.abs(costDiff).toLocaleString()}`;
    elements.costChange.className = costDiff >= 0 ? 'negative' : 'positive'; // 비용은 적을수록 좋음
  }
}

function updateUsageHistoryList(history) {
  const historyContainer = document.querySelector('.history-list, .usage-history');
  if (!historyContainer) return;
  
  // 기존 목록 클리어 (헤더 제외)
  const existingItems = historyContainer.querySelectorAll('.history-item, .usage-item');
  existingItems.forEach(item => item.remove());
  
  if (history && history.length > 0) {
    // 새 목록 추가
    history.forEach(record => {
      const item = createUsageHistoryItem(record);
      historyContainer.appendChild(item);
    });
  } else {
    // 빈 목록 메시지
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';
    emptyMessage.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #64748b;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
        <p>조건에 맞는 이용 내역이 없습니다.</p>
        <p style="font-size: 0.9rem; margin-top: 0.5rem;">필터 조건을 변경해보세요.</p>
      </div>
    `;
    historyContainer.appendChild(emptyMessage);
  }
}

function createUsageHistoryItem(record) {
  const item = document.createElement('div');
  item.className = 'history-item usage-item';
  item.setAttribute('data-record-id', record.id);
  
  const statusClass = record.status.toLowerCase();
  const statusText = getUsageStatusText(record.status);
  
  // 이용 시간 계산
  const duration = calculateDuration(record.entryTime, record.exitTime);
  
  item.innerHTML = `
    <div class="item-date">
      <div class="date-main">${formatDate(record.entryTime)}</div>
      <div class="date-day">${getKoreanDayOfWeek(record.entryTime)}</div>
    </div>
    <div class="item-slot">
      <div class="slot-name">${escapeHtml(record.slotName)}</div>
      <div class="slot-zone">${escapeHtml(record.zoneName || '')}</div>
    </div>
    <div class="item-duration">
      <div class="duration-main">${duration}</div>
      <div class="duration-type">${getUsageTypeText(record.usageType)}</div>
    </div>
    <div class="item-time">
      <div class="time-entry">${formatTime(record.entryTime)}</div>
      <div class="time-separator">~</div>
      <div class="time-exit">${record.exitTime ? formatTime(record.exitTime) : '이용중'}</div>
    </div>
    <div class="item-car">
      <div class="car-number">${escapeHtml(record.carNumber)}</div>
      <div class="car-model">${escapeHtml(record.carModel || '')}</div>
    </div>
    <div class="item-fee">
      <div class="fee-amount">₩${record.fee.toLocaleString()}</div>
      ${record.discountAmount > 0 ? `<div class="fee-discount">-₩${record.discountAmount.toLocaleString()}</div>` : ''}
    </div>
    <div class="item-status">
      <span class="status-badge status-${statusClass}">${statusText}</span>
      ${record.isRecurring ? '<span class="recurring-badge">정기</span>' : ''}
    </div>
    <div class="item-actions">
      <button onclick="showUsageDetail('${record.id}')" class="btn-detail" title="상세 보기">
        <i class="icon-detail"></i>상세
      </button>
      ${record.status === 'COMPLETED' && record.receiptAvailable ? 
        `<button onclick="downloadUsageReceipt('${record.id}')" class="btn-receipt" title="영수증 다운로드">
          <i class="icon-receipt"></i>영수증
        </button>` : ''
      }
      ${record.status === 'ACTIVE' ? 
        `<button onclick="requestEarlyExit('${record.id}')" class="btn-exit" title="조기 출차">
          <i class="icon-exit"></i>출차
        </button>` : ''
      }
    </div>
  `;
  
  return item;
}

function getUsageStatusText(status) {
  const statusMap = {
    'COMPLETED': '완료',
    'ACTIVE': '이용중',
    'CANCELLED': '취소',
    'EXPIRED': '만료',
    'PENDING': '대기'
  };
  return statusMap[status] || status;
}

function getUsageTypeText(type) {
  const typeMap = {
    'hourly': '시간권',
    'daily': '일일권',
    'monthly': '월정액',
    'visitor': '방문자'
  };
  return typeMap[type] || type;
}

// ========================================
// 결제 내역 로드
// ========================================
async function loadPaymentHistory(page = currentPage, filters = currentFilters) {
  console.log('💳 결제 내역 로드 중...', { page, filters });
  
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20'
    });
    
    // 필터 추가
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.keyword) params.append('keyword', filters.keyword);
    
    const data = await apiRequest(`/api/payment/history?${params.toString()}`);
    if (!data) return false;
    
    currentPage = page;
    
    // 결제 통계 업데이트
    if (data.summary) {
      updatePaymentSummary(data.summary);
    }
    
    // 결제 내역 목록 업데이트
    if (data.payments) {
      updatePaymentHistoryList(data.payments);
    }
    
    // 페이지네이션 업데이트
    if (data.pagination) {
      updatePagination('payment', data.pagination);
    }
    
    console.log('✅ 결제 내역 로드 완료');
    return true;
  } catch (error) {
    console.error('❌ 결제 내역 로드 실패:', error);
    showErrorMessage('결제 내역을 불러오는데 실패했습니다.');
    return false;
  }
}

function updatePaymentSummary(summary) {
  updateElement('payment-total-count', summary.totalCount || 0);
  updateElement('payment-total-amount', '₩' + (summary.totalAmount || 0).toLocaleString());
  updateElement('payment-total-discount', '₩' + (summary.totalDiscount || 0).toLocaleString());
  updateElement('payment-avg-amount', '₩' + (summary.averageAmount || 0).toLocaleString());
}

function updatePaymentHistoryList(payments) {
  const container = document.querySelector('.payment-history-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (payments && payments.length > 0) {
    payments.forEach(payment => {
      const item = createPaymentHistoryItem(payment);
      container.appendChild(item);
    });
  } else {
    container.innerHTML = `
      <div class="empty-message">
        <div style="text-align: center; padding: 2rem; color: #64748b;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">💳</div>
          <p>조건에 맞는 결제 내역이 없습니다.</p>
        </div>
      </div>
    `;
  }
}

function createPaymentHistoryItem(payment) {
  const item = document.createElement('div');
  item.className = 'payment-history-item';
  
  const statusClass = payment.status.toLowerCase();
  const statusText = getPaymentStatusText(payment.status);
  
  item.innerHTML = `
    <div class="payment-date">${formatDateTime(payment.paymentDate)}</div>
    <div class="payment-id">
      <div class="id-main">${payment.paymentId}</div>
      <div class="id-method">${getPaymentMethodText(payment.paymentMethod)}</div>
    </div>
    <div class="payment-amount">
      <div class="amount-main">₩${payment.amount.toLocaleString()}</div>
      ${payment.discountAmount > 0 ? `<div class="amount-discount">-₩${payment.discountAmount.toLocaleString()}</div>` : ''}
    </div>
    <div class="payment-status">
      <span class="status-badge status-${statusClass}">${statusText}</span>
    </div>
    <div class="payment-actions">
      <button onclick="showPaymentDetail('${payment.paymentId}')" class="btn-detail">상세</button>
      ${payment.status === 'COMPLETED' ? 
        `<button onclick="downloadPaymentReceipt('${payment.paymentId}')" class="btn-receipt">영수증</button>` : ''
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
// 예약 내역 로드
// ========================================
async function loadReservationHistory(page = currentPage, filters = currentFilters) {
  console.log('📅 예약 내역 로드 중...', { page, filters });
  
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: '20'
    });
    
    // 필터 추가
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.keyword) params.append('keyword', filters.keyword);
    
    const data = await apiRequest(`/api/reservations/history?${params.toString()}`);
    if (!data) return false;
    
    currentPage = page;
    
    // 예약 통계 업데이트
    if (data.summary) {
      updateReservationSummary(data.summary);
    }
    
    // 예약 내역 목록 업데이트
    if (data.reservations) {
      updateReservationHistoryList(data.reservations);
    }
    
    // 페이지네이션 업데이트
    if (data.pagination) {
      updatePagination('reservation', data.pagination);
    }
    
    console.log('✅ 예약 내역 로드 완료');
    return true;
  } catch (error) {
    console.error('❌ 예약 내역 로드 실패:', error);
    showErrorMessage('예약 내역을 불러오는데 실패했습니다.');
    return false;
  }
}

function updateReservationSummary(summary) {
  updateElement('reservation-total-count', summary.totalCount || 0);
  updateElement('reservation-active-count', summary.activeCount || 0);
  updateElement('reservation-completed-count', summary.completedCount || 0);
  updateElement('reservation-cancelled-count', summary.cancelledCount || 0);
}

function updateReservationHistoryList(reservations) {
  const container = document.querySelector('.reservation-history-list');
  if (!container) return;
  
  container.innerHTML = '';
  
  if (reservations && reservations.length > 0) {
    reservations.forEach(reservation => {
      const item = createReservationHistoryItem(reservation);
      container.appendChild(item);
    });
  } else {
    container.innerHTML = `
      <div class="empty-message">
        <div style="text-align: center; padding: 2rem; color: #64748b;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
          <p>조건에 맞는 예약 내역이 없습니다.</p>
        </div>
      </div>
    `;
  }
}

function createReservationHistoryItem(reservation) {
  const item = document.createElement('div');
  item.className = 'reservation-history-item';
  
  const statusClass = reservation.status.toLowerCase();
  const statusText = getReservationStatusText(reservation.status);
  
  item.innerHTML = `
    <div class="reservation-date">${formatDate(reservation.reservationDate)}</div>
    <div class="reservation-slot">
      <div class="slot-name">${escapeHtml(reservation.slotName)}</div>
      <div class="slot-time">${formatTime(reservation.startTime)} ~ ${formatTime(reservation.endTime)}</div>
    </div>
    <div class="reservation-car">${escapeHtml(reservation.carNumber)}</div>
    <div class="reservation-fee">₩${reservation.fee.toLocaleString()}</div>
    <div class="reservation-status">
      <span class="status-badge status-${statusClass}">${statusText}</span>
    </div>
    <div class="reservation-actions">
      <button onclick="showReservationDetail('${reservation.id}')" class="btn-detail">상세</button>
      ${reservation.status === 'ACTIVE' ? 
        `<button onclick="cancelReservation('${reservation.id}')" class="btn-cancel">취소</button>` : ''
      }
    </div>
  `;
  
  return item;
}

function getReservationStatusText(status) {
  const statusMap = {
    'ACTIVE': '활성',
    'COMPLETED': '완료',
    'CANCELLED': '취소',
    'EXPIRED': '만료',
    'NO_SHOW': '미이용'
  };
  return statusMap[status] || status;
}

// ========================================
// 검색 기능
// ========================================
async function searchRecords() {
  const keyword = document.getElementById('search-keyword')?.value.trim();
  
  if (!keyword) {
    showToast('검색어를 입력해주세요.', 'warning');
    return;
  }
  
  currentFilters.keyword = keyword;
  currentPage = 1;
  
  showLoading('검색 중...');
  const success = await loadTabData(currentTab);
  hideLoading();
  
  if (success) {
    showToast(`"${keyword}" 검색 결과입니다.`, 'info');
  }
}

function clearSearch() {
  const searchInput = document.getElementById('search-keyword');
  if (searchInput) {
    searchInput.value = '';
  }
  
  delete currentFilters.keyword;
  currentPage = 1;
  
  loadTabData(currentTab);
  showToast('검색 조건이 초기화되었습니다.', 'info');
}

// ========================================
// 필터 적용
// ========================================
async function applyFilter() {
  // 현재 필터 상태 수집
  const newFilters = {
    startDate: document.getElementById('date-from')?.value,
    endDate: document.getElementById('date-to')?.value,
    type: document.getElementById('record-type')?.value,
    status: document.getElementById('status-filter')?.value,
    carNumber: document.getElementById('car-filter')?.value,
    keyword: document.getElementById('search-keyword')?.value?.trim()
  };
  
  // 빈 값 제거
  Object.keys(newFilters).forEach(key => {
    if (!newFilters[key] || newFilters[key] === 'all') {
      delete newFilters[key];
    }
  });
  
  // 날짜 유효성 검사
  if (newFilters.startDate && newFilters.endDate) {
    const start = new Date(newFilters.startDate);
    const end = new Date(newFilters.endDate);
    
    if (start > end) {
      showToast('시작일이 종료일보다 늦을 수 없습니다.', 'error');
      return;
    }
    
    // 6개월 이상 조회 시 경고
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 180) {
      if (!confirm('6개월 이상 조회 시 시간이 오래 걸릴 수 있습니다.\n계속하시겠습니까?')) {
        return;
      }
    }
  }
  
  // 필터 적용
  currentFilters = newFilters;
  currentPage = 1;
  
  showLoading('필터를 적용하는 중...');
  const success = await loadTabData(currentTab);
  hideLoading();
  
  if (success) {
    showToast('필터가 적용되었습니다.', 'success');
  }
}

function resetFilters() {
  // 필터 초기화
  currentFilters = {};
  currentPage = 1;
  
  // UI 초기화
  const inputs = ['date-from', 'date-to', 'record-type', 'status-filter', 'car-filter', 'search-keyword'];
  inputs.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      if (element.type === 'date') {
        element.value = '';
      } else if (element.tagName === 'SELECT') {
        element.value = 'all';
      } else {
        element.value = '';
      }
    }
  });
  
  // 기본 날짜 다시 설정
  setupDateFilters();
  
  // 데이터 새로고침
  loadTabData(currentTab);
  showToast('필터가 초기화되었습니다.', 'info');
}

// ========================================
// 내역 내보내기 (다양한 포맷 지원)
// ========================================
async function exportRecords(format = 'csv') {
  const recordCount = getVisibleRecordCount();
  
  if (recordCount === 0) {
    showToast('내보낼 데이터가 없습니다.', 'warning');
    return;
  }
  
  const formatText = format === 'csv' ? 'CSV' : format === 'excel' ? 'Excel' : format === 'pdf' ? 'PDF' : 'CSV';
  
  if (!confirm(`${recordCount}건의 ${currentTab === 'usage' ? '이용' : currentTab === 'payment' ? '결제' : '예약'} 내역을 ${formatText} 파일로 내보내시겠습니까?`)) {
    return;
  }
  
  showLoading('내역을 내보내는 중...');
  
  try {
    const response = await apiRequest(`/api/${currentTab}/export`, {
      method: 'POST',
      body: JSON.stringify({
        format: format,
        filters: currentFilters,
        includeStatistics: true
      })
    });
    
    if (response && response.downloadUrl) {
      // 서버에서 생성된 파일 다운로드
      const filename = `${getTabKoreanName(currentTab)}_내역_${new Date().toISOString().split('T')[0]}.${format}`;
      downloadFile(response.downloadUrl, filename);
      
      hideLoading();
      showToast('내역이 다운로드되었습니다.', 'success');
    } else {
      // 대체 방법: 클라이언트 사이드 생성
      generateClientSideExport(format);
    }
  } catch (error) {
    console.error('❌ 내역 내보내기 실패:', error);
    generateClientSideExport(format); // 대체 방법
  }
}

function generateClientSideExport(format) {
  if (format === 'csv') {
    generateCSVExport();
  } else {
    hideLoading();
    showToast('해당 포맷은 서버에서만 지원됩니다.', 'warning');
  }
}

function generateCSVExport() {
  let headers, rows;
  
  if (currentTab === 'usage') {
    headers = ['날짜', '구역', '차량번호', '이용시간', '시작시간', '종료시간', '요금', '할인', '상태'];
    rows = [headers.join(',')];
    
    document.querySelectorAll('.usage-item').forEach(item => {
      const row = [
        getElementText(item, '.date-main'),
        getElementText(item, '.slot-name'),
        getElementText(item, '.car-number'),
        getElementText(item, '.duration-main'),
        getElementText(item, '.time-entry'),
        getElementText(item, '.time-exit'),
        getElementText(item, '.fee-amount').replace('₩', '').replace(/,/g, ''),
        getElementText(item, '.fee-discount').replace('-₩', '').replace(/,/g, '') || '0',
        getElementText(item, '.status-badge')
      ];
      rows.push(row.map(cell => `"${cell}"`).join(','));
    });
  } else if (currentTab === 'payment') {
    headers = ['결제일시', '결제번호', '결제수단', '결제금액', '할인금액', '상태'];
    rows = [headers.join(',')];
    
    document.querySelectorAll('.payment-history-item').forEach(item => {
      const row = [
        getElementText(item, '.payment-date'),
        getElementText(item, '.id-main'),
        getElementText(item, '.id-method'),
        getElementText(item, '.amount-main').replace('₩', '').replace(/,/g, ''),
        getElementText(item, '.amount-discount').replace('-₩', '').replace(/,/g, '') || '0',
        getElementText(item, '.status-badge')
      ];
      rows.push(row.map(cell => `"${cell}"`).join(','));
    });
  }
  
  const csvContent = '\uFEFF' + rows.join('\n'); // UTF-8 BOM 추가
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${getTabKoreanName(currentTab)}_내역_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFileBlob(blob, filename);
  
  hideLoading();
  showToast('내역이 다운로드되었습니다.', 'success');
}

function getElementText(parent, selector) {
  const element = parent.querySelector(selector);
  return element ? element.textContent.trim() : '';
}

function getVisibleRecordCount() {
  const items = document.querySelectorAll(`.${currentTab}-item:not(.empty-message)`);
  return items.length;
}

function getTabKoreanName(tab) {
  const names = {
    'usage': '이용',
    'payment': '결제',
    'reservation': '예약'
  };
  return names[tab] || tab;
}

// ========================================
// 상세보기 모달
// ========================================
async function showUsageDetail(recordId) {
  showLoading('상세 정보를 불러오는 중...');
  
  try {
    const data = await apiRequest(`/api/usage/detail/${recordId}`);
    
    if (data) {
      renderUsageDetailModal(data);
    } else {
      hideLoading();
      showToast('상세 정보를 불러올 수 없습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 상세 정보 조회 실패:', error);
    showToast('상세 정보 조회에 실패했습니다.', 'error');
  }
}

function renderUsageDetailModal(data) {
  hideLoading();
  
  // 모달 엘리먼트 업데이트
  updateElement('detail-id', data.id);
  updateElement('detail-spot', data.slotName);
  updateElement('detail-zone', data.zoneName);
  updateElement('detail-car', data.carNumber);
  updateElement('detail-car-model', data.carModel);
  updateElement('detail-entry', formatDateTime(data.entryTime));
  updateElement('detail-exit', data.exitTime ? formatDateTime(data.exitTime) : '이용중');
  updateElement('detail-duration', calculateDuration(data.entryTime, data.exitTime));
  updateElement('detail-base', '₩' + data.baseAmount.toLocaleString());
  updateElement('detail-discount', data.discountAmount > 0 ? '-₩' + data.discountAmount.toLocaleString() : '할인 없음');
  updateElement('detail-tax', '₩' + data.taxAmount.toLocaleString());
  updateElement('detail-total', '₩' + data.totalAmount.toLocaleString());
  
  // 추가 정보
  if (data.membershipDiscount > 0) {
    updateElement('detail-membership-discount', '-₩' + data.membershipDiscount.toLocaleString());
  }
  
  if (data.couponDiscount > 0) {
    updateElement('detail-coupon-discount', '-₩' + data.couponDiscount.toLocaleString());
  }
  
  // 모달 표시
  const modal = document.getElementById('detail-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

async function showPaymentDetail(paymentId) {
  showLoading('결제 상세 정보를 불러오는 중...');
  
  try {
    const data = await apiRequest(`/api/payment/detail/${paymentId}`);
    
    if (data) {
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

function renderPaymentDetailModal(data) {
  hideLoading();
  
  // 간단한 알림으로 표시 (실제로는 모달 구현)
  const details = `
결제번호: ${data.paymentId}
결제일시: ${formatDateTime(data.paymentDate)}
결제금액: ₩${data.amount.toLocaleString()}
결제수단: ${getPaymentMethodText(data.paymentMethod)}
상태: ${getPaymentStatusText(data.status)}

${data.bills ? '결제 항목:\n' + data.bills.map(bill => 
  `- ${bill.type}: ₩${bill.amount.toLocaleString()}`
).join('\n') : ''}
  `;
  
  alert(details);
}

async function showReservationDetail(reservationId) {
  showLoading('예약 상세 정보를 불러오는 중...');
  
  try {
    const data = await apiRequest(`/api/reservations/detail/${reservationId}`);
    
    if (data) {
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
  hideLoading();
  
  const details = `
예약번호: ${data.id}
예약일시: ${formatDateTime(data.reservationDate)}
주차구역: ${data.slotName}
시작시간: ${formatTime(data.startTime)}
종료시간: ${formatTime(data.endTime)}
차량번호: ${data.carNumber}
예약요금: ₩${data.fee.toLocaleString()}
상태: ${getReservationStatusText(data.status)}
  `;
  
  alert(details);
}

function closeModal() {
  const modal = document.getElementById('detail-modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// ========================================
// 영수증 다운로드
// ========================================
async function downloadUsageReceipt(recordId) {
  await downloadReceipt('usage', recordId);
}

async function downloadPaymentReceipt(paymentId) {
  await downloadReceipt('payment', paymentId);
}

async function downloadReceipt(type, id) {
  showLoading('영수증을 생성하는 중...');
  
  try {
    const response = await apiRequest(`/api/${type}/receipt/${id}`, {
      method: 'GET',
      responseType: 'blob'
    });
    
    if (response) {
      const filename = `${type === 'usage' ? '이용' : '결제'}영수증_${id}_${new Date().toISOString().split('T')[0]}.pdf`;
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
// 조기 출차 요청
// ========================================
async function requestEarlyExit(recordId) {
  if (!confirm('조기 출차를 요청하시겠습니까?\n남은 시간에 대한 요금이 정산됩니다.')) {
    return;
  }
  
  showLoading('출차를 처리중입니다...');
  
  try {
    const response = await apiRequest(`/api/usage/early-exit/${recordId}`, {
      method: 'POST'
    });
    
    if (response && response.success) {
      hideLoading();
      showToast(`조기 출차가 완료되었습니다!\n최종요금: ₩${response.finalFee?.toLocaleString()}`, 'success');
      
      // 이용 내역 새로고침
      await loadUsageHistory();
    } else {
      hideLoading();
      showToast(response?.message || '조기 출차 처리에 실패했습니다.', 'error');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 조기 출차 실패:', error);
    showToast('조기 출차 처리 중 오류가 발생했습니다.', 'error');
  }
}

// ========================================
// 페이지네이션
// ========================================
function updatePagination(type, pagination) {
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
        loadTabData(currentTab, currentPage - 1);
      }
    };
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        loadTabData(currentTab, currentPage + 1);
      }
    };
  }
}

function prevPage() {
  if (currentPage > 1) {
    currentPage--;
    loadTabData(currentTab);
    showToast(`${currentPage}페이지로 이동합니다.`, 'info');
  }
}

function nextPage() {
  const totalPages = getTotalPages();
  if (currentPage < totalPages) {
    currentPage++;
    loadTabData(currentTab);
    showToast(`${currentPage}페이지로 이동합니다.`, 'info');
  }
}

function getTotalPages() {
  const totalElement = document.querySelector('.total-pages');
  return totalElement ? parseInt(totalElement.textContent) : 1;
}

// ========================================
// 빠른 필터 버튼
// ========================================
function setQuickFilter(period) {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  let startDate;
  
  switch(period) {
    case 'week':
      startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().split('T')[0];
      break;
    case 'quarter':
      startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()).toISOString().split('T')[0];
      break;
    case 'year':
      startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
      break;
    default:
      return;
  }
  
  // 날짜 필터 설정
  const dateFromInput = document.getElementById('date-from');
  const dateToInput = document.getElementById('date-to');
  
  if (dateFromInput) dateFromInput.value = startDate;
  if (dateToInput) dateToInput.value = endDate;
  
  // 필터 적용
  applyFilter();
  
  const periodText = {
    'week': '최근 1주일',
    'month': '최근 1개월',
    'quarter': '최근 3개월',
    'year': '최근 1년'
  };
  
  showToast(`${periodText[period]} 필터가 적용되었습니다.`, 'info');
}

// ========================================
// 통계 업데이트
// ========================================
function updateUsageStatistics(statistics) {
  // 시간대별 이용 패턴
  if (statistics.hourlyPattern && window.Chart) {
    updateHourlyChart(statistics.hourlyPattern);
  }
  
  // 요일별 이용 패턴
  if (statistics.weeklyPattern && window.Chart) {
    updateWeeklyChart(statistics.weeklyPattern);
  }
  
  // 월별 이용 추이
  if (statistics.monthlyTrend && window.Chart) {
    updateMonthlyChart(statistics.monthlyTrend);
  }
}

function updateHourlyChart(data) {
  const ctx = document.getElementById('hourly-chart');
  if (!ctx) return;
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.hours,
      datasets: [{
        label: '이용 횟수',
        data: data.counts,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// ========================================
// 실시간 업데이트
// ========================================
function startRecordsUpdates() {
  // 5분마다 현재 탭 데이터 새로고침
  recordsUpdateInterval = setInterval(async () => {
    console.log('🔄 내역 정보 실시간 업데이트...');
    
    try {
      await loadTabData(currentTab);
    } catch (error) {
      console.error('❌ 내역 정보 업데이트 실패:', error);
    }
  }, 300000); // 5분
  
  console.log('⏰ 내역 정보 실시간 업데이트 시작');
}

function stopRecordsUpdates() {
  if (recordsUpdateInterval) {
    clearInterval(recordsUpdateInterval);
    recordsUpdateInterval = null;
    console.log('⏰ 내역 정보 실시간 업데이트 중지');
  }
}

// ========================================
// 유틸리티 함수들
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

function formatTime(dateTimeString) {
  if (!dateTimeString) return '-';
  
  try {
    const date = new Date(dateTimeString);
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    
    return `${hh}:${mm}`;
  } catch (error) {
    console.error('❌ 시간 포맷팅 실패:', error);
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

function getKoreanDayOfWeek(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
  } catch (error) {
    return '';
  }
}

function calculateDuration(startTime, endTime) {
  if (!startTime) return '-';
  if (!endTime) return '이용중';
  
  try {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    
    if (diffMs < 0) return '-';
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes}분`;
    } else if (minutes === 0) {
      return `${hours}시간`;
    } else {
      return `${hours}시간 ${minutes}분`;
    }
  } catch (error) {
    console.error('❌ 시간 계산 실패:', error);
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

function downloadFile(url, filename) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
  const errorContainer = document.getElementById('records-error-message');
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

// ========================================
// 페이지 정리
// ========================================
window.addEventListener('beforeunload', function() {
  stopRecordsUpdates();
});

// ========================================
// 전역 함수 노출
// ========================================
window.switchRecordTab = switchRecordTab;
window.searchRecords = searchRecords;
window.clearSearch = clearSearch;
window.applyFilter = applyFilter;
window.resetFilters = resetFilters;
window.exportRecords = exportRecords;
window.showUsageDetail = showUsageDetail;
window.showPaymentDetail = showPaymentDetail;
window.showReservationDetail = showReservationDetail;
window.closeModal = closeModal;
window.downloadUsageReceipt = downloadUsageReceipt;
window.downloadPaymentReceipt = downloadPaymentReceipt;
window.requestEarlyExit = requestEarlyExit;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.setQuickFilter = setQuickFilter;
window.loadUsageHistory = loadUsageHistory;
window.loadPaymentHistory = loadPaymentHistory;
window.loadReservationHistory = loadReservationHistory;