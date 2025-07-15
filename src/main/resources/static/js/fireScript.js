// 전역 변수
let fireDetectionData = [];
let parkingData = [];
let memberData = [];
let paymentData = [];
let systemLogs = [];
let currentPage = 0;// 전역 변수로 현재 페이지 추적
let totalPages =0;
const pageSize = 3;   // 필요에 따라 조정 가능


// 주차 제한 상수
const PARKING_LIMITS = {
  TOTAL_SPACES: 20,
  MONTHLY_LIMIT: 8,
  DAILY_LIMIT: 20
};

// 주차 현황 데이터
let parkingStatus = {
  totalSpaces: 20,
  monthlyLimit: 8,
  currentMonthly: 5,
  currentDaily: 8,
  currentGeneral: 2,
  approvedMonthly: 5,
  approvedDaily: 8,
  waitingMonthly: 2,
  waitingDaily: 1
};

// 샘플 데이터
const sampleFireData = [
  {
    id: '20250710001',
    detectedAt: '2025-07-10 10:14',
    location: '1층 주차장',
    label: '화재',
    confidence: '87.5%',
    adminJudgment: '화재 확인',
    alertStatus: '전송 완료',
    alertTime: '2025-07-10 10:15',
    notes: '라이터에 발화함'
  },
  {
    id: '20250710002',
    detectedAt: '2025-07-10 10:32',
    location: '2층 주차장',
    label: '화재',
    confidence: '94.3%',
    adminJudgment: '화재 확인',
    alertStatus: '전송 완료',
    alertTime: '2025-07-10 10:32',
    notes: '불꽃 명확히 포착'
  },
  {
    id: '20250710003',
    detectedAt: '2025-07-10 11:00',
    location: '3층 주차장',
    label: '정상',
    confidence: '99.1%',
    adminJudgment: '정상',
    alertStatus: '전송 안함',
    alertTime: '-',
    notes: '오탐 없음'
  }
];

const sampleParkingData = [
  {
    id: 'req20250710001',
    carNumber: '555허 5556',
    requester: '소지섭',
    type: '월주차',
    requestMonth: '7월',
    requestDate: '',
    status: '승인',
    requestDay: '2025-06-23',
    approvalDate: '2025-06-24',
    paymentStatus: '결재완료'
  },
  {
    id: 'req20250710002',
    carNumber: '444헐 4444',
    requester: '이정재',
    type: '월주차',
    requestMonth: '7월',
    requestDate: '',
    status: '미승인',
    requestDay: '2025-06-25',
    approvalDate: '',
    paymentStatus: '미결재'
  },
  {
    id: 'req20250710003',
    carNumber: '777럭 7777',
    requester: '강민호',
    type: '일주차',
    requestMonth: '',
    requestDate: '2025-07-10',
    status: '미승인',
    requestDay: '2025-07-10',
    approvalDate: '',
    paymentStatus: '미결재'
  },
  {
    id: 'req20250710004',
    carNumber: '888가 8888',
    requester: '김영희',
    type: '월주차',
    requestMonth: '7월',
    requestDate: '',
    status: '미승인',
    requestDay: '2025-07-10',
    approvalDate: '',
    paymentStatus: '미결재'
  },
  {
    id: 'req20250710005',
    carNumber: '999나 9999',
    requester: '박철수',
    type: '월주차',
    requestMonth: '7월',
    requestDate: '',
    status: '미승인',
    requestDay: '2025-07-10',
    approvalDate: '',
    paymentStatus: '미결재'
  }
];

const sampleMemberData = [
  {
    id: 'M001',
    name: '김민수',
    carNumber: '12가3456',
    carModel: 'BMW 520i',
    phone: '010-1234-5678',
    email: 'kim@example.com',
    joinDate: '2025-01-15',
    status: '활성',
    membership: '월주차'
  },
  {
    id: 'M002',
    name: '이지은',
    carNumber: '22나9845',
    carModel: 'Mercedes C200',
    phone: '010-2345-6789',
    email: 'lee@example.com',
    joinDate: '2025-02-20',
    status: '활성',
    membership: '일반'
  },
  {
    id: 'M003',
    name: '박정훈',
    carNumber: '31다8392',
    carModel: 'Audi A4',
    phone: '010-3456-7890',
    email: 'park@example.com',
    joinDate: '2025-03-10',
    status: '비활성',
    membership: '월주차'
  },
  {
    id: 'M004',
    name: '최미영',
    carNumber: '44러4444',
    carModel: 'Genesis G90',
    phone: '010-4567-8901',
    email: 'choi@example.com',
    joinDate: '2025-04-05',
    status: '활성',
    membership: '월주차'
  }
];

const samplePaymentData = [
  {
    id: 'PAY001',
    carNumber: '12가3456',
    payer: '김민수',
    type: '월주차',
    amount: '100,000원',
    method: '카드',
    time: '2025-07-10 09:30',
    status: '완료'
  },
  {
    id: 'PAY002',
    carNumber: '22나9845',
    payer: '이지은',
    type: '시간주차',
    amount: '3,600원',
    method: '카카오페이',
    time: '2025-07-10 14:20',
    status: '완료'
  },
  {
    id: 'PAY003',
    carNumber: '31다8392',
    payer: '박정훈',
    type: '일주차',
    amount: '12,000원',
    method: '카드',
    time: '2025-07-10 08:15',
    status: '실패'
  },
  {
    id: 'PAY004',
    carNumber: '44러4444',
    payer: '최미영',
    type: '월주차',
    amount: '100,000원',
    method: '네이버페이',
    time: '2025-07-10 11:45',
    status: '완료'
  }
];

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  console.log('🅿️ AI 주차 관리 시스템 초기화');
  
  // 기본 설정
  updateCurrentTime();
  loadFireDetectionDataFromServer();
  loadSampleData();
  setupEventListeners();
  startRealTimeUpdates();
  
  // 페이지별 초기화
  initializePage();
  
  console.log('시스템 초기화 완료');
});

// 페이지별 초기화
function initializePage() {
  const currentPage = getCurrentPageType();
  
  switch(currentPage) {
    case 'dashboard':
      initializeDashboard();
      break;
    case 'parking':
      initializeParkingManagement();
      break;
    case 'fee':
      initializeFeeManagement();
      break;
    case 'fire':
      initializeFireManagement();
      break;
    case 'member':
      initializeMemberManagement();
      break;
    case 'system':
      initializeSystemLogs();
      break;
    default:
      console.log('알 수 없는 페이지 타입');
  }
}

// 현재 페이지 타입 확인
function getCurrentPageType() {
  const path = window.location.pathname;
  const filename = path.split('/').pop();
  
  if (filename === 'index.html' || filename === '' || filename === '/') {
    return 'dashboard';
  } else if (filename.includes('parking')) {
    return 'parking';
  } else if (filename.includes('fee')) {
    return 'fee';
  } else if (filename.includes('fire')) {
    return 'fire';
  } else if (filename.includes('member')) {
    return 'member';
  } else if (filename.includes('system')) {
    return 'system';
  }
  
  return 'dashboard';
}

// 대시보드 초기화
function initializeDashboard() {
  console.log('대시보드 초기화');
  updateStats();
  updateParkingStatus();
}

// 주차 관리 초기화
function initializeParkingManagement() {
  console.log('주차 관리 초기화');
  renderParkingTable();
  updateParkingStatus();
  displayCapacityWarning();
}

// 요금 관리 초기화
function initializeFeeManagement() {
  console.log('요금 관리 초기화');
  renderPaymentTable();
}

// 화재 관리 초기화
function initializeFireManagement() {
  console.log('화재 관리 초기화');
  renderFireTable();
}

// 회원 관리 초기화
function initializeMemberManagement() {
  console.log('회원 관리 초기화');
  renderMemberTable();
}

// 시스템 로그 초기화
function initializeSystemLogs() {
  console.log('시스템 로그 초기화');
  renderSystemLogsTable();
}

// 샘플 데이터 로드
function loadSampleData() {
  // fireDetectionData = [...sampleFireData];
  parkingData = [...sampleParkingData];
  memberData = [...sampleMemberData];
  paymentData = [...samplePaymentData];
  
  console.log('데이터 로드 완료:', {
    fire: fireDetectionData.length,
    parking: parkingData.length,
    member: memberData.length,
    payment: paymentData.length
  });
}

function loadFireDetectionDataFromServer(page = currentPage, size = pageSize) {
  fetch(`/fire/logs/paged?page=${page}&size=${size}`) // 🔁 실제 스프링 API 엔드포인트 주소
      .then(response => response.json())
      .then(data => {
        fireDetectionData = data.content;
        currentPage = data.currentPage;       // 🔹 현재 페이지 업데이트
        totalPages = data.totalPages;         // 🔹 전체 페이지 수 업데이트
        applyFireFilters(); // 테이블 렌더링
      })
      .catch(error => {
        console.error('🔥 화재 감지 데이터 로드 실패:', error);
        showAlert('화재 감지 데이터를 불러오는 중 오류가 발생했습니다.');
      });
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 필터 버튼 이벤트
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      setActiveFilter(this);
      applyFilters();
    });
  });

  // 전체 선택 체크박스
  const selectAllCheckbox = document.getElementById('selectAll');
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function() {
      toggleSelectAll(this.checked);
    });
  }

  // 키보드 단축키
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      saveCurrentSettings();
    }
    if (e.key === 'F5') {
      e.preventDefault();
      refreshCurrentSection();
    }
    if (e.key === 'Escape') {
      closeModal();
      closeAlert();
    }
  });
}

// 실시간 업데이트 시작
function startRealTimeUpdates() {
  setInterval(updateCurrentTime, 1000);
  setInterval(updateCCTVTimestamps, 5000);
  setInterval(updateStats, 30000);
  setInterval(updateParkingStatus, 10000);
}

// 현재 시간 업데이트
function updateCurrentTime() {
  const now = new Date();
  const timeString = now.toLocaleString('ko-KR');
  
  updateElementIfExists('currentDate', `작성일: ${timeString}`);
  updateElementIfExists('lastFireCheck', '방금 전');
}

// CCTV 타임스탬프 업데이트
function updateCCTVTimestamps() {
  const timestamps = document.querySelectorAll('.timestamp');
  const now = new Date();
  const timeString = now.toLocaleString('ko-KR');
  
  timestamps.forEach((timestamp, index) => {
    if (!timestamp.closest('.cctv-display')?.classList.contains('offline')) {
      timestamp.textContent = timeString;
    }
  });
}

// 통계 업데이트
function updateStats() {
  const stats = {
    fireAlerts: Math.floor(Math.random() * 3),
    pendingApprovals: parkingStatus.waitingMonthly + parkingStatus.waitingDaily,
    todayRevenue: '₩' + (2.1 + Math.random() * 0.5).toFixed(1) + 'M',
    occupancyRate: Math.round(((PARKING_LIMITS.TOTAL_SPACES - parkingStatus.availableSpaces) / PARKING_LIMITS.TOTAL_SPACES) * 100) + '%'
  };
  
  updateElementIfExists('fireAlerts', stats.fireAlerts);
  updateElementIfExists('pendingApprovals', stats.pendingApprovals);
  updateElementIfExists('todayRevenue', stats.todayRevenue);
  updateElementIfExists('occupancyRate', stats.occupancyRate);
}

// 주차 현황 업데이트
function updateParkingStatus() {
  const approvedMonthly = parkingData.filter(item => 
    item.type === '월주차' && item.status === '승인'
  ).length;
  
  const approvedDaily = parkingData.filter(item => 
    item.type === '일주차' && item.status === '승인'
  ).length;
  
  const waitingMonthly = parkingData.filter(item => 
    item.type === '월주차' && item.status === '미승인'
  ).length;
  
  const waitingDaily = parkingData.filter(item => 
    item.type === '일주차' && item.status === '미승인'
  ).length;
  
  parkingStatus.approvedMonthly = approvedMonthly;
  parkingStatus.approvedDaily = approvedDaily;
  parkingStatus.waitingMonthly = waitingMonthly;
  parkingStatus.waitingDaily = waitingDaily;
  
  const totalUsed = approvedMonthly + approvedDaily + parkingStatus.currentGeneral;
  parkingStatus.availableSpaces = Math.max(0, PARKING_LIMITS.TOTAL_SPACES - totalUsed);
  
  updateElementIfExists('currentMonthly', `${approvedMonthly}대`);
  updateElementIfExists('currentDaily', `${approvedDaily}대`);
  updateElementIfExists('availableSpaces', `${parkingStatus.availableSpaces}대`);
  updateElementIfExists('monthlyParkingCount', `${approvedMonthly}/${PARKING_LIMITS.MONTHLY_LIMIT}`);
  updateElementIfExists('monthlyLimit', `${approvedMonthly}/${PARKING_LIMITS.MONTHLY_LIMIT}`);
  updateElementIfExists('totalLimit', `${totalUsed}/${PARKING_LIMITS.TOTAL_SPACES}`);
  
  updateElementIfExists('waitingCount', waitingMonthly + waitingDaily);
  updateElementIfExists('approvedCount', approvedMonthly + approvedDaily);
  
  // 회원 관리 통계
  updateElementIfExists('totalMembers', memberData.length);
  updateElementIfExists('activeMembers', memberData.filter(m => m.status === '활성').length);
  updateElementIfExists('monthlyMembers', memberData.filter(m => m.membership === '월주차').length);
  updateElementIfExists('newMembers', Math.floor(Math.random() * 15) + 5);
}

// 용량 경고 표시
function displayCapacityWarning() {
  const existingWarning = document.querySelector('.capacity-warning');
  if (existingWarning) {
    existingWarning.remove();
  }
  
  const warnings = [];
  
  if (parkingStatus.approvedMonthly >= PARKING_LIMITS.MONTHLY_LIMIT) {
    warnings.push(`월주차 한도 초과: ${parkingStatus.approvedMonthly}/${PARKING_LIMITS.MONTHLY_LIMIT}대`);
  }
  
  const totalUsed = parkingStatus.approvedMonthly + parkingStatus.approvedDaily + parkingStatus.currentGeneral;
  if (totalUsed >= PARKING_LIMITS.TOTAL_SPACES) {
    warnings.push(`전체 주차 공간 부족: ${totalUsed}/${PARKING_LIMITS.TOTAL_SPACES}대`);
  }
  
  if (warnings.length > 0) {
    const warningHtml = `
      <div class="capacity-warning">
        <h4>⚠️ 주차 용량 경고</h4>
        ${warnings.map(warning => `<p>${warning}</p>`).join('')}
      </div>
    `;
    
    const parkingSection = document.getElementById('parking-management-section');
    if (parkingSection) {
      parkingSection.insertAdjacentHTML('afterbegin', warningHtml);
    }
  }
}

// 승인 가능 여부 검증
function canApproveRequest(requestData) {
  const result = {
    canApprove: false,
    reason: ''
  };
  
  if (requestData.type === '월주차') {
    if (parkingStatus.approvedMonthly >= PARKING_LIMITS.MONTHLY_LIMIT) {
      result.reason = '월주차 한도 초과 (8대 제한)';
      return result;
    }
  } else if (requestData.type === '일주차') {
    const totalApproved = parkingStatus.approvedMonthly + parkingStatus.approvedDaily;
    if (totalApproved >= PARKING_LIMITS.DAILY_LIMIT) {
      result.reason = '전체 주차 한도 초과 (20대 제한)';
      return result;
    }
  }
  
  const totalUsed = parkingStatus.approvedMonthly + parkingStatus.approvedDaily + parkingStatus.currentGeneral;
  if (totalUsed >= PARKING_LIMITS.TOTAL_SPACES) {
    result.reason = '주차 공간 부족';
    return result;
  }
  
  result.canApprove = true;
  return result;
}

// 요소가 존재할 때만 업데이트
function updateElementIfExists(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}


function loadFireLogsPaged(page = 0, size = pageSize, filters = null) {
  fetch(`/fire/logs/paged?page=${page}&size=${size}`)
      .then(res => res.json())
      .then(data => {
        fireDetectionData = data.content;
        currentPage = data.currentPage;
        totalPages = Math.ceil(data.totalElements / data.pageSize);

        if (filters) {
          // 필터 UI는 이미 적용했으니 데이터 필터만 적용
          applyFireFilters(filters.filter, false);
        } else {
          applyFireFilters(); // 기본 필터 적용
        }
        renderPagination(totalPages, currentPage);
      });
}


function getPageFromURL() {
  const params = new URLSearchParams(window.location.search);
  return parseInt(params.get('page')) || 0;
}

window.addEventListener('DOMContentLoaded', () => {
  const pageFromURL = getPageFromURL();
  const filters = getStoredFireFilters();
  applyStoredFilterUI(filters);
  loadFireLogsPaged(pageFromURL, pageSize, filters);
});

function renderPagination(totalPages, currentPage) {
  const paginationDiv = document.querySelector(".pagination");
  paginationDiv.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '이전';
  prevBtn.onclick = () => {
    if (currentPage > 0) {
      const newPage = currentPage - 1;
      window.history.replaceState({}, '', `?page=${newPage}`);
      loadFireLogsPaged(currentPage - 1);
    }
  };
  paginationDiv.appendChild(prevBtn);

  for (let i = 0; i < totalPages; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i + 1;
    pageBtn.className = (i === currentPage) ? 'active' : '';
    pageBtn.onclick = () => {
      window.history.replaceState({}, '', `?page=${i}`);
      loadFireLogsPaged(i);}
    paginationDiv.appendChild(pageBtn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.textContent = '다음';
  nextBtn.onclick = () => {
    if (currentPage < totalPages - 1){
      const newPage = currentPage + 1;
      window.history.replaceState({}, '', `?page=${newPage}`);
      loadFireLogsPaged(currentPage + 1);
    }
  };
  paginationDiv.appendChild(nextBtn);
}



// 화재 감지 테이블 렌더링
function renderFireTable(data = fireDetectionData) {
  const tableBody = document.getElementById('fireLogTable');
  if (!tableBody) return;
  
  console.log('화재 테이블 렌더링 시작');
  tableBody.innerHTML = '';
  
  if (data && data.length > 0) {
    data.forEach(item => {
      const row = createFireTableRow(item);
      tableBody.appendChild(row);
    });
    
    const remainingRows = Math.max(0, 10 - data.length);
    for (let i = 0; i < remainingRows; i++) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="10">&nbsp;</td>';
      emptyRow.style.height = '45px';
      tableBody.appendChild(emptyRow);
    }
    
    console.log(`화재 테이블 렌더링 완료: ${data.length}개 항목`);
  }
}

// 화재 테이블 행 생성
function createFireTableRow(item) {
  const row = document.createElement('tr');
  row.style.cursor = 'pointer';
  row.onclick = (e) => {
    if (e.target.tagName !== 'BUTTON') {
      showFireDetail(item.id);
    }
  };
  
  const resultClass = item.label === 'fire' ? 'status-fire' : 'status-normal';
  
  row.innerHTML = `
    <td>${item.id}</td>
    <td>${item.detectedAt}</td>
    <td>${item.location}</td>
    <td><span class="${resultClass}">${item.label}</span></td>
    <td>${item.confidence}</td>
    <td>${item.adminJudgment}</td>
    <td>${item.alertStatus}</td>
    <td>${item.alertTime}</td>
    <td>${item.notes}</td>
    <td><button class="action-btn" onclick="event.stopPropagation(); editFireRecord('${item.id}')">수정</button></td>
  `;
  
  return row;
}

// 주차 관리 테이블 렌더링
function renderParkingTable() {
  const tableBody = document.getElementById('parkingTable');
  if (!tableBody) return;
  
  console.log('주차 테이블 렌더링 시작');
  tableBody.innerHTML = '';
  
  parkingData.forEach(item => {
    const row = createParkingTableRow(item);
    tableBody.appendChild(row);
  });
  
  const remainingRows = Math.max(0, 10 - parkingData.length);
  for (let i = 0; i < remainingRows; i++) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="12">&nbsp;</td>';
    emptyRow.style.height = '45px';
    tableBody.appendChild(emptyRow);
  }
  
  console.log(`주차 테이블 렌더링 완료: ${parkingData.length}개 항목`);
}

// 주차 테이블 행 생성
function createParkingTableRow(item) {
  const row = document.createElement('tr');
  
  const statusClass = item.status === '승인' ? 'status-approved' : 'status-waiting';
  const paymentClass = item.paymentStatus === '결재완료' ? 'status-payment-completed' : 'status-payment-pending';
  
  const canApprove = canApproveRequest(item);
  
  let actionButton;
  if (item.status === '승인') {
    actionButton = '<span class="status-approved">완료</span>';
  } else if (!canApprove.canApprove) {
    actionButton = `<span class="status-cannot-approve" title="${canApprove.reason}">승인불가</span>`;
  } else {
    actionButton = `<button class="action-btn primary" onclick="approveRequest('${item.id}')">승인</button>`;
  }
  
  row.innerHTML = `
    <td><input type="checkbox" value="${item.id}" ${!canApprove.canApprove && item.status === '미승인' ? 'disabled' : ''}></td>
    <td>${item.id}</td>
    <td>${item.carNumber}</td>
    <td>${item.requester}</td>
    <td>${item.type}</td>
    <td>${item.requestMonth}</td>
    <td>${item.requestDate}</td>
    <td><span class="${statusClass}">${item.status}</span></td>
    <td>${item.requestDay}</td>
    <td>${item.approvalDate}</td>
    <td><span class="${paymentClass}">${item.paymentStatus}</span></td>
    <td>${actionButton}</td>
  `;
  
  return row;
}

// 회원 관리 테이블 렌더링
function renderMemberTable() {
  const tableBody = document.getElementById('memberTable');
  if (!tableBody) return;
  
  console.log('회원 테이블 렌더링 시작');
  tableBody.innerHTML = '';
  
  memberData.forEach(item => {
    const row = createMemberTableRow(item);
    tableBody.appendChild(row);
  });
  
  const remainingRows = Math.max(0, 10 - memberData.length);
  for (let i = 0; i < remainingRows; i++) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="10">&nbsp;</td>';
    emptyRow.style.height = '45px';
    tableBody.appendChild(emptyRow);
  }
  
  console.log(`회원 테이블 렌더링 완료: ${memberData.length}개 항목`);
}

// 회원 테이블 행 생성
function createMemberTableRow(item) {
  const row = document.createElement('tr');
  
  const statusClass = item.status === '활성' ? 'status-approved' : 'status-waiting';
  
  row.innerHTML = `
    <td>${item.id}</td>
    <td>${item.name}</td>
    <td>${item.carNumber}</td>
    <td>${item.carModel}</td>
    <td>${item.phone}</td>
    <td>${item.email}</td>
    <td>${item.joinDate}</td>
    <td><span class="${statusClass}">${item.status}</span></td>
    <td>${item.membership}</td>
    <td>
      <button class="action-btn" onclick="editMember('${item.id}')">수정</button>
      <button class="action-btn danger" onclick="deleteMember('${item.id}')">삭제</button>
    </td>
  `;
  
  return row;
}

// 결제 내역 테이블 렌더링
function renderPaymentTable() {
  const tableBody = document.getElementById('paymentTable');
  if (!tableBody) return;
  
  console.log('결제 테이블 렌더링 시작');
  tableBody.innerHTML = '';
  
  paymentData.forEach(item => {
    const row = createPaymentTableRow(item);
    tableBody.appendChild(row);
  });
  
  const remainingRows = Math.max(0, 10 - paymentData.length);
  for (let i = 0; i < remainingRows; i++) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="9">&nbsp;</td>';
    emptyRow.style.height = '45px';
    tableBody.appendChild(emptyRow);
  }
  
  console.log(`결제 테이블 렌더링 완료: ${paymentData.length}개 항목`);
}

// 결제 테이블 행 생성
function createPaymentTableRow(item) {
  const row = document.createElement('tr');
  
  const statusClass = item.status === '완료' ? 'status-approved' : 'status-fire';
  
  row.innerHTML = `
    <td>${item.id}</td>
    <td>${item.carNumber}</td>
    <td>${item.payer}</td>
    <td>${item.type}</td>
    <td>${item.amount}</td>
    <td>${item.method}</td>
    <td>${item.time}</td>
    <td><span class="${statusClass}">${item.status}</span></td>
    <td>
      <button class="action-btn" onclick="viewPaymentDetail('${item.id}')">상세</button>
    </td>
  `;
  
  return row;
}

// 시스템 로그 테이블 렌더링
function renderSystemLogsTable() {
  const tableBody = document.getElementById('systemLogsTable');
  if (!tableBody) return;
  
  console.log('시스템 로그 테이블 렌더링 시작');
  tableBody.innerHTML = '';
  
  // 샘플 시스템 로그 데이터
  const sampleLogs = [
    {
      id: 'LOG001',
      time: '2025-07-10 14:30:25',
      level: 'INFO',
      module: '주차관리',
      message: '시스템 정상 작동 중',
      user: 'System',
      ip: '127.0.0.1',
      status: '정상'
    },
    {
      id: 'LOG002',
      time: '2025-07-10 14:25:10',
      level: 'WARNING',
      module: '화재감지',
      message: 'CCTV 4번 연결 불안정',
      user: 'System',
      ip: '127.0.0.1',
      status: '경고'
    },
    {
      id: 'LOG003',
      time: '2025-07-10 14:20:05',
      level: 'ERROR',
      module: '결제시스템',
      message: '결제 서버 응답 지연',
      user: 'System',
      ip: '127.0.0.1',
      status: '오류'
    },
    {
      id: 'LOG004',
      time: '2025-07-10 14:15:33',
      level: 'INFO',
      module: 'CCTV',
      message: '전체 카메라 정상 동작',
      user: 'System',
      ip: '127.0.0.1',
      status: '정상'
    },
    {
      id: 'LOG005',
      time: '2025-07-10 14:10:12',
      level: 'INFO',
      module: '주차관리',
      message: '신규 주차 신청 접수',
      user: 'Admin',
      ip: '192.168.1.100',
      status: '정상'
    }
  ];
  
  sampleLogs.forEach(item => {
    const row = document.createElement('tr');
    
    let levelClass = 'status-normal';
    if (item.level === 'WARNING') levelClass = 'status-waiting';
    if (item.level === 'ERROR') levelClass = 'status-fire';
    
    row.innerHTML = `
      <td>${item.id}</td>
      <td>${item.time}</td>
      <td><span class="${levelClass}">${item.level}</span></td>
      <td>${item.module}</td>
      <td>${item.message}</td>
      <td>${item.user}</td>
      <td>${item.ip}</td>
      <td>${item.status}</td>
      <td><button class="action-btn" onclick="viewLogDetail('${item.id}')">상세</button></td>
    `;
    
    tableBody.appendChild(row);
  });
  
  console.log(`시스템 로그 테이블 렌더링 완료: ${sampleLogs.length}개 항목`);
}

// 활성 필터 설정
function setActiveFilter(activeBtn) {
  const filterBtns = activeBtn.parentElement.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}

// 필터 적용
function applyFilters() {
  const currentPage = getCurrentPageType();
  const activeFilter = document.querySelector('.filter-btn.active');
  if (!activeFilter) return;
  
  const filterValue = activeFilter.dataset.filter;
  
  switch(currentPage) {
    case 'fire':
      applyFireFilters(filterValue);
      break;
    case 'parking':
      applyParkingFilters(filterValue);
      break;
    case 'member':
      applyMemberFilters(filterValue);
      break;
    case 'system':
      applyLogFilters(filterValue);
      break;
  }
}

// 화재 감지 필터 적용
function applyFireFilters(filter = null, updateUI = true) {
  const activeFilter = filter || document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  const locationFilter = document.getElementById('cctvLocationFilter')?.value || '';
  const dateFilter = document.getElementById('dateFilter')?.value || '';

  if (updateUI) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === activeFilter);
    });
  }

  let filteredData = [...fireDetectionData];

  if (activeFilter === 'fire') {
    filteredData = filteredData.filter(item => item.label === 'fire');
  } else if (activeFilter === 'normal') {
    filteredData = filteredData.filter(item => item.label === 'normal');
  }

  if (locationFilter) {
    filteredData = filteredData.filter(item => item.location === locationFilter);
  }

  if (dateFilter) {
    filteredData = filteredData.filter(item => item.detectedAt.startsWith(dateFilter));
  }

  saveFireFilterState();
  renderFireTable(filteredData);
}

function saveFireFilterState() {
  const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  const location = document.getElementById('cctvLocationFilter')?.value || '';
  const date = document.getElementById('dateFilter')?.value || '';

  const state = { filter: activeFilter, location, date };
  sessionStorage.setItem('fireFilterState', JSON.stringify(state));
}

function getStoredFireFilters() {
  return JSON.parse(sessionStorage.getItem('fireFilterState')) || {
    filter: 'all',
    location: '',
    date: ''
  };
}

function applyStoredFilterUI(filters) {
  const { filter = 'all', location = '', date = '' } = filters || getStoredFireFilters();

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  const locationSelect = document.getElementById('cctvLocationFilter');
  if (locationSelect) locationSelect.value = location;

  const dateInput = document.getElementById('dateFilter');
  if (dateInput) dateInput.value = date;
}


// 주차 관리 필터 적용
function applyParkingFilters(filter = null) {
  const activeFilter = filter || document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  
  let filteredData = [...sampleParkingData];
  
  if (activeFilter === 'waiting') {
    filteredData = filteredData.filter(item => item.status === '미승인');
  } else if (activeFilter === 'approved') {
    filteredData = filteredData.filter(item => item.status === '승인');
  } else if (activeFilter === 'monthly') {
    filteredData = filteredData.filter(item => item.type === '월주차');
  } else if (activeFilter === 'daily') {
    filteredData = filteredData.filter(item => item.type === '일주차');
  }
  
  parkingData = filteredData;
  renderParkingTable();
}

// 회원 관리 필터 적용
function applyMemberFilters(filter = null) {
  const activeFilter = filter || document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  
  let filteredData = [...sampleMemberData];
  
  if (activeFilter === 'active') {
    filteredData = filteredData.filter(item => item.status === '활성');
  } else if (activeFilter === 'inactive') {
    filteredData = filteredData.filter(item => item.status === '비활성');
  } else if (activeFilter === 'monthly') {
    filteredData = filteredData.filter(item => item.membership === '월주차');
  }
  
  memberData = filteredData;
  renderMemberTable();
}

// 로그 필터 적용
function applyLogFilters(filter = null) {
  showAlert('로그 필터가 적용되었습니다.');
  renderSystemLogsTable();
}

// 전체 선택 토글
function toggleSelectAll(checked) {
  const checkboxes = document.querySelectorAll('#parkingTable input[type="checkbox"]:not(:disabled)');
  checkboxes.forEach(checkbox => {
    checkbox.checked = checked;
  });
}

// 화재 상세 정보 표시
function showFireDetail(logId) {
  const fireItem = fireDetectionData.find(item => item.id === logId);
  if (!fireItem) return;
  
  const modalContent = `
    <div style="max-width: 600px;">
      <h2>🔥 AI Fire Detection Detail</h2>
      <div style="margin: 20px 0; padding: 20px; border: 2px solid #667eea; border-radius: 15px;">
          <div style="background: #1a202c; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <p style="font-size: 18px;">감지 이미지</p>
            <img src="/images/fire/${fireItem.imagePath}" 
                 alt="감지 이미지" 
                 style="max-width:100%; height: 250px; border-radius: 10px;">
            <p style="margin: 10px 0;">Log ID: ${fireItem.id}</p>
          </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <strong>Log ID:</strong> ${fireItem.id}<br>
            <strong>CCTV 위치:</strong> ${fireItem.location}<br>
            <strong>감지시간:</strong> ${fireItem.detectedAt}
          </div>
          <div>
            <strong>AI 판별 결과:</strong> <span class="${fireItem.label === 'fire' ? 'status-fire' : 'status-normal'}">${fireItem.label}</span><br>
            <label for="fireJudgment"><strong>관리자 판단:</strong></label>
              <select id="fireJudgment" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid #ccc;">
                <option value="판단 대기">판단 대기</option>
                <option value="화재 확인">화재 확인</option>
                <option value="오탐">오탐</option>
                <option value="기타">기타</option>
              </select>
            <br>
            <strong>알림 전송:</strong> ${fireItem.alertTime}
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <strong>Notes</strong>
          <textarea id="fireNote" style="width: 100%; height: 80px; margin-top: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;">${fireItem.notes}</textarea>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button class="action-btn primary" onclick="saveFireNote(${fireItem.id})">저장</button>
          <button class="action-btn" onclick="closeModal()">닫기</button>
          ${fireItem.label === 'fire' ? '<button class="action-btn danger" onclick="showUserAlert()">주차장 사용자 알림</button>' : ''}
        </div>
      </div>
    </div>
  `;
  
  showModal(modalContent);
  document.getElementById('fireJudgment').value = fireItem.adminJudgment || '판단 대기';
}

//노트 저장
function saveFireNote(logId) {
  const noteValue = document.getElementById('fireNote').value;
  const judgmentValue = document.getElementById('fireJudgment').value;

  fetch(`/fire/update-note`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ id: logId, notes: noteValue, adminJudgment: judgmentValue })
  })
      .then(res => res.text())
      .then(msg => {
        showAlert(msg);
        closeModal();
        loadFireDetectionDataFromServer(); // 테이블 갱신
      })
      .catch(err => {
        console.error("노트 저장 실패:", err);
        showAlert("노트 저장 중 오류 발생");
      });
}

// 사용자 알림 표시
function showUserAlert() {
  fetch('/api/members/all')
      .then(res => res.json())
      .then(members => {
        console.log("✅ 전체 members 응답:", members);

        const rows = members.map(m => {
          const hasKakao = !!m.kakaoId && m.kakaoId.trim() !== '';

          const parkingStatus = m.inParking
              ? '<span style="color: #2f855a; font-weight: 600;">주차중</span>'
              : '<span style="color: #e53e3e; font-weight: 600;">부재</span>';

          const type = m.subscription ? '월주차' : '일주차';

          return `
          <tr data-kakao-id="${m.kakaoId || ''}">
            <td>
              <input type="checkbox" class="user-checkbox" ${hasKakao ? '' : 'disabled'}>
            </td>
            <td>${m.carNumber || '-'}</td>
            <td>${m.name || '-'}</td>
            <td>${type}</td>
            <td>${m.phone || '-'}</td>
            <td>
              ${parkingStatus}
              ${!hasKakao ? '<br><span style="color:red; font-size:0.85em;">(카카오 미연동)</span>' : ''}
            </td>
          </tr>
        `;
        }).join('');

        const modalContent = `
        <div style="max-width: 700px;">
          <h2>🔔 주차장 이용자 알림</h2>
          <div style="margin: 20px 0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th><input type="checkbox" onchange="toggleSelectAllUsers(this.checked)"></th>
                  <th>차량 번호</th>
                  <th>주차장 이용자</th>
                  <th>구분</th>
                  <th>전화번호</th>
                  <th>주차장 내 유무</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>

            <div style="margin-top: 30px; display: flex; justify-content: center; gap: 15px;">
              <button class="action-btn" onclick="closeModal()" style="padding: 12px 24px; border-radius: 25px;">Cancel</button>
              <button class="action-btn primary" onclick="sendUserAlert()" style="padding: 12px 24px; border-radius: 25px;">Send</button>
            </div>
          </div>
        </div>
      `;

        showModal(modalContent);
      })
      .catch(err => {
        console.error('❌ 회원 정보 불러오기 실패:', err);
        showAlert('회원 정보를 불러올 수 없습니다.');
      });
}


// 전체 사용자 선택 토글
function toggleSelectAllUsers(checked) {
  const checkboxes = document.querySelectorAll('.user-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = checked;
  });
}

// 사용자 알림 전송
function sendUserAlert() {
  const checkedUsers = document.querySelectorAll('.user-checkbox:checked');
  if (checkedUsers.length === 0) {
    showAlert('알림을 받을 사용자를 선택해주세요.');
    return;
  }

  const selectedUsers = [];
  const kakaoIdsToSend = [];

  checkedUsers.forEach(checkbox => {
    const row = checkbox.closest('tr');
    const carNumber = row.cells[1].textContent;
    const userName = row.cells[2].textContent;
    const phoneNumber = row.cells[4].textContent;
    const kakaoId = row.getAttribute('data-kakao-id');

    selectedUsers.push({ carNumber, userName, phoneNumber });

    if (kakaoId) {
      kakaoIdsToSend.push(kakaoId);
    }
  });

  // 🔴 실제 메시지 전송
  if (kakaoIdsToSend.length > 0) {
    fetch('/api/alert/send-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kakaoIdsToSend)
    })
        .then(res => {
          if (!res.ok) throw new Error("전송 실패");
          return res.text();
        })
        .then(text => {
          console.log("✅ 메시지 전송 성공:", text);
        })
        .catch(err => {
          console.error("❌ 메시지 전송 오류:", err);
          showAlert("❌ 메시지 전송 중 오류가 발생했습니다.");
        });
  }

  closeModal();

  setTimeout(() => {
    const message = `${selectedUsers.length}명에게 화재 알림이 전송되었습니다.\n\n` +
        `전송 메시지: "현재 회원님이 사용중이신 유료주차장에 화재가 발생하였습니다. 안전을 위해 신속히 대피해 주세요."\n\n` +
        `전송 대상:\n${selectedUsers.map(user => `• ${user.userName} (${user.carNumber})`).join('\n')}`;

    showAlert(message);
  }, 500);
}


// 승인 처리
function approveRequest(requestId) {
  const request = parkingData.find(item => item.id === requestId);
  if (!request) return;
  
  const canApprove = canApproveRequest(request);
  if (!canApprove.canApprove) {
    showAlert(`승인 불가: ${canApprove.reason}`);
    return;
  }
  
  request.status = '승인';
  request.approvalDate = new Date().toISOString().split('T')[0];
  request.paymentStatus = '결재대기';
  
  updateParkingStatus();
  renderParkingTable();
  
  showAlert(`${requestId} 요청이 승인되었습니다.`);
}

// 일괄 승인
function bulkApproval() {
  const checkedBoxes = document.querySelectorAll('#parkingTable input[type="checkbox"]:checked:not(:disabled)');
  if (checkedBoxes.length === 0) {
    showAlert('승인할 항목을 선택해주세요.');
    return;
  }
  
  let successCount = 0;
  let failCount = 0;
  const failReasons = [];
  
  checkedBoxes.forEach(checkbox => {
    const requestId = checkbox.value;
    const request = parkingData.find(item => item.id === requestId);
    
    if (request && request.status === '미승인') {
      const canApprove = canApproveRequest(request);
      if (canApprove.canApprove) {
        request.status = '승인';
        request.approvalDate = new Date().toISOString().split('T')[0];
        request.paymentStatus = '결재대기';
        successCount++;
      } else {
        failCount++;
        failReasons.push(`${requestId}: ${canApprove.reason}`);
      }
    }
  });
  
  updateParkingStatus();
  renderParkingTable();
  
  let message = `일괄 승인 완료\n승인: ${successCount}개`;
  if (failCount > 0) {
    message += `\n실패: ${failCount}개\n\n실패 사유:\n${failReasons.join('\n')}`;
  }
  
  showAlert(message);
}

// 일괄 거절
function bulkReject() {
  const checkedBoxes = document.querySelectorAll('#parkingTable input[type="checkbox"]:checked:not(:disabled)');
  if (checkedBoxes.length === 0) {
    showAlert('거절할 항목을 선택해주세요.');
    return;
  }
  
  let rejectCount = 0;
  checkedBoxes.forEach(checkbox => {
    const requestId = checkbox.value;
    const request = parkingData.find(item => item.id === requestId);
    
    if (request && request.status === '미승인') {
      request.status = '거절';
      request.approvalDate = new Date().toISOString().split('T')[0];
      rejectCount++;
    }
  });
  
  updateParkingStatus();
  renderParkingTable();
  
  showAlert(`${rejectCount}개 항목이 일괄 거절되었습니다.`);
}

// 모달 관련 함수들
function showModal(content) {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalContent = document.getElementById('modalContent');
  
  if (modalOverlay && modalContent) {
    modalContent.innerHTML = content;
    modalOverlay.classList.add('active');
    
    const escHandler = function(e) {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    const overlayHandler = function(e) {
      if (e.target === modalOverlay) {
        closeModal();
        modalOverlay.removeEventListener('click', overlayHandler);
      }
    };
    modalOverlay.addEventListener('click', overlayHandler);
  }
}

function closeModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
}

// 알림 팝업 표시
function showAlert(message) {
  const alertPopup = document.getElementById('alertPopup');
  const alertMessage = document.getElementById('alertMessage');
  
  if (alertPopup && alertMessage) {
    alertMessage.textContent = message;
    alertPopup.classList.add('show');
  }
}

// 알림 팝업 닫기
function closeAlert() {
  const alertPopup = document.getElementById('alertPopup');
  if (alertPopup) {
    alertPopup.classList.remove('show');
  }
}

// 기타 함수들 (각 버튼 클릭 시 실행)
function refreshDashboard() {
  updateStats();
  updateParkingStatus();
  showAlert('대시보드를 새로고침했습니다.');
}

function exportDashboardData() {
  showAlert('대시보드 리포트를 내보냅니다.');
}

function refreshFireLog() {
  // 🔄 필터 초기화
  const locationInput = document.getElementById('cctvLocationFilter');
  if (locationInput) locationInput.value = '';

  const dateInput = document.getElementById('dateFilter');
  if (dateInput) dateInput.value = '';

  sessionStorage.removeItem('fireFilterState');

  // 🔁 데이터 재로드
  currentPage = 0;
  loadFireDetectionDataFromServer(currentPage, pageSize, () => {
    showAlert('화재 감지 로그를 새로고침했습니다.');
  });
}

function exportFireLog() {
  showAlert('화재 감지 로그를 내보냅니다.');
}

function addManualFireLog() {
  showAlert('수동 화재 기록 추가 기능입니다.');
}

function editFireRecord(id) {
  showAlert(`${id} 화재 기록을 수정합니다.`);
}

function refreshParkingData() {
  parkingData = [...sampleParkingData];
  renderParkingTable();
  updateParkingStatus();
  displayCapacityWarning();
  showAlert('주차 관리 데이터를 새로고침했습니다.');
}

function addNewMember() {
  showAlert('새 회원 추가 기능입니다.');
}

function editMember(id) {
  showAlert(`회원 ${id}를 수정합니다.`);
}

function deleteMember(id) {
  if (confirm('정말 삭제하시겠습니까?')) {
    showAlert(`회원 ${id}가 삭제되었습니다.`);
  }
}

function exportMemberData() {
  showAlert('회원 데이터를 내보냅니다.');
}

function refreshMemberData() {
  memberData = [...sampleMemberData];
  renderMemberTable();
  showAlert('회원 데이터를 새로고침했습니다.');
}

function createNewPolicy() {
  const modalContent = `
    <div style="max-width: 500px;">
      <h2>새 요금 정책 생성</h2>
      <div style="margin: 20px 0;">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">요금 유형:</label>
          <select style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
            <option>월</option>
            <option>일</option>
            <option>시간</option>
          </select>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">요금 명칭:</label>
          <input type="text" placeholder="예: 월 정기권" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">요금:</label>
          <input type="number" placeholder="요금을 입력하세요" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">적용 시작일:</label>
          <input type="date" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600;">적용 종료일:</label>
          <input type="date" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>
        
        <div style="margin-top: 30px; text-align: center;">
          <button class="action-btn" onclick="closeModal()" style="margin-right: 10px;">뒤로</button>
          <button class="action-btn primary" onclick="saveNewPolicy()">저장</button>
        </div>
      </div>
    </div>
  `;
  
  showModal(modalContent);
}

function saveNewPolicy() {
  showAlert('새 정책이 저장되었습니다.');
  closeModal();
}

function editPolicy(policyId) {
  showAlert(`${policyId} 정책 편집 기능입니다.`);
}

function togglePolicy(policyId) {
  showAlert(`${policyId} 정책 상태가 변경되었습니다.`);
}

function exportPolicyData() {
  showAlert('정책 데이터를 내보냅니다.');
}

function exportPaymentData() {
  showAlert('결제 데이터를 내보냅니다.');
}

function refreshPaymentData() {
  paymentData = [...samplePaymentData];
  renderPaymentTable();
  showAlert('결제 데이터를 새로고침했습니다.');
}

function viewPaymentDetail(id) {
  showAlert(`결제 ${id} 상세 정보를 표시합니다.`);
}

function exportSystemLogs() {
  showAlert('시스템 로그를 내보냅니다.');
}

function refreshSystemLogs() {
  renderSystemLogsTable();
  showAlert('시스템 로그를 새로고침했습니다.');
}

function clearOldLogs() {
  if (confirm('오래된 로그를 삭제하시겠습니까?')) {
    showAlert('오래된 로그가 삭제되었습니다.');
  }
}

function viewLogDetail(id) {
  showAlert(`로그 ${id} 상세 정보를 표시합니다.`);
}

// CCTV 관련 함수들
function captureFrame(cctvId) {
  showAlert(`CCTV ${cctvId}번 화면을 캡처했습니다.`);
}

function recordVideo(cctvId) {
  showAlert(`CCTV ${cctvId}번 녹화를 시작했습니다.`);
}

function captureAll() {
  showAlert('모든 CCTV 화면을 캡처했습니다.');
}

function toggleFullscreen() {
  showAlert('전체화면 모드로 전환합니다.');
}

function recordAll() {
  showAlert('모든 CCTV 녹화를 시작했습니다.');
}

function changePage(direction) {
  console.log(`페이지 변경: ${direction}`);
  showAlert(`${direction === 'prev' ? '이전' : '다음'} 페이지로 이동합니다.`);
}

function showNotifications() {
  showAlert('📢 새로운 알림이 3개 있습니다.\n\n• 화재 감지 시스템 정상 작동\n• 월주차 승인 2건 대기\n• 시스템 업데이트 완료');
}

function showSettings() {
  showAlert('⚙️ 시스템 설정 화면을 표시합니다.');
}

function showAdminRegister() {
  showAlert('👥 관리자 등록 화면을 표시합니다.');
}

function logout() {
  if (confirm('로그아웃 하시겠습니까?')) {
    showAlert('로그아웃되었습니다.\n\n시스템을 안전하게 종료합니다.');
    // 실제 로그아웃 로직
    // window.location.href = 'login.html';
    const form = document.getElementById('logoutForm');
    if (form) {
      form.submit();
    } else {
      console.error("❌ 로그아웃 폼이 존재하지 않습니다.");
    }

  }
}

function saveCurrentSettings() {
  showAlert('현재 설정이 저장되었습니다.');
}

function refreshCurrentSection() {
  const currentPage = getCurrentPageType();
  
  switch(currentPage) {
    case 'dashboard':
      refreshDashboard();
      break;
    case 'fire':
      refreshFireLog();
      break;
    case 'parking':
      refreshParkingData();
      break;
    case 'member':
      refreshMemberData();
      break;
    case 'fee':
      refreshPaymentData();
      break;
    case 'system':
      refreshSystemLogs();
      break;
    default:
      showAlert('현재 화면을 새로고침합니다.');
  }
}

//cctv 전체 화면
function openCctvModal(title) {
  document.getElementById('modalTitle2').innerText = title;
  document.getElementById('modalContent2').innerHTML = `<p style="color: black;">${title} 영상이 여기에 표시됩니다.</p>`;

  const modal = document.getElementById('cctvModal2');
  modal.style.display = 'flex';
}

function closeCctvModal() {
  const modal = document.getElementById('cctvModal2');
  modal.style.display = 'none';
}

