// ========================================
// 이용 내역 (my-records.js) - PDF 명세서 기준
// ========================================

let recordsUpdateInterval = null;
let currentFilters = {
  limit: 5
};
let currentPage = 1;
let totalPages = 1;
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

  loadUsageSummary();  // ✅ 요약 통계 먼저 불러옴
  loadUsageHistory();  // ✅ 내역은 페이징으로 로드

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
async function loadUsageHistory(page = 1, filters = currentFilters) {
  const queryParams = new URLSearchParams();

  queryParams.append('page', page);
  queryParams.append('limit', filters.limit || 5);

  // ✅ 나머지 필터도 다 붙이기
  if (filters.startDate) queryParams.append('startDate', filters.startDate);
  if (filters.endDate) queryParams.append('endDate', filters.endDate);
  if (filters.type) queryParams.append('type', filters.type);
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.keyword) queryParams.append('keyword', filters.keyword);

  const res = await fetch(`/api/usage/history/paged?${queryParams.toString()}`, {
    method: 'GET',
    credentials: 'include'
  });

  const data = await res.json();
  console.log('📦 서버 응답 전체:', data);

  currentPage = data.currentPage || page;
  totalPages = data.totalPages || 1;

  if (data.content) {
    updateUsageHistoryList(data.content);
  }

  updatePagination('usage', {
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    currentPage: data.currentPage,
    pageSize: data.pageSize
  });
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

async function loadUsageSummary() {
  try {
    const res = await fetch('/api/usage/summary', {
      method: 'GET',
      credentials: 'include'
    });

    const summary = await res.json();
    updateUsageSummary(summary);
  } catch (e) {
    console.error('❌ 요약 통계 로드 실패:', e);
  }
}

// PDF 명세서에 따른 통계 정보 업데이트
function updateUsageSummary(summary) {
  // 총 이용횟수
  updateElement('total-count', summary.totalCount || 0);
  updateElement('usage-count', summary.totalCount || 0);

  // 총 이용시간 (분 → 시간)
  const totalHours = Math.floor((summary.totalMinutes || 0) / 60);
  updateElement('total-time', totalHours + 'h');
  updateElement('usage-time', totalHours + 'h');

  // 총 결제금액
  const totalPaid = summary.totalPaid || 0;
  updateElement('total-paid', '₩' + totalPaid.toLocaleString());
  updateElement('usage-paid', '₩' + totalPaid.toLocaleString());

  // 평균 이용시간 (분 → 시간. 한 자리 소수점까지 표시)
  const avgHours = ((summary.averageMinutes || 0) / 60).toFixed(1);
  updateElement('average-time', avgHours + 'h');
  updateElement('usage-average', avgHours + 'h');

  console.log('📊 이용 내역 통계 업데이트 완료:', summary);
}

// PDF 명세서에 따른 이용 내역 목록 업데이트
function updateUsageHistoryList(history) {
  const historyContainer = document.querySelector('.usage-history, .history-list');
  if (!historyContainer) return;

  // 기존 항목 제거
  const existingItems = historyContainer.querySelectorAll('.history-item, .usage-item, .empty-message');
  existingItems.forEach(item => item.remove());

  const totalRows = 5;
  const actualCount = history?.length || 0;

  if (actualCount > 0) {
    // 실제 항목 추가
    history.forEach(record => {
      const item = createUsageHistoryItem(record);
      historyContainer.appendChild(item);
    });

    // 부족한 만큼 빈 카드 추가
    for (let i = 0; i < totalRows - actualCount; i++) {
      const filler = document.createElement('div');
      filler.className = 'history-item filler-item';
      filler.innerHTML = `
        <div class="history-date">&nbsp;</div>
        <div class="history-duration"><div class="duration-main">&nbsp;</div></div>
        <div class="history-time">&nbsp;</div>
        <div class="history-car"><div class="car-number">&nbsp;</div></div>
        <div class="history-fee"><div class="fee-amount">&nbsp;</div></div>
        <div class="history-status"><span class="history-status">&nbsp;</span></div>
        <div class="history-actions">&nbsp;</div>
      `;
      historyContainer.appendChild(filler);
    }
  } else {
    // 빈 메시지 출력
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
  item.className = 'history-item';
  item.setAttribute('data-record-id', record.id || '');

  const statusKey = record.status.toLowerCase(); // "완료" -> "완료"
  const statusText = getUsageStatusText(record.status);
  const statusClass = getUsageStatusClass(record.status); // 새로운 함수로 매핑

  item.innerHTML = `
    <div class="history-date">
      ${formatDate(record.date)} (${getKoreanDayOfWeek(record.date)})
    </div>
    <div class="history-duration">
      <div class="duration-main">${record.duration}</div>
    </div>
    <div class="history-time">
      ${record.startTime} ~ ${record.endTime || '이용중'}
    </div>
    <div class="history-car">
      <div class="car-number">${escapeHtml(record.carNumber)}</div>
    </div>
    <div class="history-fee">
      <div class="fee-amount">₩${record.fee.toLocaleString()}</div>
    </div>
    <div class="history-status">
      <span class="history-status ${statusClass}">${statusText}</span>
    </div>
    <div class="history-actions">
      <button class="usage-btn usage-btn-detail" onclick="showUsageDetail('${record.id}')">상세</button>
      ${record.status === '완료' ? `
        <button class="usage-btn usage-btn-receipt" onclick="downloadUsageReceipt('${record.id}')">영수증</button>
      ` : ''}
    </div>
  `;

  return item;
}

// 상태 텍스트 반환 (한국어 유지)
function getUsageStatusText(status) {
  const statusMap = {
    '이용중': '이용중',
    '완료': '완료',
    '취소': '취소'
  };
  return statusMap[status] || status;
}

function getUsageStatusClass(status) {
  const classMap = {
    '이용중': 'pending',
    '완료': 'completed',
    '취소': 'cancelled'
  };
  return classMap[status] || '';
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

async function loadTabData(tabType, page = 1, filters = currentFilters) {
  switch(tabType) {
    case 'usage':
      await loadUsageHistory(page, filters);
      break;
    case 'payment':
      await loadPaymentHistory(page, filters);
      break;
    case 'reservation':
      await loadReservationHistory(page, filters);
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
    const queryParams = new URLSearchParams();
    if (filters.startDate) queryParams.append('startDate', filters.startDate);
    if (filters.endDate) queryParams.append('endDate', filters.endDate);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.keyword) queryParams.append('keyword', filters.keyword);
    queryParams.append('page', page);
    queryParams.append('limit', 5); // ✅ 고정된 페이지 크기

    const res = await fetch(`/api/payment/history?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'include'
    });

    const data = await res.json();
    console.log('📦 결제 내역 서버 응답 전체:', data);  // ✅ 전체 구조 확인
    console.log('📦 pagination:', data.pagination);     // ✅ 페이징 정보만 따로 확인
    console.log('📦 payments:', data.payments);         // ✅ 결제 목록만 따로 확인
    currentPage = page;
    totalPages = data.pagination?.totalPages || 1;

// ✅ 이 부분 수정: content에서 꺼내기
    if (data.pagination?.content) {
      updatePaymentHistoryList(data.pagination.content);
    }

// ✅ updatePagination에도 맞춰주기
    if (data.pagination) {
      updatePagination('payment', {
        totalElements: data.pagination.totalElements,
        totalPages: data.pagination.totalPages,
        currentPage: data.pagination.currentPage,
        pageSize: data.pagination.pageSize
      });
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
  const container = document.querySelector('.payment-history');
  if (!container) return;

  container.innerHTML = '';

  // ✅ 헤더 고정
  const header = document.createElement('div');
  header.className = 'usage-history-header';
  header.innerHTML = `
    <div>날짜</div>
    <div>결제시간</div>
    <div>결제수단</div>
    <div>차량</div>
    <div>요금</div>
    <div>상태</div>
    <div>작업</div>
  `;
  container.appendChild(header);

  const totalRows = 5;
  const actualCount = payments?.length || 0;

  if (actualCount > 0) {
    payments.forEach(payment => {
      const item = createPaymentHistoryItem(payment);
      container.appendChild(item);
    });

    // ❗ 부족한 행만큼 filler 추가
    for (let i = 0; i < totalRows - actualCount; i++) {
      const filler = document.createElement('div');
      filler.className = 'history-item filler-item';
      filler.innerHTML = `
        <div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div>
        <div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div>
      `;
      container.appendChild(filler);
    }
  } else {
    // ❗ 결제 내역 없음 메시지
    const emptyItem = document.createElement('div');
    emptyItem.className = 'history-item empty-item';
    emptyItem.innerHTML = `
      <div class="item-empty" style="grid-column: span 7; text-align: center; padding: 2rem; color: #64748b;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">💳</div>
        <p>조건에 맞는 결제 내역이 없습니다.</p>
      </div>
    `;
    container.appendChild(emptyItem);
  }
}


function createPaymentHistoryItem(payment) {
  const item = document.createElement('div');
  item.className = 'history-item';
  item.setAttribute('data-payment-id', payment.paymentId || '');

  const amount = typeof payment.totalFee === 'number' ? payment.totalFee : 0;
  const isCancelled = payment.cancelled === true;
  const statusText = isCancelled ? '환불 완료' : '결제 완료';
  const statusClass = isCancelled ? 'cancelled' : 'completed';
  const dateText = formatDate(payment.paymentTime);
  const dayText = getKoreanDayOfWeek(dateText);
  const timeText = payment.paymentTime;
  const methodText = getPaymentMethodText(payment.paymentMethod);


  item.innerHTML = `
  <div class="history-date">
    ${dateText} (${dayText})
  </div>
  <div class="history-duration">
    <div class="duration-main">${timeText}</div>
  </div>
  <div class="history-time">
    ${methodText}
  </div>
  <div class="history-car">
    <div class="car-number">${payment.carNumber || '-'}</div>
  </div>
  <div class="history-fee">
    <div class="fee-amount">₩${amount.toLocaleString()}</div>
  </div>
  <div class="history-status">
    <span class="history-status ${statusClass}">${statusText}</span>
  </div>
  <div class="item-actions">
    <button class="usage-btn usage-btn-detail" onclick="showPaymentDetail('${payment.paymentId}')">상세</button>
    <button class="usage-btn usage-btn-receipt" onclick="downloadPaymentReceipt('${payment.paymentId}')" style="${isCancelled ? 'display: none;' : ''}">영수증</button>
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
    const queryParams = new URLSearchParams({
      page,
      limit: filters.limit || 10,
      startDate: filters.startDate || '',
      endDate: filters.endDate || '',
      status: filters.status || '',
      keyword: filters.keyword || ''
    });

    const res = await fetch(`/api/reservations/history?${queryParams.toString()}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!res.ok) throw new Error('서버 응답 오류');

    const data = await res.json();
    console.log('📦 예약 내역 응답:', data);

    currentPage = page;
    totalPages = data.pagination?.totalPages || 1;

    // ✅ 여기 reservations로 바꿔야 함!
    if (data.reservations) {
      updateReservationHistoryList(data.reservations);
    }

    if (data.pagination) {
      updatePagination('reservation', {
        totalElements: data.pagination.totalCount,
        totalPages: data.pagination.totalPages,
        currentPage: data.pagination.currentPage,
        pageSize: filters.limit || 10
      });
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
  const container = document.querySelector('#reservation-records .history-list');
  if (!container) return;

  const totalRows = 5;
  const actualCount = reservations?.length || 0;

  // 헤더 고정
  container.innerHTML = `
    <div class="usage-history-header">
      <div>날짜</div>
      <div>시간</div>
      <div>장소</div>
      <div>차량번호</div>
      <div>요금</div>
      <div>상태</div>
      <div>액션</div>
    </div>
  `;

  if (actualCount > 0) {
    reservations.forEach(reservation => {
      const item = createReservationHistoryItem(reservation);
      container.appendChild(item);
    });

    // 부족한 만큼 filler div 추가
    for (let i = 0; i < totalRows - actualCount; i++) {
      const filler = document.createElement('div');
      filler.className = 'history-item filler-item';
      filler.innerHTML = `
        <div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div>
        <div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div><div>&nbsp;</div>
      `;
      container.appendChild(filler);
    }
  } else {
    // 비어있을 때 메시지 출력
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'empty-message';
    emptyMsg.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #64748b;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
        <p>조건에 맞는 예약 내역이 없습니다.</p>
      </div>
    `;
    container.appendChild(emptyMsg);
  }
}

function createReservationHistoryItem(reservation) {
  const item = document.createElement('div');
  item.className = 'history-item';

  const statusClass = getReservationStatusClass(reservation.status);
  const statusText = getReservationStatusText(reservation.status);
  const date = formatDate(reservation.reservationStart);
  const start = formatTime(reservation.reservationStart);
  const end = formatTime(reservation.reservationEnd);


  item.innerHTML = `
    <div class="history-date">${date}</div>
    <div class="history-duration">
      <div class="duration-main">${start} ~ ${end}</div>
    </div>
    <div class="history-spot">천호 주차장</div>  <!-- 슬롯 칸 (빈칸 유지) -->
    <div class="history-car">${reservation.carNumber}</div>
    <div class="history-fee">₩${reservation.fee.toLocaleString()}</div>
      <div class="history-status ${statusClass}">
        ${statusText}
      </div>
    <div class="history-actions">
      <button class="usage-btn usage-btn-detail" onclick="showReservationDetail('${reservation.id}')">상세</button>
      ${reservation.status === 'PAID' ? `
        <button class="usage-btn usage-btn-receipt"
  onclick="confirmCancel(
    'reservation',
    ${reservation.id},
    ${reservation.fee},
    ${reservation.expectedRefundAmount ?? reservation.fee}
  )">
  취소
</button
      ` : ''}
    </div>
  `;
  return item;
}

function getReservationStatusText(status) {
  const statusMap = {
    'ACTIVE': '예약 중',
    'PAID': '결제완료',
    'CANCELLED': '취소완료',
    'FAILED': '결제 실패',
    'COMPLETED': '이용 완료',
    'EXPIRED': '만료',
    'NO_SHOW': '미이용'
  };
  return statusMap[status] || status;
}

function getReservationStatusClass(status) {
  const classMap = {
    'ACTIVE': 'status-upcoming',
    'PAID': 'completed',
    'CANCELLED': 'cancelled',
    'FAILED': 'status-fire',
    'COMPLETED': 'status-completed',
    'EXPIRED': 'status-muted',
    'NO_SHOW': 'status-muted'
  };
  return classMap[status] || '';

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
  // 공통 필터 값 수집
  const rawFilters = {
    startDate: document.getElementById('date-from')?.value,
    endDate: document.getElementById('date-to')?.value,
    type: document.getElementById('record-type')?.value,
    status: document.getElementById('status-filter')?.value,
    keyword: document.getElementById('search-keyword')?.value?.trim()
  };

  // 날짜 유효성 검사
  if (rawFilters.startDate && rawFilters.endDate) {
    const start = new Date(rawFilters.startDate);
    const end = new Date(rawFilters.endDate);
    if (start > end) {
      showToast('시작일이 종료일보다 늦을 수 없습니다.', 'error');
      return;
    }
  }

  // 탭별 필터 변환
  currentFilters = mapFiltersByTab(currentTab, rawFilters);

  // 빈 값 제거 (null 또는 'all' 제거)
  Object.keys(currentFilters).forEach(key => {
    const v = currentFilters[key];
    if (v === undefined || v === null || v === '' || v === 'all') {
      delete currentFilters[key];
    }
  });

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

function mapFiltersByTab(tab, filters) {
  const mapped = {
    startDate: filters.startDate,
    endDate: filters.endDate,
    keyword: filters.keyword
  };

  if (tab === 'usage') {
    mapped.type = filters.type === '일반' ? 'NORMAL'
        : filters.type === '정기권' ? 'SUBSCRIPTION'
            : null;

    mapped.status = filters.status === '이용중' ? 'IN_PROGRESS'
        : filters.status === '완료' ? 'COMPLETED'
            : null;

  } else if (tab === 'reservation') {
    mapped.type = filters.type === '일일' ? 'DAILY'
        : filters.type === '월정기' ? 'MONTHLY'
            : null;

    mapped.status = filters.status === '예정' ? 'UPCOMING'
        : filters.status === '취소됨' ? 'CANCELLED'
            : null;

  } else if (tab === 'payment') {
    mapped.type = filters.type === '주차결제' ? 'PARKING'
        : filters.type === '정기권결제' ? 'SUBSCRIPTION'
            : null;

    mapped.status = filters.status === '성공' ? 'SUCCESS'
        : filters.status === '환불' ? 'REFUNDED'
            : null;
  }

  return mapped;
}

// ========================================
// 페이지네이션
// ========================================
function updatePagination(type, pagination) {
  const { currentPage = 1, totalPages = 1, totalElements = 0 } = pagination;

  document.getElementById(`${type}-page-info`).textContent =
      `${currentPage} / ${totalPages} 페이지 (총 ${totalElements}건)`;

  const prevBtn = document.getElementById(`${type}-prev-page`);
  const nextBtn = document.getElementById(`${type}-next-page`);

  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;

  prevBtn.onclick = () => {
    if (currentPage > 1) {
      loadTabData(currentTab, currentPage - 1);
    }
  };

  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      loadTabData(currentTab, currentPage + 1);
    }
  };
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
    const date = new Date(timeString);
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


////결제, 예약 취소 팝업
//records.js에 넣으면 됩니다.


// 팝업 열기 함수
async function loadRefundPolicyText() {
  try {
    const res = await fetch('/admin/policy/refund/active');
    const data = await res.json();

    const list = document.querySelector('.refund-policy-list');
    if (!list) return;

    list.children[0].innerHTML = `결제 후 <strong>${data.refundTimeLimitMinutes}분 이내</strong> 환불 시 전액 환불됩니다.`;

    const penalty2dPercent = (data.penaltyBefore2days * 100).toFixed(0);
    list.children[1].innerHTML = `예약일 <strong>2일 전까지</strong> 취소 시 ${penalty2dPercent == 0 ? '전액 환불됩니다.' : `<strong>${penalty2dPercent}%</strong> 위약금이 부과됩니다.`}`;

    const penalty1dPercent = (data.penaltyBefore1day * 100).toFixed(0);
    list.children[2].innerHTML = `예약일 <strong>1일 전</strong> 취소 시 <strong>${penalty1dPercent}%</strong> 위약금이 부과됩니다.`;

    list.children[3].innerHTML = data.penaltySameOrAfter >= 1
        ? `<strong>예약 당일</strong> 취소 시 <strong>환불이 불가</strong>합니다.`
        : `<strong>예약 당일</strong> 취소 시 <strong>${(data.penaltySameOrAfter * 100).toFixed(0)}%</strong> 위약금이 부과됩니다.`;

  } catch (err) {
    console.error('환불 정책 로딩 실패:', err);
  }
}

// 팝업 열기 함수
function confirmCancel(type, id, originalAmount = 10000, refundAmount = 9000) {
  const modal = document.getElementById('refundModal');
  const reasonInput = document.getElementById('refundReason');

  // 1. 제목 변경
  const title = type === 'payment' ? '결제 취소 안내' : '예약 취소 안내';
  const titleElement = modal.querySelector('h3');
  if (titleElement) {
    titleElement.innerText = title;
  }

  // 2. 동적 금액 표시
  document.getElementById('refundOriginalAmount').innerText = originalAmount.toLocaleString() + '원';
  document.getElementById('refundAmountDisplay').innerText = refundAmount.toLocaleString() + '원';

  // 3. 사유 입력창 초기화 및 안내 문구 변경
  reasonInput.placeholder = `${type === 'payment' ? '결제' : '예약'} 취소 사유를 입력해주세요`;
  reasonInput.value = '';

  // 4. 환불 정책 안내 문구 동적 로드
  loadRefundPolicyText();

  // 5. ‘환불 진행’ 버튼 동작 설정
  const confirmBtn = modal.querySelector('.modal-actions .btn.danger');
  confirmBtn.onclick = function () {
    const reason = reasonInput.value.trim();
    if (!reason) {
      alert('환불 사유를 입력해주세요.');
      return;
    }

    closeRefundModal(); // 팝업 닫기
    cancelItem(type, id, reason); // 실제 취소 처리
  };

  // 6. 팝업 띄우기
  modal.style.display = 'flex';
}

// 팝업 닫기 함수
function closeRefundModal() {
  const modal = document.getElementById('refundModal');
  modal.style.display = 'none';
}

async function cancelItem(type, id, reason) {
  if (type !== 'reservation') {
    alert('❌ 지원하지 않는 환불 유형입니다.');
    return;
  }

  const isSure = confirm("정말 환불하시겠습니까?");
  if (!isSure) return;

  try {
    const res = await fetch('/api/reservations/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        reservationId: Number(id),
        reason
      })
    });

    const result = await res.json();

    if (res.ok && result.success) {
      alert("✅ " + result.message);
      location.reload();
    } else {
      alert("❌ 환불 실패: " + (result.message || "알 수 없는 오류"));
    }

  } catch (err) {
    console.error("❌ 네트워크 오류:", err);
    alert("서버 통신 오류가 발생했습니다.");
  }

  closeRefundModal();
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