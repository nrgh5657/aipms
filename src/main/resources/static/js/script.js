// 전역 변수
let fireDetectionData = [];
let parkingData = [];
let memberData = [];
let paymentData = [];
let systemLogs = [];
let currentPolicyType = null;
let currentPolicyId = null;
let cctvCurrentFilters = {};

// 주차 제한 상수
const PARKING_LIMITS = {
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

//결제 페이징, 필터
let currentPaymentPage = 1;
let paymentPageSize = 10;
let totalPaymentPages = 1;
let paymentFilterType = 'all'; // all | normal | monthly
let paymentSearchKeyword = '';

// 샘플 데이터
const sampleFireData = [
  {
    id: '20250710001',
    time: '2025-07-10 10:14',
    location: '1층 주차장',
    result: '화재',
    confidence: '87.5%',
    adminJudgment: '화재 확인',
    alertStatus: '전송 완료',
    alertTime: '2025-07-10 10:15',
    notes: '라이터에 발화함'
  },
  {
    id: '20250710002',
    time: '2025-07-10 10:32',
    location: '2층 주차장',
    result: '화재',
    confidence: '94.3%',
    adminJudgment: '화재 확인',
    alertStatus: '전송 완료',
    alertTime: '2025-07-10 10:32',
    notes: '불꽃 명확히 포착'
  },
  {
    id: '20250710003',
    time: '2025-07-10 11:00',
    location: '3층 주차장',
    result: '정상',
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
  loadSampleData();
  loadPaymentStats()
  loadMemberStats();
  loadTodayParkingStats()
  loadSystemStatus()
  loadFeePolicies(); //요금 정책 카드 초기 로딩
  loadRefundPolicyCard(); // 환불 정책 카드 초기 로딩
  loadSystemLogStats();
  loadCctvLogs();
  setupEventListeners();
  startRealTimeUpdates();
  setupRefundButtonListener()
  
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
  loadAndRenderAdminDashboard();
  loadCctvStatuses()
  updateParkingStatus();
}

// 주차 관리 초기화
async function initializeParkingManagement() {
  console.log('주차 관리 초기화');
  await loadParkingConfig();
  renderParkingTable();
  updateParkingStatus();
  displayCapacityWarning();
}

// 요금 관리 초기화
function initializeFeeManagement() {
  console.log('요금 관리 초기화');
  setupPaymentFilters();
  setupPaymentSearch();
  fetchPaymentList(1)
}

// 화재 관리 초기화
function initializeFireManagement() {
  console.log('화재 관리 초기화');
  renderFireTable();
}

// 회원 관리 초기화
function initializeMemberManagement() {
  console.log('회원 관리 초기화');
  refreshMemberData(false);
}

// 시스템 로그 초기화
function initializeSystemLogs() {
  console.log('시스템 로그 초기화');
  renderSystemLogsTable();
}

// 샘플 데이터 로드
function loadSampleData() {
  //fireDetectionData = [...sampleFireData];
  parkingData = [...sampleParkingData];
  //memberData = [...sampleMemberData];
  //paymentData = [...samplePaymentData];
  
  console.log('데이터 로드 완료:', {
    fire: fireDetectionData.length,
    parking: parkingData.length,
    member: memberData.length,
    payment: paymentData.length
  });
}

// parking-log-data.js 또는 script.js 내부 최상단에 위치
function fetchParkingLogs(callback) {
  fetch('/api/parking-log/logs')
      .then(res => res.json())
      .then(data => {
        if (typeof callback === 'function') {
          callback(data);
        }
      })
      .catch(err => {
        console.error('❌ 입출차 로그 불러오기 실패:', err);
        showAlert('입출차 로그를 불러오지 못했습니다.');
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

async function loadAndRenderAdminDashboard() {
  try {
    const res = await fetch('/api/adminDashboard/summary', {
      credentials: 'include'
    });

    const data = await res.json();
    console.log(data);

    // 🔥 화재 감지 수
    updateElementIfExists('fireAlertsStatus', data.fireCount);

    // 💰 오늘 매출
    updateElementIfExists('todayRevenueStatus', formatCurrency(data.todayRevenue));

    // 💰 전일 대비 증감
    const diff = data.todayRevenue - data.yesterdayRevenue;
    const sign = diff >= 0 ? '+' : '-';
    updateElementIfExists('revenueDiffStatus', `${sign}${formatCurrency(Math.abs(diff))}`);

    // 🅿️ 점유율
    const occupancyText = `${data.occupancyRate ?? 0}%`;
    updateElementIfExists('occupancyRateStatus', occupancyText);
    updateElementIfExists('occupancyRatioStatus', `${data.totalSpaces}대 중 ${data.currentOccupancy}대 사용 중`);

    // 📅 예약 수
    updateElementIfExists('reservationDaily', data.dailyReservationCount);
    updateElementIfExists('reservationMonthly', data.monthlyReservationCount);

    // ✅ 추가 데이터 렌더링
    updateElementIfExists('totalSpacesStatus', `${data.totalSpaces}대`);
    updateElementIfExists('currentMonthlyStatus', `${data.monthlyReservationCount}대`);
    updateElementIfExists('currentDailyStatus', `${data.dailyReservationCount}대`);

    const available = data.normalSpaces - data.usedNormalSpaces;
    updateElementIfExists('availableSpacesStatus', `${available}대`);

    updateElementIfExists('monthlyParkingCountStatus', `${data.monthlyReservationCount}/${data.fixedSubscriptionSpaces}`);

    updateElementIfExists('currentOccupancyStatus', `${data.currentOccupancy}대`); // 실시간 사용량 (화면에 있으면)

  } catch (e) {
    console.error('❌ 관리자 대시보드 요약 정보 로딩 실패:', e);
  }
}
function updateElementIfExists(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function formatCurrency(amount) {
  if (typeof amount !== 'number') return '-';
  return '₩' + amount.toLocaleString();
}

async function loadSystemLogStats() {
  try {
    const res = await fetch('/api/cctv/countLog');
    const data = await res.json();

    updateElementIfExists('todayLogCount', data.todayLogs.toLocaleString());
    updateElementIfExists('normalLog', data.normalCount);
    updateElementIfExists('errorLog', data.errorCount);
    updateElementIfExists('fireLog', data.fireLogCount);
  } catch (e) {
    console.error("❌ 시스템 로그 요약 로딩 실패", e);
  }
}

function updateElementIfExists(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

async function loadCctvStatuses() {
  try {
    const res = await fetch('/api/adminDashboard/cctv-status');
    const logs = await res.json();

    const grid = document.querySelector('.cctv-grid');
    grid.innerHTML = ''; // 초기화

    let latestTime = null;

    if (Array.isArray(logs) && logs.length > 0) {
      logs.forEach(log => {
        const item = document.createElement('div');
        item.classList.add('cctv-item');
        item.textContent = log.cameraName;

        if (log.status.includes('화재')) {
          item.classList.add('fire');       // 🔥 빨간색
        } else if (log.status.includes('스트리밍 오류')) {
          item.classList.add('offline');    // ⚠️ 회색
        } else if (log.status.includes('정상')) {
          item.classList.add('active');     // ✅ 초록색
        }


        grid.appendChild(item);

        const checked = new Date(log.lastCheckedAt);
        if (!latestTime || checked > latestTime) {
          latestTime = checked;
        }
      });

      if (latestTime) {
        document.getElementById('lastFireCheck').textContent = formatTimeDifference(latestTime);
      }
    } else {
      // 👉 로그 없을 경우 기본 더미 항목 3개 생성
      const dummyCount = 3;
      for (let i = 1; i <= dummyCount; i++) {
        const dummy = document.createElement('div');
        dummy.classList.add('cctv-item', 'offline');
        dummy.textContent = `CCTV ${i}번 (정보 없음)`;
        grid.appendChild(dummy);
      }

      document.getElementById('lastFireCheck').textContent = '정보 없음';
    }

  } catch (e) {
    console.error('🚨 CCTV 상태 로딩 실패:', e);
  }
}


function loadTodayParkingStats() {
  fetch('/api/adminDashboard/parking-usage')
      .then(res => res.json())
      .then(data => {
        document.getElementById('todayEntryCount').textContent = data.entryCount;
        document.getElementById('todayExitCount').textContent = data.exitCount;
        document.getElementById('currentParkingCount').textContent = data.currentCount;
      })
      .catch(err => {
        console.error('주차장 통계 로딩 실패:', err);
      });
}

function loadSystemStatus() {
  fetch('/api/adminDashboard/system-status')
      .then(res => res.json())
      .then(data => {
        // 값 출력
        document.getElementById('systemStatusLabel').textContent = data.statusMessage;
        document.getElementById('cpuUsage').textContent = data.cpuUsage + '%';
        document.getElementById('memoryUsage').textContent = data.memoryUsage + '%';
        document.getElementById('diskUsage').textContent = data.diskUsage + '%';

        // 상태에 따라 색상/클래스 바꾸기
        const statusBox = document.getElementById('systemStatusBox');
        if (data.statusMessage === '모든 시스템 정상') {
          statusBox.classList.remove('danger');
          statusBox.classList.add('safe');
        } else {
          statusBox.classList.remove('safe');
          statusBox.classList.add('danger');
        }
      })
      .catch(err => {
        console.error('시스템 상태 로딩 실패:', err);
      });
}





// 시간 포맷 예시 ("방금 전", "x분 전")
function formatTimeDifference(time) {
  const now = new Date();
  const diff = Math.floor((now - time) / 1000); // 초 단위

  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  return `${Math.floor(diff / 3600)}시간 전`;
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
}

function loadDashboardSummary() {
  fetch('/api/management/parking/summary')
      .then(res => res.json())
      .then(data => {
        const entryCountEl = document.getElementById('entryCarCount');
        const revenueEl = document.getElementById('revenue');

        if (entryCountEl) {
          entryCountEl.textContent = data.entryCount;
        }
        if (revenueEl) {
          revenueEl.textContent = data.revenue.toLocaleString();
        }
      })
      .catch(console.error);
}

// 페이지 로딩 후 실행
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardSummary();
});




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

// 화재 감지 테이블 렌더링
function renderFireTable() {
  const tableBody = document.getElementById('fireLogTable');
  if (!tableBody) return;

  console.log('화재 테이블 렌더링 시작');
  tableBody.innerHTML = '';

  if (fireDetectionData && fireDetectionData.length > 0) {
    fireDetectionData.forEach(item => {
      const row = createFireTableRow(item);
      tableBody.appendChild(row);
    });

    const remainingRows = Math.max(0, 10 - fireDetectionData.length);
    for (let i = 0; i < remainingRows; i++) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = '<td colspan="10">&nbsp;</td>';
      emptyRow.style.height = '45px';
      tableBody.appendChild(emptyRow);
    }

    console.log(`화재 테이블 렌더링 완료: ${fireDetectionData.length}개 항목`);
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

  const resultClass = item.result === '화재' ? 'status-fire' : 'status-normal';

  row.innerHTML = `
    <td>${item.id}</td>
    <td>${item.time}</td>
    <td>${item.location}</td>
    <td><span class="${resultClass}">${item.result}</span></td>
    <td>${item.confidence}</td>
    <td>${item.adminJudgment}</td>
    <td>${item.alertStatus}</td>
    <td>${item.alertTime}</td>
    <td>${item.notes}</td>
    <td><button class="action-btn" onclick="event.stopPropagation(); editFireRecord('${item.id}')">수정</button></td>
  `;

  return row;
}

async function resetAndDetectSingle(cameraId) {
  const confirmed = confirm(`카메라 ${cameraId} 상태를 리셋하고 화재 재감지를 수행할까요?`);
  if (!confirmed) return;

  try {
    const resetRes = await fetch(`http://localhost:5000/reset-fire?camera=${cameraId}`, {
      method: "GET",
      mode: "cors"
    });

    if (!resetRes.ok) {
      alert(`❌ 상태 리셋 실패`);
      return;
    }

    const detectRes = await fetch("http://localhost:5000/stream-fire-detect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        video_url: "0",  // 또는 각 cameraId에 따라 다르게 매핑 가능
        callback_url: "http://localhost:8080/fireDetect/detected",
        camera_id: cameraId
      })
    });

    if (!detectRes.ok) {
      alert("❌ 감지 재시작 실패");
      return;
    }

    alert(`✅ 카메라 ${cameraId} 리셋 및 재감지 요청 완료`);

  } catch (error) {
    console.error("🚨 처리 중 오류:", error);
    alert("⚠️ 오류 발생: 콘솔 확인");
  }
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

const MAX_LIMITS = {
  monthly: 100,
  total: 100
};

function openLimitPopup(type) {
  if (type !== 'monthly' && type !== 'total') return;

  // 사용중 / 한도 텍스트 분리
  const valueElement = document.getElementById(type === 'monthly' ? 'monthlyLimit' : 'totalLimit');
  const [usedStr, limitStr] = valueElement.textContent.split('/');
  const used = parseInt(usedStr, 10);
  const limit = parseInt(limitStr, 10);

  // 각 팝업 관련 요소 세팅
  const popup = document.getElementById(type + 'Popup');
  const usedSpan = document.getElementById(type + 'Used');
  const input = document.getElementById(type + 'Input');

  usedSpan.textContent = used;
  input.min = 0;
  input.max = MAX_LIMITS[type];
  input.value = limit;

  // 팝업 보여주기
  popup.style.display = 'flex';
  input.focus();
}

function closePopup(type) {
  if (type !== 'monthly' && type !== 'total') return;
  const popup = document.getElementById(type + 'Popup');
  popup.style.display = 'none';
}

function saveLimit(type) {
  if (type !== 'monthly' && type !== 'total') return;

  const input = document.getElementById(type + 'Input');
  const newLimit = parseInt(input.value, 10);
  const used = parseInt(document.getElementById(type + 'Used').textContent, 10);
  const maxLimit = MAX_LIMITS[type];

  if (isNaN(newLimit)) {
    alert('한도를 숫자로 입력해주세요.');
    input.focus();
    return;
  }
  if (newLimit < 0) {
    alert('한도는 0 이상이어야 합니다.');
    input.focus();
    return;
  }
  if (newLimit > maxLimit) {
    alert(`${type === 'monthly' ? '월주차' : '전체'} 한도는 최대 ${maxLimit}까지 설정할 수 있습니다.`);
    input.focus();
    return;
  }
  if (newLimit < used) {
    alert('총 한도는 사용 중인 수보다 작을 수 없습니다.');
    input.focus();
    return;
  }

  // 값 업데이트
  const valueElement = document.getElementById(type === 'monthly' ? 'monthlyLimit' : 'totalLimit');
  valueElement.textContent = `${used}/${newLimit}`;

  closePopup(type);

  // 📌 [💥 추가: 설정 서버에 저장 요청]
  fetch('/api/parking-config/setConfig', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      totalSpaces: type === 'total' ? newLimit : PARKING_LIMITS.TOTAL_SPACES,
      fixedSubscriptionSpaces: type === 'monthly' ? newLimit : PARKING_LIMITS.MONTHLY_LIMIT
    })
  })
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          alert('✅ 설정이 저장되었습니다.');

          // 전역 한도 상수도 반영
          if (type === 'monthly') {
            PARKING_LIMITS.MONTHLY_LIMIT = newLimit;
          } else {
            PARKING_LIMITS.TOTAL_SPACES = newLimit;
          }

          updateParkingStatus(); // 상태 즉시 갱신
        } else {
          alert('❌ 설정 저장 실패: ' + (result.message || '알 수 없는 오류'));
        }
      })
      .catch(err => {
        console.error('🚫 설정 저장 중 오류:', err);
        alert('설정 저장 중 오류 발생');
      });
}

/**
 * 주차장 설정을 서버에서 가져와 전역 한도 상수를 갱신한다.
 * @returns {Promise<void>}
 */
async function loadParkingConfig() {
  try {
    const res = await fetch('/api/parking-config');
    if (!res.ok) throw new Error('설정 로드 실패');
    const cfg = await res.json();

    // 전역 상수 적용
    PARKING_LIMITS.TOTAL_SPACES  = cfg.totalSpaces;
    PARKING_LIMITS.MONTHLY_LIMIT = cfg.fixedSubscriptionSpaces;

    console.log('[CONFIG] 주차장 설정 불러옴:', cfg);
  } catch (err) {
    console.error('❌ 주차장 설정 로드 오류:', err);
    // 실패 시에는 기존 하드코딩 값 사용
  }
}

// 입출차 로그
(() => {
  const MIN_ROWS = 10;
  const pageSize = 10;

  let currentPage = 1;
  let totalLogs = 0;
  let parkingData = [];

  // 전역 필터 상태
  const currentFilters = {
    carNumber: '',
    requester: '',
    subscription: 'ALL' // 'MONTHLY', 'DAILY', 'NORMAL', 'ALL'
  };

  // 날짜 포맷
  function getFormattedDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
  }

  // 테이블 렌더링
  function renderParkingTable(data) {
    const tbody = document.getElementById('parkinglog');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach((item, index) => {
      const row = document.createElement('tr');
      const entryTime = getFormattedDate(item.entryTime);
      const exitTime = getFormattedDate(item.exitTime);
      const parkingType = item.parkingType || '일반';
      const requester = item.memberName || '비회원';

      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.carNumber}</td>
        <td>${requester}</td>
        <td>${parkingType}</td>
        <td>${entryTime}</td>
        <td>${exitTime}</td>
      `;
      tbody.appendChild(row);
    });

    // 빈 행 채우기
    const emptyRows = MIN_ROWS - data.length;
    for (let i = 0; i < emptyRows; i++) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `<td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td>`;
      emptyRow.classList.add('empty-row');
      tbody.appendChild(emptyRow);
    }
  }

  // 서버 요청
  function fetchParkingLogs(page = 1) {
    currentPage = page;

    const params = new URLSearchParams();
    params.append('page', currentPage);
    params.append('size', pageSize);

    if (currentFilters.carNumber) params.append('carNumber', currentFilters.carNumber);
    if (currentFilters.requester) params.append('requester', currentFilters.requester);
    if (currentFilters.subscription && currentFilters.subscription !== 'ALL') {
      params.append('subscription', currentFilters.subscription);
    }

    fetch(`/api/parking-log/logs?${params.toString()}`)
        .then(res => {
          if (!res.ok) throw new Error('서버 응답 오류');
          return res.json();
        })
        .then(data => {
          parkingData = data.logs;
          totalLogs = data.totalCount;
          renderParkingTable(parkingData);
          renderParkingPagination();
        })
        .catch(err => {
          console.error('🚨 입출차 로그 불러오기 실패:', err);
          alert('입출차 로그를 불러오지 못했습니다.');
        });
  }

  // 페이지네이션 렌더링
  function renderParkingPagination() {
    const totalPages = Math.ceil(totalLogs / pageSize);
    const container = document.getElementById('parkingPagination');
    if (!container) return;

    container.innerHTML = '';

    const prevBtn = document.createElement('button');
    prevBtn.textContent = '이전';
    prevBtn.disabled = currentPage === 1;
    prevBtn.classList.add('pagination-nav');
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        fetchParkingLogs(currentPage - 1);
      }
    };
    container.appendChild(prevBtn);

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === currentPage ? 'active' : '';
      btn.onclick = () => fetchParkingLogs(i);
      container.appendChild(btn);
    }

    const nextBtn = document.createElement('button');
    nextBtn.textContent = '다음';
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    nextBtn.classList.add('pagination-nav');
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        fetchParkingLogs(currentPage + 1);
      }
    };
    container.appendChild(nextBtn);
  }

  // 🔍 필터 적용
  function applyParkingFilters() {
    updateCurrentFiltersFromDOM();
    currentPage = 1;
    fetchParkingLogs(currentPage);
  }

  // 🔄 필터 상태 업데이트
  function updateCurrentFiltersFromDOM() {
    const carKeyword = document.getElementById('searchInput')?.value.trim() || '';
    const nameKeyword = document.getElementById('requesterSearch')?.value.trim() || '';
    const selectedFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';

    currentFilters.carNumber = carKeyword;
    currentFilters.requester = nameKeyword;

    if (selectedFilter === 'monthly') {
      currentFilters.subscription = '월주차';
    } else if (selectedFilter === 'daily') {
      currentFilters.subscription = '일주차';
    } else if (selectedFilter === 'normal') {
      currentFilters.subscription = '일반';
    } else {
      delete currentFilters.subscription; // '전체'는 필터 안 넘김
    }
  }

  // ✅ 초기화
  document.addEventListener('DOMContentLoaded', () => {
    fetchParkingLogs(currentPage);

    document.querySelector('.search-btn')?.addEventListener('click', applyParkingFilters);

    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        applyParkingFilters();
      });
    });
  });
})();



document.addEventListener("DOMContentLoaded", function () {
  fetchMemberList(1);
});

let currentPage = 1;
let pageSize = 10;
let totalPages = 1;
let currentFilters = {};

// 날짜 포맷
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString().slice(0, 5);
}

// 테이블 렌더링
function renderMemberTable(data = []) {
  const tableBody = document.getElementById('memberTable');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  data.forEach(item => {
    const row = createMemberTableRow(item);
    tableBody.appendChild(row);
  });

  const remainingRows = Math.max(0, 10 - data.length);
  for (let i = 0; i < remainingRows; i++) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="10">&nbsp;</td>';
    emptyRow.style.height = '45px';
    tableBody.appendChild(emptyRow);
  }
}

// 테이블 행 생성
function createMemberTableRow(item) {
  const row = document.createElement('tr');
  const isActive = item.status === '활성';
  const statusClass = isActive ? 'status-approved' : 'status-waiting';
  const statusLabel = isActive ? '활성' : '비활성';
  const actionLabel = isActive ? '비활성' : '활성화';
  const actionBtnClass = isActive ? 'action-btn danger' : 'action-btn activate';
  const actionFunction = isActive ? 'deactivateMember' : 'activateMember';

  row.innerHTML = `
    <td>${item.id}</td>
    <td>${item.name}</td>
    <td>${item.carNumber}</td>
    <td>${item.carModel}</td>
    <td>${item.phone}</td>
    <td>${item.email}</td>
    <td>${item.joinDate}</td>
    <td><span class="${statusClass}">${statusLabel}</span></td>
    <td>${item.membership}</td>
    <td>
      <button class="action-btn" onclick="editMember('${item.id}')">수정</button>
      <button class="${actionBtnClass}" onclick="${actionFunction}('${item.id}')">${actionLabel}</button>
    </td>
  `;
  return row;
}

// 회원 목록 API 요청
function fetchMemberList(page = 1) {
  const queryParams = new URLSearchParams({ page, size: pageSize });

  if (currentFilters.status) queryParams.append('status', currentFilters.status);
  if (currentFilters.membership) queryParams.append('membership', currentFilters.membership);

  fetch(`/api/members/list?${queryParams.toString()}`)
      .then(res => res.json())
      .then(data => {
        const members = data.content.map(member => ({
          id: member.memberCode || '-',
          name: member.name || '-',
          carNumber: member.carNumber || '-',
          carModel: member.carModel || '-',
          phone: member.phone || '-',
          email: member.email || '-',
          joinDate: formatDate(member.regDate),
          status: member.status === 'ACTIVE' ? '활성' : '비활성',
          membership: member.subscription ? '월주차' : '일반'
        }));

        memberData = members;

        currentPage = data.page;
        totalPages = data.totalPages;

        renderMemberTable(members);
        renderMemberPagination(currentPage, totalPages);
      })
      .catch(err => console.error('회원 목록 로딩 실패:', err));
}

// 필터 적용 함수
function applyMemberFilters() {
  const statusValue = document.querySelector('input[name="status-filter"]:checked')?.value;
  const typeValue = document.querySelector('input[name="membership-filter"]:checked')?.value;

  currentFilters = {};

  if (statusValue && statusValue !== '전체') {
    currentFilters.status = statusValue === '활성' ? 'ACTIVE' : 'INACTIVE';
  }

  if (typeValue && typeValue !== '전체') {
    currentFilters.membership = typeValue;
  }

  fetchMemberList(1); // ✅ 필터 초기화 시 첫 페이지로
}

// 회원 목록 전용 페이징 렌더링
function renderMemberPagination(currentPage, totalPages) {
  const pagination = document.getElementById('memberPagination'); // ✅ 수정됨
  if (!pagination) return;

  pagination.innerHTML = '';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '이전';
  prevBtn.disabled = currentPage === 1;
  prevBtn.onclick = () => fetchMemberList(currentPage - 1);
  pagination.appendChild(prevBtn);

  const maxButtons = 5;
  let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let end = Math.min(totalPages, start + maxButtons - 1);
  if (end - start < maxButtons - 1) start = Math.max(1, end - maxButtons + 1);

  for (let i = start; i <= end; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === currentPage) btn.classList.add('active');
    btn.onclick = () => fetchMemberList(i);
    pagination.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.textContent = '다음';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.onclick = () => fetchMemberList(currentPage + 1);
  pagination.appendChild(nextBtn);
}


// 수정 모달 로직
function findMemberById(id) {
  return memberData.find(m => m.id === id);
}

function editMember(id) {
  const member = findMemberById(id);
  if (!member) return;

  document.getElementById('editId').value = member.id;
  document.getElementById('editName').value = member.name;
  document.getElementById('editCarNumber').value = member.carNumber;
  document.getElementById('editCarModel').value = member.carModel;
  document.getElementById('editPhone').value = member.phone;
  document.getElementById('editEmail').value = member.email;
  document.getElementById('editStatus').value = member.status;
  document.getElementById('editMembership').value = member.membership;

  document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

document.getElementById('editForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const updatedMember = {
    id: document.getElementById('editId').value,
    name: document.getElementById('editName').value,
    carNumber: document.getElementById('editCarNumber').value,
    carModel: document.getElementById('editCarModel').value,
    phone: document.getElementById('editPhone').value,
    email: document.getElementById('editEmail').value,
    status: document.getElementById('editStatus').value === '활성' ? 'ACTIVE' : 'INACTIVE',
    subscription: document.getElementById('editMembership').value === '월주차'
  };

  fetch(`/api/members/modify/${updatedMember.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedMember)
  })
      .then(res => {
        if (!res.ok) throw new Error('수정 실패');
        return res.json();
      })
      .then(() => {
        closeEditModal();
        showAlert(`회원 ${updatedMember.id} 정보가 수정되었습니다.`);
        fetchMemberList(currentPage); // 현재 페이지 새로고침
      })
      .catch(err => {
        console.error('회원 수정 실패:', err);
        alert('회원 정보 수정 중 문제가 발생했습니다.');
      });
});

async function loadMemberStats() {
  try {
    const res = await fetch('/api/members/summary');
    const data = await res.json();

    updateElementIfExists('totalMembers', data.total.toLocaleString());
    updateElementIfExists('activeMembers', data.active.toLocaleString());
    updateElementIfExists('monthlyMembers', data.monthly.toLocaleString()); // ✅ ID 수정됨
    updateElementIfExists('newMembers', data.newToday.toLocaleString());
  } catch (e) {
    console.error("❌ 회원 통계 로딩 실패", e);
  }
}





//결제 리스트 불러오기
function fetchPaymentList(page = 1) {
  let typeParam = '';
  if (paymentFilterType === 'monthlyParking') {
    typeParam = '&type=MONTHLY';
  } else if (paymentFilterType === 'dailyParking') {
    typeParam = '&type=DAILY';
  } else if (paymentFilterType === 'normalParking') {
    typeParam = '&type=GENERAL';
  }

  const keywordParam = paymentSearchKeyword ? `&keyword=${encodeURIComponent(paymentSearchKeyword)}` : '';

  fetch(`/api/payment/list?page=${page}&size=${paymentPageSize}${typeParam}${keywordParam}`, {
    credentials: 'include'
  })
      .then(res => res.json())
      .then(data => {
        paymentData = data.content || [];
        totalPaymentPages = data.totalPages || 1;
        currentPaymentPage = page;
        renderPaymentTable();
        renderPaymentPagination();
      })
      .catch(err => {
        console.error('❌ 결제 내역 로딩 실패:', err);
        showAlert('결제 내역을 불러오는 중 문제가 발생했습니다.');
      });
}

function setupPaymentFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      paymentFilterType = e.target.dataset.filter || 'all';
      fetchPaymentList(1);
    });
  });
}

function setupPaymentSearch() {
  const searchBtn = document.querySelector('.search-btn');
  const searchInput = document.getElementById('memberSearchInput');

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', () => {
      paymentSearchKeyword = searchInput.value.trim();
      fetchPaymentList(1);
    });
  }
}

function renderPaymentPagination() {
  const pagination = document.querySelector('.pagination');
  if (!pagination) return;

  pagination.innerHTML = '';

  const prev = document.createElement('button');
  prev.textContent = '이전';
  prev.disabled = currentPaymentPage === 1;
  prev.onclick = () => fetchPaymentList(currentPaymentPage - 1);
  pagination.appendChild(prev);

  for (let i = 1; i <= totalPaymentPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === currentPaymentPage) btn.classList.add('active');
    btn.onclick = () => fetchPaymentList(i);
    pagination.appendChild(btn);
  }

  const next = document.createElement('button');
  next.textContent = '다음';
  next.disabled = currentPaymentPage === totalPaymentPages;
  next.onclick = () => fetchPaymentList(currentPaymentPage + 1);
  pagination.appendChild(next);
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

  const statusLabel = item.status?.includes('환불') ? '환불 완료'
      : item.status?.includes('출차') ? '출차 결제'
          : item.status?.includes('결제') ? '결제 완료'
              : item.status || '-';

  const statusClass = item.status?.includes('환불') ? 'status-fire'
      : item.status?.includes('출차') ? 'status-approved'
          : item.status?.includes('결제') ? 'status-approved'
              : '';

  // ✅ 환불 버튼 조건 렌더링
  let actionButtonHTML = '';
  if (item.reservationId && item.status === "결제 완료") {
    actionButtonHTML = `<button class="action-btn danger refund-btn" data-id="${item.reservationId}" data-amount="${item.amount}">환불</button>`;
  } else if (item.status?.includes("환불")) {
    actionButtonHTML = `<button class="action-btn" disabled>환불 완료</button>`;
  } else {
    actionButtonHTML = `<span class="muted">-</span>`;
  }

  console.log('🔍 결제 아이템:', item);
  row.innerHTML = `
    <td>${item.id}</td>
    <td>${item.carNumber || '-'}</td>
    <td>${item.payer || '-'}</td>
    <td>${item.paymentType || '-'}</td>       <!-- 수정됨 -->
    <td>${item.amount?.toLocaleString() || '0'} 원</td>
    <td>${item.paymentMethod || '-'}</td>     <!-- 수정됨 -->
    <td>${item.paidAt ? formatDate(item.paidAt) : '-'}</td> <!-- 수정됨 -->
    <td><span class="${statusClass}">${statusLabel}</span></td>
    <td>
      ${actionButtonHTML}
    </td>
  `;
  
  return row;
}

// 환불 버튼 클릭 이벤트 위임 함수 (별도 분리)
function setupRefundButtonListener() {
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('refund-btn') && !e.target.disabled) {
      const reservationId = e.target.dataset.id;
      const amount = e.target.dataset.amount;

      if (!confirm(`정말 ${amount.toLocaleString()}원 환불하시겠습니까?`)) {
        return;
      }

      try {
        const response = await fetch('/api/payment/admin/refund', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reservationId: reservationId,
            reason: '관리자 환불 처리'
          }),
          credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
          alert('✅ 환불이 완료되었습니다.');
          fetchPaymentList(currentPaymentPage); // 테이블 새로고침
        } else {
          alert(`❌ 환불 실패: ${result.message}`);
        }
      } catch (error) {
        console.error('환불 처리 중 오류 발생:', error);
        alert('❌ 환불 처리 중 오류가 발생했습니다.');
      }
    }
  });
}


async function loadPaymentStats() {
  try {
    const res = await fetch('/api/payment/summary');
    const data = await res.json();

    updateElementIfExists('todayPaymentTotal', `₩${data.paymentTodayRevenue.toLocaleString()}`);
    updateElementIfExists('monthlyPaymentTotal', `₩${data.paymentMonthlyRevenue.toLocaleString()}`);
    updateElementIfExists('pendingRefunds', `${data.paymentPendingRefunds}건`);
    updateElementIfExists('failedPayments', `${data.paymentFailedPayments}건`);
  } catch (e) {
    console.error("❌ 결제 통계 로딩 실패", e);
  }
}


async function loadCctvLogs(page = 1, filters = {}) {
  const params = new URLSearchParams({
    page,
    size: 10,
    ...filters
  });

  const res = await fetch(`/api/cctv/logs?${params.toString()}`);
  const json = await res.json();
  console.log("🔍 필터 적용 후 요청 파라미터:", params.toString());
  console.log("📦 전달받은 filters:", filters);
  renderSystemLogsTable(json.logs);
  renderPagination(json.page, json.total, json.size);
}

// 시스템 로그 테이블 렌더링
function renderSystemLogsTable(logs) {
  const tableBody = document.getElementById('systemLogsTable');
  if (!tableBody) return;

  console.log('✅ CCTV 로그 렌더링 시작');
  tableBody.innerHTML = '';


  logs.forEach((item, index) => {
    const row = document.createElement('tr');

    let levelText = 'NORMAL';
    let levelClass = 'status-normal';
    let message = 'CCTV 정상 동작';

    if (item.status?.includes('화재')) {
      levelText = 'FIRE';
      levelClass = 'status-fire';
      message = '화재 감지됨';
    } else if (item.status?.includes('오류')) {
      levelText = 'ERROR';
      levelClass = 'status-waiting';
      message = '스트리밍 오류';
    }

    const location = item.location ?? '-';
    const logId = item.id ?? '-';

    row.innerHTML = `
      <td>${logId}</td>
      <td>${item.lastCheckedAt}</td>
      <td><span class="${levelClass}">${levelText}</span></td>
      <td>CCTV</td>
      <td>${message}</td>
      <td>System</td>
      <td>${location}</td>
      <td>${formatRecordingStatus(item.recordStatus)}</td> <!-- 🔄 여기 바뀜 -->
      <td><button class="action-btn" onclick="viewLogDetail('${logId}')">상세</button></td>
    `;

    tableBody.appendChild(row);
  });

  console.log(`✅ CCTV 로그 렌더링 완료: ${logs.length}개`);
}

function renderPagination(currentPage, totalItems, pageSize) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const container = document.getElementById('cctvPagination');
  if (!container) return;

  container.innerHTML = '';

  const maxButtons = 7;
  let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
  let endPage = startPage + maxButtons - 1;

  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxButtons + 1);
  }

  // 이전 버튼
  if (currentPage > 1) {
    container.appendChild(createPageBtn('«', currentPage - 1));
  }

  // 번호 버튼
  for (let i = startPage; i <= endPage; i++) {
    const btn = createPageBtn(i, i, i === currentPage);
    container.appendChild(btn);
  }

  // 다음 버튼
  if (currentPage < totalPages) {
    container.appendChild(createPageBtn('»', currentPage + 1));
  }
}

function createPageBtn(label, page, active = false) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.className = 'page-btn' + (active ? ' active' : '');
  btn.onclick = () => loadCctvLogs(page, cctvCurrentFilters); // 페이지 이동 시 재요청
  return btn;
}
  


function formatRecordingStatus(status) {
  if (status === 'RECORDING') {
    return '<span class="recording-ok">녹화 중</span>';
  } else if (status === 'NOT_RECORDING') {
    return '<span class="recording-off">녹화 안됨</span>';
  } else {
    return '-';
  }
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
function applyFireFilters(filter = null) {
  const activeFilter = filter || document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  const locationFilter = document.getElementById('cctvLocationFilter')?.value || '';
  const dateFilter = document.getElementById('dateFilter')?.value || '';
  
  let filteredData = [...sampleFireData];
  
  if (activeFilter === 'fire') {
    filteredData = filteredData.filter(item => item.result === '화재');
  } else if (activeFilter === 'normal') {
    filteredData = filteredData.filter(item => item.result === '정상');
  }
  
  if (locationFilter) {
    filteredData = filteredData.filter(item => item.location === locationFilter);
  }
  
  if (dateFilter) {
    filteredData = filteredData.filter(item => item.time.startsWith(dateFilter));
  }
  
  fireDetectionData = filteredData;
  renderFireTable();
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
  const keyword = document.getElementById('memberSearchInput')?.value?.trim();
  const statusSelect = document.getElementById('memberStatusFilter')?.value;

  // 필터 상태 UI 업데이트
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.filter === activeFilter) {
      btn.classList.add('active');
    }
  });

  // ✅ currentFilters 갱신
  currentFilters = {};
  if (activeFilter === 'active') {
    currentFilters.status = 'ACTIVE';
  } else if (activeFilter === 'inactive') {
    currentFilters.status = 'INACTIVE';
  } else if (activeFilter === 'monthly') {
    currentFilters.membership = '월주차';
  }

  if (statusSelect === 'active') {
    currentFilters.status = 'ACTIVE';
  } else if (statusSelect === 'inactive') {
    currentFilters.status = 'INACTIVE';
  }

  if (keyword) {
    currentFilters.keyword = keyword;
  }

  // ✅ 서버 필터 기반으로 1페이지부터 다시 가져오기
  fetchMemberList(1);
}

// 로그 필터 적용
// ✅ 로그 필터 적용
function applyLogFilters() {
  const keyword = document.getElementById('logMessageSearch')?.value;
  const module = document.getElementById('logModuleFilter')?.value;
  const date = document.getElementById('logDateFilter')?.value;

  const activeBtn = document.querySelector('.filter-btn.active');
  const selectedStatus = activeBtn?.getAttribute('data-filter');

  cctvCurrentFilters = {};

  if (selectedStatus && selectedStatus !== 'all') {
    cctvCurrentFilters.status = selectedStatus;
  }

  if (keyword) cctvCurrentFilters.keyword = keyword;
  if (module) cctvCurrentFilters.logType = module;
  if (date) cctvCurrentFilters.date = date;  // 👉 백엔드에서 date 필터링을 추가하려면 이 부분 처리 필요

  console.log('📦 적용된 필터:', cctvCurrentFilters);

  loadCctvLogs(1, cctvCurrentFilters);  // ✅ 첫 페이지부터 다시 요청
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
          <p style="font-size: 18px;">🔥 화재 이미지</p>
          <p style="margin: 10px 0;">Log ID: ${fireItem.id}</p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <strong>Log ID:</strong> ${fireItem.id}<br>
            <strong>CCTV 위치:</strong> ${fireItem.location}<br>
            <strong>감지시간:</strong> ${fireItem.time}
          </div>
          <div>
            <strong>AI 판별 결과:</strong> <span class="${fireItem.result === '화재' ? 'status-fire' : 'status-normal'}">${fireItem.result}</span><br>
            <strong>관리자 판단:</strong> ${fireItem.adminJudgment}<br>
            <strong>알림 전송:</strong> ${fireItem.alertTime}
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <strong>Notes</strong>
          <textarea style="width: 100%; height: 80px; margin-top: 10px; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px;" readonly>${fireItem.notes}</textarea>
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: center;">
          <button class="action-btn" onclick="closeModal()">닫기</button>
          ${fireItem.result === '화재' ? '<button class="action-btn primary" onclick="showUserAlert()">주차장 사용자 알림</button>' : ''}
        </div>
      </div>
    </div>
  `;
  
  showModal(modalContent);
}

// 사용자 알림 표시
function showUserAlert() {
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
            <tr>
              <td><input type="checkbox" class="user-checkbox"></td>
              <td>555허 5556</td>
              <td>소지섭</td>
              <td>월주차</td>
              <td>010-1234-5678</td>
              <td><span style="color: #2f855a; font-weight: 600;">주차중</span></td>
            </tr>
            <tr>
              <td><input type="checkbox" class="user-checkbox"></td>
              <td>444헐 4444</td>
              <td>이정재</td>
              <td>일주차</td>
              <td>010-2345-6789</td>
              <td><span style="color: #e53e3e; font-weight: 600;">부재</span></td>
            </tr>
            <tr>
              <td><input type="checkbox" class="user-checkbox"></td>
              <td>777럭 7777</td>
              <td>강민호</td>
              <td>월주차</td>
              <td>010-3456-7890</td>
              <td><span style="color: #2f855a; font-weight: 600;">주차중</span></td>
            </tr>
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
  checkedUsers.forEach(checkbox => {
    const row = checkbox.closest('tr');
    const carNumber = row.cells[1].textContent;
    const userName = row.cells[2].textContent;
    const phoneNumber = row.cells[4].textContent;
    selectedUsers.push({ carNumber, userName, phoneNumber });
  });
  
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
  updateParkingStatus();
  showAlert('대시보드를 새로고침했습니다.');
}

function exportDashboardData() {
  showAlert('대시보드 리포트를 내보냅니다.');
}

function refreshFireLog() {
  fireDetectionData = [...sampleFireData];
  renderFireTable();
  showAlert('화재 감지 로그를 새로고침했습니다.');
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

function activateMember(memberId) {
  if (confirm('정말 해당 회원을 활성화 처리하시겠습니까?')) {
    fetch(`/api/members/activate/${memberId}`, {
      method: 'PUT'
    })
        .then(res => {
          if (!res.ok) throw new Error('활성화 실패');
          return res.text();
        })
        .then(() => {
          alert('회원이 활성화되었습니다.');
          refreshMemberData(false);

          // 👉 memberId 필드명 주의
          const member = memberData.find(m => m.id === memberId);
          if (member) member.status = 'ACTIVE';

          // 👉 렌더링 함수가 status 기반 필터링을 하도록 구성돼 있어야 함
          renderMemberTable();
        })
        .catch(err => {
          console.error('활성화 오류', err);
          alert('활성화 중 오류가 발생했습니다.');
        });
  }
}

function deactivateMember(memberId) {
  if (confirm('정말 해당 회원을 비활성화(탈퇴) 처리하시겠습니까?')) {
    fetch(`/api/members/deactivate/${memberId}`, {
      method: 'PUT'
    })
        .then(res => {
          if (!res.ok) throw new Error('비활성화 실패');
          return res.text();
        })
        .then(() => {
          alert('회원이 비활성화되었습니다.');

          // 👉 memberId 필드명 주의
          const member = memberData.find(m => m.id === memberId);
          if (member) member.status = 'INACTIVE';

          // 👉 렌더링 함수가 status 기반 필터링을 하도록 구성돼 있어야 함
          renderMemberTable();
        })
        .catch(err => {
          console.error('비활성화 오류', err);
          alert('비활성화 중 오류가 발생했습니다.');
        });
  }
}



function exportMemberData() {
  showAlert('회원 데이터를 내보냅니다.');
}

function refreshMemberData(showMessage = true) {
  fetchMemberList(1); // 첫 페이지로 재요청
  if (showMessage) {
    showAlert('회원 데이터를 새로 불러왔습니다.');
  }
}

function loadRefundPolicyCard() {
  fetch('/admin/policy/refund/active')
      .then(res => res.json())
      .then(data => {
        document.getElementById('refundLimitDisplay').innerText = (data.refundTimeLimitMinutes) + '분 이내';
        document.getElementById('penalty2dDisplay').innerText= (data.penaltyBefore2days * 100).toFixed(0) + '%';
        document.getElementById('penalty1dDisplay').innerText = (data.penaltyBefore1day * 100).toFixed(0) + '%';
        document.getElementById('penaltySameDayDisplay').innerText =
            data.penaltySameOrAfter >= 1 ? '환불 불가' : (data.penaltySameOrAfter * 100).toFixed(0) + '%';
        document.getElementById('refundApplyDate').innerText = data.applyFrom;
      });
}

async function loadFeePolicies() {
  try {
    const res = await fetch('/admin/policy/fee/all');
    const data = await res.json();

    data.forEach(policy => {
      const { policyType, baseFee, unitTime, maxFee, discountRate, applyFrom } = policy;

      if (policyType === 'TIME') {
        document.getElementById('hourlyBase').innerText = `${baseFee.toLocaleString()}원/${unitTime}분`;
        document.getElementById('hourlyMax').innerText = maxFee ? `${maxFee.toLocaleString()}원` : '-';
        document.getElementById('hourlyApply').innerText = applyFrom;
      }

      if (policyType === 'DAILY') {
        document.getElementById('dailyBase').innerText = `${baseFee.toLocaleString()}원/일`;
        document.getElementById('dailyApply').innerText = applyFrom;
      }

      if (policyType === 'MONTHLY') {
        document.getElementById('monthlyBase').innerText = `${baseFee.toLocaleString()}원/월`;
        document.getElementById('monthlyDiscount').innerText = `기존 요금 대비 ${Math.round(discountRate * 100)}% 절약`;
        document.getElementById('monthlyApply').innerText = applyFrom;
      }
    });
  } catch (e) {
    console.error('❌ 요금 정책 로딩 실패:', e);
  }
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

function editPolicy(policyId, policyType) {
  currentPolicyId = policyId;       // 현재 편집 중인 정책 ID 저장
  currentPolicyType = policyType;   // 현재 편집 중인 정책 타입 저장

  fetch(`/admin/policy/fee/${policyId}`)
      .then(res => res.json())
      .then(data => {
        if (policyType === 'TIME') {
          openTimePolicyModal(data);
        } else if (policyType === 'DAILY') {
          openDailyPolicyModal(data);
        } else if (policyType === 'MONTHLY') {
          openMonthlyPolicyModal(data);
        } else {
          alert('알 수 없는 정책 유형입니다.');
        }
      })
      .catch(() => alert('정책 데이터를 불러오는데 실패했습니다.'));
}

function openTimePolicyModal(data) {
  const modalContent = `
    <div style="max-width: 500px;">
      <h2>시간제 요금 정책 수정</h2>
      <div style="margin: 20px 0;">
        <div style="margin-bottom: 15px;">
          <label for="policyName" style="display: block; margin-bottom: 5px; font-weight: 600;">요금 명칭:</label>
          <input id="policyName" type="text" value="${data.name || ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="policyFee" style="display: block; margin-bottom: 5px; font-weight: 600;">기본 요금:</label>
          <input id="policyFee" type="number" value="${data.baseFee || ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="maxFee" style="display: block; margin-bottom: 5px; font-weight: 600;">최대 요금:</label>
          <input id="maxFee" type="number" value="${data.maxFee || ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="unitTime" style="display: block; margin-bottom: 5px; font-weight: 600;">단위 시간(분):</label>
          <input id="unitTime" type="number" value="${data.unitTime || ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="startDate" style="display: block; margin-bottom: 5px; font-weight: 600;">적용 시작일:</label>
          <input id="startDate" type="date" value="${data.applyFrom ? data.applyFrom.split('T')[0] : ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="endDate" style="display: block; margin-bottom: 5px; font-weight: 600;">적용 종료일:</label>
          <input id="endDate" type="date" value="${data.applyTo ? data.applyTo.split('T')[0] : ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <button class="action-btn" onclick="closeModal()" style="margin-right: 10px;">뒤로</button>
          <button class="action-btn primary" onclick="savePolicy(${data.id})">저장</button>
        </div>
      </div>
    </div>
  `;
  showModal(modalContent);
}

function openDailyPolicyModal(data) {
  const modalContent = `
    <div style="max-width: 500px;">
      <h2>일일제 요금 정책 수정</h2>
      <div style="margin: 20px 0;">

        <div style="margin-bottom: 15px;">
          <label for="policyName" style="display: block; margin-bottom: 5px; font-weight: 600;">요금 명칭:</label>
          <input id="policyName" type="text" value="${data.name || ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="policyFee" style="display: block; margin-bottom: 5px; font-weight: 600;">기본 요금:</label>
          <input id="policyFee" type="number" value="${data.baseFee || ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="startDate" style="display: block; margin-bottom: 5px; font-weight: 600;">적용 시작일:</label>
          <input id="startDate" type="date" value="${data.applyFrom ? data.applyFrom.split('T')[0] : ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="endDate" style="display: block; margin-bottom: 5px; font-weight: 600;">적용 종료일:</label>
          <input id="endDate" type="date" value="${data.applyTo ? data.applyTo.split('T')[0] : ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <button class="action-btn" onclick="closeModal()" style="margin-right: 10px;">뒤로</button>
          <button class="action-btn primary" onclick="savePolicy(${data.id})">저장</button>
        </div>
      </div>
    </div>
  `;
  showModal(modalContent);
}
function openMonthlyPolicyModal(data) {
  const modalContent = `
    <div style="max-width: 500px;">
      <h2>월정기권 요금 정책 수정</h2>
      <div style="margin: 20px 0;">

        <div style="margin-bottom: 15px;">
          <label for="policyName" style="display: block; margin-bottom: 5px; font-weight: 600;">요금 명칭:</label>
          <input id="policyName" type="text" value="${data.name || ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="policyFee" style="display: block; margin-bottom: 5px; font-weight: 600;">기본 요금:</label>
          <input id="policyFee" type="number" value="${data.baseFee || ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="discountRate" style="display: block; margin-bottom: 5px; font-weight: 600;">할인율(%):</label>
          <input id="discountRate" type="number" value="${data.discountRate ? Math.round(data.discountRate * 100) : ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="startDate" style="display: block; margin-bottom: 5px; font-weight: 600;">적용 시작일:</label>
          <input id="startDate" type="date" value="${data.applyFrom ? data.applyFrom.split('T')[0] : ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="endDate" style="display: block; margin-bottom: 5px; font-weight: 600;">적용 종료일:</label>
          <input id="endDate" type="date" value="${data.applyTo ? data.applyTo.split('T')[0] : ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <button class="action-btn" onclick="closeModal()" style="margin-right: 10px;">뒤로</button>
          <button class="action-btn primary" onclick="savePolicy(${data.id})">저장</button>
        </div>
      </div>
    </div>
  `;
  showModal(modalContent);
}

async function savePolicy() {
  const policyType = document.getElementById('policyType')?.value || currentPolicyType; // 모달에 없으면 변수로 관리
  const policyId = currentPolicyId; // 수정 중인 정책 ID를 전역변수 또는 모달 상태로 관리

  // 공통 필드
  const data = {
    id: policyId,
    policyType: policyType,
    name: document.getElementById('policyName').value,
    baseFee: Number(document.getElementById('policyFee').value),
    applyFrom: document.getElementById('startDate').value,
    applyTo: document.getElementById('endDate').value,
  };

  // 타입별 추가 필드 분기
  if (policyType === 'TIME') {
    data.maxFee = Number(document.getElementById('maxFee').value);
    data.unitTime = Number(document.getElementById('unitTime').value);
  } else if (policyType === 'MONTHLY') {
    data.discountRate = Number(document.getElementById('discountRate').value) / 100;
  }
  // 일일제는 별도 필드 없음

  try {
    const res = await fetch('/admin/policy/fee/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('저장 실패');
    alert('저장 성공');
    closeModal();
    loadFeePolicies();
  } catch (e) {
    alert(e.message);
  }
}

async function fetchAndOpenRefundPolicyModal() {
  try {
    const res = await fetch('/admin/policy/refund/active'); // 환불 정책 API
    if (!res.ok) throw new Error('환불 정책 불러오기 실패');
    const data = await res.json();
    openRefundPolicyModal(data);
  } catch (e) {
    alert(e.message);
  }
}

function openRefundPolicyModal(data) {
  const modalContent = `
    <div style="max-width: 500px;">
      <h2>환불 정책 수정</h2>
      <div style="margin: 20px 0;">
        <div style="margin-bottom: 15px;">
          <label for="refundTimeLimit" style="display: block; margin-bottom: 5px; font-weight: 600;">전액 환불 가능 시간 제한(분):</label>
          <input id="refundTimeLimit" type="number" value="${data.refundTimeLimitMinutes || ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="penalty2days" style="display: block; margin-bottom: 5px; font-weight: 600;">2일 전 환불 수수료율(%):</label>
          <input id="penalty2days" type="number" step="0.1" value="${(data.penaltyBefore2days !== undefined && data.penaltyBefore2days !== null) ? (data.penaltyBefore2days * 100) : ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="penalty1day" style="display: block; margin-bottom: 5px; font-weight: 600;">1일 전 환불 수수료율(%):</label>
          <input id="penalty1day" type="number" step="0.1" value="${data.penaltyBefore1day ? data.penaltyBefore1day * 100 : ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-bottom: 15px;">
          <label for="penaltySameOrAfter" style="display: block; margin-bottom: 5px; font-weight: 600;">당일 이후 환불 불가 (%):</label>
          <input id="penaltySameOrAfter" type="number" step="0.1" value="${data.penaltySameOrAfter ? data.penaltySameOrAfter * 100 : ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;" disabled>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="applyFrom" style="display: block; margin-bottom: 5px; font-weight: 600;">적용 시작일:</label>
          <input id="applyFrom" type="date" value="${data.applyFrom ? data.applyFrom.split('T')[0] : ''}" style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px;">
        </div>

        <div style="margin-top: 30px; text-align: center;">
          <button class="action-btn" onclick="closeModal()" style="margin-right: 10px;">취소</button>
          <button class="action-btn primary" onclick="saveRefundPolicy()">저장</button>
        </div>
      </div>
    </div>
  `;
  showModal(modalContent);
}

async function saveRefundPolicy() {
  const data = {
    refundTimeLimitMinutes: Number(document.getElementById('refundTimeLimit').value),
    penaltyBefore2days: Number(document.getElementById('penalty2days').value) / 100,
    penaltyBefore1day: Number(document.getElementById('penalty1day').value) / 100,
    penaltySameOrAfter: Number(document.getElementById('penaltySameOrAfter').value) / 100,
    applyFrom: document.getElementById('applyFrom').value || null,  // 빈값이면 null로 처리
    active: true
  };

  try {
    const res = await fetch('/admin/policy/refund/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error('환불 정책 수정 실패');

    alert('환불 정책이 성공적으로 수정되었습니다.');
    closeModal();
    loadRefundPolicyCard();  // 수정 후 카드 UI 최신화
  } catch (e) {
    alert(e.message);
  }
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

