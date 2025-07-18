// ========================================
// 이용 내역 (my-records.js) - PDF 명세서 기준
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

  // 공통 라이브러리 초기화 (가정)
  if (typeof initializeCommon === 'function' && !initializeCommon()) {
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
// 이용 내역 로드 (PDF 명세서 기준)
// ========================================
async function loadUsageHistory(page = currentPage, filters = currentFilters) {
  console.log('📋 이용 내역 로드 중...', { page, filters });

  try {
    // 실제 API 요청 대신 가상 데이터 사용
    const data = await getMockUsageData(page, filters);

    // 상태 업데이트
    currentPage = page;

    // PDF 명세서에 따른 UI 업데이트
    if (data.summary) {
      updateUsageSummary(data.summary);
    }

    if (data.history) {
      updateUsageHistoryList(data.history);
    }

    if (data.pagination) {
      updatePagination('usage', data.pagination);
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

// 가상 데이터 생성 함수
async function getMockUsageData(page, filters) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        summary: {
          totalCount: 47,
          totalTime: 156,
          totalPaid: 342000,
          averageTime: 3.2
        },
        history: [
          {
            id: 'U20250702001',
            date: '2025-07-02',
            slotName: 'A-15',
            duration: '2시간 30분',
            startTime: '09:30',
            endTime: '12:00',
            carNumber: '12가3456',
            fee: 5000,
            status: '이용중'
          },
          {
            id: 'U20250701001',
            date: '2025-07-01',
            slotName: 'A-08',
            duration: '8시간 30분',
            startTime: '09:00',
            endTime: '17:30',
            carNumber: '12가3456',
            fee: 15000,
            status: '완료'
          },
          {
            id: 'U20250628001',
            date: '2025-06-28',
            slotName: 'C-12',
            duration: '2시간 25분',
            startTime: '13:20',
            endTime: '15:45',
            carNumber: '12가3456',
            fee: 4500,
            status: '완료'
          }
        ],
        pagination: {
          currentPage: page,
          totalPages: 5,
          totalCount: 47
        }
      });
    }, 500);
  });
}

// 가상 결제 데이터
async function getMockPaymentData(page, filters) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        payments: [
          {
            paymentId: 'PAY20250701001',
            paymentDate: '2025-07-01T17:35:00',
            amount: 15000,
            discountAmount: 0,
            paymentMethod: 'card',
            status: 'COMPLETED'
          },
          {
            paymentId: 'PAY20250625001',
            paymentDate: '2025-06-25T12:05:00',
            amount: 3000,
            discountAmount: 0,
            paymentMethod: 'mobile',
            status: 'COMPLETED'
          }
        ],
        pagination: {
          currentPage: page,
          totalPages: 3,
          totalCount: 25
        }
      });
    }, 500);
  });
}

// 가상 예약 데이터
async function getMockReservationData(page, filters) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        reservations: [
          {
            id: 'RES20250703001',
            reservationDate: '2025-07-03',
            slotName: 'B-22',
            startTime: '14:00',
            endTime: '17:00',
            carNumber: '12가3456',
            fee: 6000,
            status: 'ACTIVE'
          },
          {
            id: 'RES20250701001',
            reservationDate: '2025-07-01',
            slotName: 'A-08',
            startTime: '09:00',
            endTime: '17:30',
            carNumber: '12가3456',
            fee: 15000,
            status: 'COMPLETED'
          }
        ],
        pagination: {
          currentPage: page,
          totalPages: 2,
          totalCount: 15
        }
      });
    }, 500);
  });
}

// PDF 명세서에 따른 통계 정보 업데이트
function updateUsageSummary(summary) {
  // 총 이용횟수 (totalCount)
  updateElement('total-count', summary.totalCount || 0);
  updateElement('usage-count', summary.totalCount || 0);

  // 총 이용시간 (totalTime - 시간 단위)
  const totalHours = summary.totalTime || 0;
  updateElement('total-time', totalHours + 'h');
  updateElement('usage-time', totalHours + 'h');

  // 총 결제금액 (totalPaid)
  updateElement('total-paid', '₩' + (summary.totalPaid || 0).toLocaleString());
  updateElement('usage-paid', '₩' + (summary.totalPaid || 0).toLocaleString());

  // 평균 이용시간 (averageTime)
  const avgTime = summary.averageTime || 0;
  updateElement('average-time', avgTime + 'h');
  updateElement('usage-average', avgTime + 'h');

  console.log('📊 이용 내역 통계 업데이트 완료:', summary);
}

// PDF 명세서에 따른 이용 내역 목록 업데이트
function updateUsageHistoryList(history) {
  const historyContainer = document.querySelector('.usage-history, .history-list');
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

// PDF 명세서에 따른 이용 내역 항목 생성
function createUsageHistoryItem(record) {
  const item = document.createElement('div');
  item.className = 'history-item usage-item';
  item.setAttribute('data-record-id', record.id || '');

  const statusClass = record.status.toLowerCase();
  const statusText = getUsageStatusText(record.status);

  item.innerHTML = `
    <div class="item-date">
      <div class="date-main">${formatDate(record.date)}</div>
      <div class="date-day">${getKoreanDayOfWeek(record.date)}</div>
    </div>
    <div class="item-slot">
      <div class="slot-name">${escapeHtml(record.slotName)}</div>
    </div>
    <div class="item-duration">
      <div class="duration-main">${record.duration}</div>
    </div>
    <div class="item-time">
      <div class="time-entry">${record.startTime}</div>
      <div class="time-separator">~</div>
      <div class="time-exit">${record.endTime || '이용중'}</div>
    </div>
    <div class="item-car">
      <div class="car-number">${escapeHtml(record.carNumber)}</div>
    </div>
    <div class="item-fee">
      <div class="fee-amount">₩${record.fee.toLocaleString()}</div>
    </div>
    <div class="item-status">
      <span class="status-badge status-${statusClass}">${statusText}</span>
    </div>
    <div class="item-actions">
      <button onclick="showUsageDetail('${record.id || ''}')" class="btn-detail" title="상세 보기">
        상세
      </button>
      ${record.status === '완료' ?
      `<button onclick="downloadUsageReceipt('${record.id || ''}')" class="btn-receipt" title="영수증 다운로드">
          영수증
        </button>` : ''
  }
    </div>
  `;

  return item;
}

function getUsageStatusText(status) {
  const statusMap = {
    '이용중': '이용중',
    '완료': '완료',
    '취소': '취소',
    '만료': '만료'
  };
  return statusMap[status] || status;
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
  const filterSelects = ['record-type', 'status-filter'];
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

    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('❌ 초기 데이터 로드 실패:', error);
    showToast('데이터를 불러오는데 실패했습니다.', 'error');
  }
}

// ========================================
// 결제 내역 로드 (기본 구조 유지)
// ========================================
async function loadPaymentHistory(page = currentPage, filters = currentFilters) {
  console.log('💳 결제 내역 로드 중...', { page, filters });

  try {
    const data = await getMockPaymentData(page, filters);

    currentPage = page;

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
// 예약 내역 로드 (기본 구조 유지)
// ========================================
async function loadReservationHistory(page = currentPage, filters = currentFilters) {
  console.log('📅 예약 내역 로드 중...', { page, filters });

  try {
    const data = await getMockReservationData(page, filters);

    currentPage = page;

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
  const inputs = ['date-from', 'date-to', 'record-type', 'status-filter', 'search-keyword'];
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

// ========================================
// 상세보기 및 액션 함수들
// ========================================
function showUsageDetail(recordId) {
  console.log('이용내역 상세보기:', recordId);
  showToast('이용내역 상세보기 기능은 준비중입니다.', 'info');
}

function downloadUsageReceipt(recordId) {
  console.log('영수증 다운로드:', recordId);
  showToast('영수증 다운로드 기능은 준비중입니다.', 'info');
}

function showPaymentDetail(paymentId) {
  console.log('결제내역 상세보기:', paymentId);
  showToast('결제내역 상세보기 기능은 준비중입니다.', 'info');
}

function downloadPaymentReceipt(paymentId) {
  console.log('결제 영수증 다운로드:', paymentId);
  showToast('결제 영수증 다운로드 기능은 준비중입니다.', 'info');
}

function showReservationDetail(reservationId) {
  console.log('예약내역 상세보기:', reservationId);
  showToast('예약내역 상세보기 기능은 준비중입니다.', 'info');
}

function cancelReservation(reservationId) {
  if (confirm('정말 예약을 취소하시겠습니까?')) {
    console.log('예약 취소:', reservationId);
    showToast('예약 취소 기능은 준비중입니다.', 'info');
  }
}

function exportRecords() {
  console.log('내역 내보내기');
  showToast('내역 내보내기 기능은 준비중입니다.', 'info');
}

function closeModal() {
  const modal = document.getElementById('detail-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function downloadReceipt() {
  console.log('영수증 다운로드');
  showToast('영수증 다운로드 기능은 준비중입니다.', 'info');
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
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return `${MM}/${dd}`;
  } catch (error) {
    console.error('❌ 날짜 포맷팅 실패:', error);
    return '-';
  }
}

function formatTime(timeString) {
  if (!timeString) return '-';

  try {
    return timeString.substring(0, 5); // HH:MM 형식
  } catch (error) {
    console.error('❌ 시간 포맷팅 실패:', error);
    return '-';
  }
}

function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '-';

  try {
    const date = new Date(dateTimeString);
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');

    return `${MM}/${dd} ${hh}:${mm}`;
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

// 공통 함수들 (가정)
function showLoading(message) {
  console.log('로딩 중:', message);
}

function hideLoading() {
  console.log('로딩 완료');
}

function showToast(message, type) {
  console.log(`${type.toUpperCase()}: ${message}`);
  alert(message); // 실제로는 토스트 메시지를 구현
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
window.loadUsageHistory = loadUsageHistory;
window.loadPaymentHistory = loadPaymentHistory;
window.loadReservationHistory = loadReservationHistory;
window.showUsageDetail = showUsageDetail;
window.downloadUsageReceipt = downloadUsageReceipt;
window.showPaymentDetail = showPaymentDetail;
window.downloadPaymentReceipt = downloadPaymentReceipt;
window.showReservationDetail = showReservationDetail;
window.cancelReservation = cancelReservation;
window.exportRecords = exportRecords;
window.closeModal = closeModal;
window.downloadReceipt = downloadReceipt;