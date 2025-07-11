// 전역 변수
let currentTab = 'dashboard';
let sidebarOpen = true;
let notifications = [];
let fireDetectionData = [];
let parkingData = [];
let policyData = [];
let memberData = [];
let paymentData = [];
let systemLogs = [];

// CCTV 관련 전역 변수
let cctvStreams = {};
let recordingStreams = {};
let isFullscreen = false;
let cameraDevices = [];

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
    id: '20250701001',
    time: '2025-07-01 10:14',
    location: '1층 주차장',
    result: '화재',
    confidence: '87.5%',
    adminJudgment: '화재 확인',
    alertStatus: '전송 완료',
    alertTime: '2025-07-01 10:15',
    notes: '라이터에 발화함'
  },
  {
    id: '20250701002',
    time: '2025-07-01 10:32',
    location: '2층 주차장',
    result: '화재',
    confidence: '94.3%',
    adminJudgment: '화재 확인',
    alertStatus: '전송 완료',
    alertTime: '2025-07-01 10:32',
    notes: '불꽃 명확히 포착'
  },
  {
    id: '20250701003',
    time: '2025-07-01 11:00',
    location: '3층 주차장',
    result: '정상',
    confidence: '99.1%',
    adminJudgment: '정상',
    alertStatus: '전송 안함',
    alertTime: '-',
    notes: '오탐 가능성 있음'
  }
];

const sampleParkingData = [
  {
    id: 'req20250701001',
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
    id: 'req20250701002',
    carNumber: '444헐 4444',
    requester: '이정재',
    type: '월주차',
    requestMonth: '7월',
    requestDate: '',
    status: '미승인',
    requestDay: '2025-06-25',
    approvalDate: '',
    paymentStatus: '미결재'
  }
];

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  initializeDashboard();
  setupEventListeners();
  loadSampleData();
  startRealTimeUpdates();
  updateParkingStatus();
  initializeCCTVSystem();
});

// 대시보드 초기화
function initializeDashboard() {
  console.log('관리자 대시보드 초기화');
  updateCurrentTime();
  updateStats();
  showSection('dashboard-overview');
  displayCapacityWarning();
}

// CCTV 시스템 초기화
async function initializeCCTVSystem() {
  console.log('CCTV 시스템 초기화 중...');
  
  try {
    // 사용 가능한 카메라 장치 목록 가져오기
    await getCameraDevices();
    
    // 각 CCTV 슬롯 초기화
    for (let i = 1; i <= 4; i++) {
      initializeCCTVSlot(i);
    }
    
    console.log('CCTV 시스템 초기화 완료');
  } catch (error) {
    console.error('CCTV 시스템 초기화 실패:', error);
    showAlert('CCTV 시스템 초기화에 실패했습니다. 카메라 권한을 확인해주세요.');
  }
}

// 카메라 장치 목록 가져오기
async function getCameraDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    cameraDevices = devices.filter(device => device.kind === 'videoinput');
    console.log(`발견된 카메라 장치: ${cameraDevices.length}개`);
    return cameraDevices;
  } catch (error) {
    console.error('카메라 장치 목록 가져오기 실패:', error);
    return [];
  }
}

// CCTV 슬롯 초기화
function initializeCCTVSlot(cctvId) {
  const video = document.getElementById(`video${cctvId}`);
  const canvas = document.getElementById(`canvas${cctvId}`);
  const placeholder = document.getElementById(`placeholder${cctvId}`);
  const status = document.getElementById(`status${cctvId}`);
  
  if (!video || !canvas || !placeholder || !status) {
    console.error(`CCTV ${cctvId} 요소를 찾을 수 없습니다.`);
    return;
  }
  
  // 4번 CCTV는 오프라인 상태로 설정
  if (cctvId === 4) {
    status.className = 'status-dot offline';
    return;
  }
  
  // 비디오 이벤트 리스너 설정
  video.addEventListener('loadedmetadata', () => {
    console.log(`CCTV ${cctvId} 메타데이터 로드됨`);
    updateCCTVStatus(cctvId, 'online');
  });
  
  video.addEventListener('error', (e) => {
    console.error(`CCTV ${cctvId} 오류:`, e);
    updateCCTVStatus(cctvId, 'offline');
  });
  
  // 캔버스 크기 설정
  canvas.width = 640;
  canvas.height = 480;
}

// CCTV 상태 업데이트
function updateCCTVStatus(cctvId, status) {
  const statusDot = document.getElementById(`status${cctvId}`);
  if (statusDot) {
    statusDot.className = `status-dot ${status}`;
  }
}

// 개별 카메라 시작
async function startCamera(cctvId) {
  if (cctvId === 4) {
    showAlert('4번 CCTV는 현재 점검 중입니다.');
    return;
  }
  
  try {
    const video = document.getElementById(`video${cctvId}`);
    const placeholder = document.getElementById(`placeholder${cctvId}`);
    
    if (!video || !placeholder) return;
    
    // 카메라 장치가 없으면 테스트 패턴 생성
    if (cameraDevices.length === 0) {
      startTestPattern(cctvId);
      return;
    }
    
    // 사용할 카메라 선택 (여러 카메라가 있으면 순서대로 할당)
    const deviceIndex = (cctvId - 1) % cameraDevices.length;
    const deviceId = cameraDevices[deviceIndex]?.deviceId;
    
    const constraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 15 }
      }
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // 스트림 저장
    cctvStreams[cctvId] = stream;
    
    // 비디오 엘리먼트에 스트림 연결
    video.srcObject = stream;
    video.style.display = 'block';
    placeholder.style.display = 'none';
    
    // 상태 업데이트
    updateCCTVStatus(cctvId, 'online');
    
    console.log(`CCTV ${cctvId} 카메라 시작됨`);
    showAlert(`CCTV ${cctvId} 카메라가 시작되었습니다.`);
    
  } catch (error) {
    console.error(`CCTV ${cctvId} 카메라 시작 실패:`, error);
    
    // 카메라 접근 실패 시 테스트 패턴으로 대체
    if (error.name === 'NotAllowedError') {
      showAlert('카메라 접근 권한이 거부되었습니다. 테스트 패턴을 표시합니다.');
    } else {
      showAlert('카메라를 시작할 수 없습니다. 테스트 패턴을 표시합니다.');
    }
    
    startTestPattern(cctvId);
  }
}

// 테스트 패턴 시작 (실제 카메라가 없을 때)
function startTestPattern(cctvId) {
  const canvas = document.getElementById(`canvas${cctvId}`);
  const placeholder = document.getElementById(`placeholder${cctvId}`);
  
  if (!canvas || !placeholder) return;
  
  const ctx = canvas.getContext('2d');
  canvas.style.display = 'block';
  placeholder.style.display = 'none';
  
  // 애니메이션 테스트 패턴 생성
  let frame = 0;
  const animate = () => {
    // 배경
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 격자 패턴
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // 움직이는 원
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 20 + Math.sin(frame * 0.1) * 10;
    
    ctx.fillStyle = '#4299e1';
    ctx.beginPath();
    ctx.arc(centerX + Math.cos(frame * 0.05) * 100, centerY + Math.sin(frame * 0.03) * 50, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // 텍스트
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`CCTV ${cctvId}`, centerX, centerY - 80);
    
    ctx.font = '16px Arial';
    ctx.fillText('테스트 패턴', centerX, centerY - 50);
    
    ctx.font = '12px Arial';
    ctx.fillText(`Frame: ${frame}`, centerX, centerY + 100);
    
    frame++;
    
    if (cctvStreams[cctvId]) {
      requestAnimationFrame(animate);
    }
  };
  
  // 테스트 스트림 마커
  cctvStreams[cctvId] = 'test-pattern';
  updateCCTVStatus(cctvId, 'online');
  
  animate();
  console.log(`CCTV ${cctvId} 테스트 패턴 시작됨`);
}

// 모든 카메라 시작
async function startAllCameras() {
  for (let i = 1; i <= 3; i++) { // 4번은 오프라인이므로 제외
    await startCamera(i);
    // 각 카메라 시작 사이에 약간의 지연
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// 개별 카메라 정지
function stopCamera(cctvId) {
  const video = document.getElementById(`video${cctvId}`);
  const canvas = document.getElementById(`canvas${cctvId}`);
  const placeholder = document.getElementById(`placeholder${cctvId}`);
  
  if (cctvStreams[cctvId]) {
    if (cctvStreams[cctvId] !== 'test-pattern') {
      // 실제 카메라 스트림 정지
      const tracks = cctvStreams[cctvId].getTracks();
      tracks.forEach(track => track.stop());
      
      if (video) {
        video.srcObject = null;
        video.style.display = 'none';
      }
    } else {
      // 테스트 패턴 정지
      if (canvas) {
        canvas.style.display = 'none';
      }
    }
    
    if (placeholder) {
      placeholder.style.display = 'block';
    }
    
    delete cctvStreams[cctvId];
    updateCCTVStatus(cctvId, 'offline');
    
    // 녹화 중이었다면 녹화도 정지
    if (recordingStreams[cctvId]) {
      stopRecording(cctvId);
    }
    
    console.log(`CCTV ${cctvId} 카메라 정지됨`);
  }
}

// 모든 카메라 정지
function stopAllCameras() {
  for (let i = 1; i <= 4; i++) {
    stopCamera(i);
  }
  showAlert('모든 카메라가 정지되었습니다.');
}

// 카메라 토글
function toggleCamera(cctvId) {
  if (cctvStreams[cctvId]) {
    stopCamera(cctvId);
  } else {
    startCamera(cctvId);
  }
}

// 프레임 캡처
function captureFrame(cctvId) {
  const video = document.getElementById(`video${cctvId}`);
  const canvas = document.getElementById(`canvas${cctvId}`);
  
  if (!cctvStreams[cctvId]) {
    showAlert('카메라가 실행되지 않았습니다.');
    return;
  }
  
  // 캡처용 임시 캔버스 생성
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');
  
  if (cctvStreams[cctvId] === 'test-pattern') {
    // 테스트 패턴 캡처
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.drawImage(canvas, 0, 0);
  } else {
    // 실제 비디오 캡처
    tempCanvas.width = video.videoWidth || 640;
    tempCanvas.height = video.videoHeight || 480;
    tempCtx.drawImage(video, 0, 0);
  }
  
  // 타임스탬프 추가
  tempCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  tempCtx.fillRect(tempCanvas.width - 200, tempCanvas.height - 30, 200, 30);
  
  tempCtx.fillStyle = 'white';
  tempCtx.font = '14px Arial';
  tempCtx.textAlign = 'right';
  tempCtx.fillText(new Date().toLocaleString(), tempCanvas.width - 10, tempCanvas.height - 10);
  
  // 이미지 다운로드
  tempCanvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const link = document.getElementById('downloadLink');
    link.href = url;
    link.download = `cctv-${cctvId}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
    link.click();
    
    // 메모리 정리
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  
  showAlert(`CCTV ${cctvId} 화면이 캡처되었습니다.`);
}

// 전체 캡처
async function captureAll() {
  for (let i = 1; i <= 4; i++) {
    if (cctvStreams[i]) {
      captureFrame(i);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  showAlert('모든 CCTV 화면이 캡처되었습니다.');
}

// 녹화 토글
function toggleRecord(cctvId) {
  if (recordingStreams[cctvId]) {
    stopRecording(cctvId);
  } else {
    startRecording(cctvId);
  }
}

// 녹화 시작
function startRecording(cctvId) {
  if (!cctvStreams[cctvId]) {
    showAlert('카메라가 실행되지 않았습니다.');
    return;
  }
  
  if (cctvStreams[cctvId] === 'test-pattern') {
    showAlert('테스트 패턴은 녹화할 수 없습니다.');
    return;
  }
  
  try {
    const stream = cctvStreams[cctvId];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9' 
    });
    
    const chunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `cctv-${cctvId}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
      link.click();
      
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    
    mediaRecorder.start();
    recordingStreams[cctvId] = mediaRecorder;
    
    // UI 업데이트
    const viewer = document.getElementById(`cctvDisplay${cctvId}`).closest('.cctv-viewer');
    const recordBtn = document.getElementById(`recordBtn${cctvId}`);
    const status = document.getElementById(`status${cctvId}`);
    
    viewer.classList.add('recording');
    recordBtn.textContent = '⏹️';
    status.classList.add('recording');
    
    console.log(`CCTV ${cctvId} 녹화 시작됨`);
    showAlert(`CCTV ${cctvId} 녹화가 시작되었습니다.`);
    
  } catch (error) {
    console.error(`CCTV ${cctvId} 녹화 시작 실패:`, error);
    showAlert('녹화를 시작할 수 없습니다.');
  }
}

// 녹화 정지
function stopRecording(cctvId) {
  if (recordingStreams[cctvId]) {
    recordingStreams[cctvId].stop();
    delete recordingStreams[cctvId];
    
    // UI 업데이트
    const viewer = document.getElementById(`cctvDisplay${cctvId}`).closest('.cctv-viewer');
    const recordBtn = document.getElementById(`recordBtn${cctvId}`);
    const status = document.getElementById(`status${cctvId}`);
    
    viewer.classList.remove('recording');
    recordBtn.textContent = '🎥';
    status.classList.remove('recording');
    
    console.log(`CCTV ${cctvId} 녹화 정지됨`);
    showAlert(`CCTV ${cctvId} 녹화가 정지되었습니다.`);
  }
}

// 전체 녹화
function recordAll() {
  let recordingCount = 0;
  
  for (let i = 1; i <= 4; i++) {
    if (cctvStreams[i] && cctvStreams[i] !== 'test-pattern') {
      startRecording(i);
      recordingCount++;
    }
  }
  
  if (recordingCount > 0) {
    showAlert(`${recordingCount}개 CCTV 녹화가 시작되었습니다.`);
  } else {
    showAlert('녹화 가능한 카메라가 없습니다.');
  }
}

// 전체화면 토글
function toggleFullscreen() {
  // 현재 활성화된 비디오 찾기
  let activeVideo = null;
  let activeCctvId = null;
  
  for (let i = 1; i <= 4; i++) {
    if (cctvStreams[i]) {
      const video = document.getElementById(`video${i}`);
      if (video && video.style.display !== 'none') {
        activeVideo = video;
        activeCctvId = i;
        break;
      }
    }
  }
  
  if (!activeVideo) {
    showAlert('전체화면으로 표시할 영상이 없습니다.');
    return;
  }
  
  if (!document.fullscreenElement) {
    activeVideo.requestFullscreen().then(() => {
      showAlert(`CCTV ${activeCctvId} 전체화면 모드`);
    }).catch(err => {
      console.error('전체화면 실패:', err);
      showAlert('전체화면 모드를 사용할 수 없습니다.');
    });
  } else {
    document.exitFullscreen();
  }
}

// 이벤트 리스너 설정
function setupEventListeners() {
  // 탭 이벤트
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      setActiveTab(this);
      const tabName = this.dataset.tab;
      switchTab(tabName);
    });
  });

  // 필터 버튼 이벤트
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      setActiveFilter(this);
      applyFilters();
    });
  });

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
    if (e.key === 'Escape' && document.fullscreenElement) {
      document.exitFullscreen();
    }
  });
  
  // 전체화면 변경 이벤트
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) {
      console.log('전체화면 모드 종료');
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
  
  const currentDateElement = document.getElementById('currentDate');
  if (currentDateElement) {
    currentDateElement.textContent = `작성일: ${timeString}`;
  }
  
  const lastFireCheck = document.getElementById('lastFireCheck');
  if (lastFireCheck) {
    lastFireCheck.textContent = '방금 전';
  }
}

// CCTV 타임스탬프 업데이트
function updateCCTVTimestamps() {
  const timestamps = document.querySelectorAll('.timestamp');
  const now = new Date();
  const timeString = now.toLocaleString('ko-KR');
  
  timestamps.forEach((timestamp, index) => {
    const cctvId = index + 1;
    if (cctvStreams[cctvId] && !timestamp.closest('.cctv-display').classList.contains('offline')) {
      timestamp.textContent = timeString;
    }
  });
}

// 활성 탭 설정
function setActiveTab(activeTab) {
  const navTabs = document.querySelectorAll('.nav-tab');
  navTabs.forEach(tab => tab.classList.remove('active'));
  activeTab.classList.add('active');
}

// 탭 전환
function switchTab(tabName) {
  currentTab = tabName;
  
  const screenIds = {
    'dashboard': 'Dashboard_001',
    'parking-management': 'ParkingManagement_ListView_001',
    'fee-management': 'FeeManagement_001',
    'fire-management': 'FireManagement_001',
    'member-management': 'MemberManagement_001',
    'system-logs': 'SystemLogs_001'
  };
  
  const screenNames = {
    'dashboard': '관리자 통합 대시보드',
    'parking-management': '주차 관리 ListView',
    'fee-management': '요금 관리',
    'fire-management': '화재 관리',
    'member-management': '회원 관리',
    'system-logs': '시스템 로그 관리'
  };
  
  updateElementIfExists('currentScreen', `화면ID: ${screenIds[tabName] || 'Dashboard_001'}`);
  updateElementIfExists('screenName', `화면명: ${screenNames[tabName] || '관리자 통합 대시보드'}`);
  
  if (tabName === 'dashboard') {
    showSection('dashboard-overview');
  } else {
    showSection(`${tabName}-section`);
  }
}

// 섹션 표시
function showSection(sectionId) {
  const sections = document.querySelectorAll('.content-section, .dashboard-overview');
  sections.forEach(section => {
    section.style.display = 'none';
  });
  
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.style.display = 'block';
  }
}

// 페이지 로드 (사이드바 메뉴)
function loadPage(pageName) {
  console.log(`페이지 로드: ${pageName}`);
  
  switch(pageName) {
    case 'parking-status':
    case 'parking-approval':
    case 'parking-reservation':
      setActiveTab(document.querySelector('[data-tab="parking-management"]'));
      switchTab('parking-management');
      break;
    case 'fee-policy':
    case 'payment-history':
      setActiveTab(document.querySelector('[data-tab="fee-management"]'));
      switchTab('fee-management');
      break;
    case 'fire-detection':
    case 'cctv-monitoring':
    case 'fire-judgment':
      setActiveTab(document.querySelector('[data-tab="fire-management"]'));
      switchTab('fire-management');
      break;
    case 'member-list':
    case 'vehicle-management':
      setActiveTab(document.querySelector('[data-tab="member-management"]'));
      switchTab('member-management');
      break;
    case 'system-status':
    case 'system-logs':
      setActiveTab(document.querySelector('[data-tab="system-logs"]'));
      switchTab('system-logs');
      break;
    default:
      console.log(`알 수 없는 페이지: ${pageName}`);
  }
}

// 샘플 데이터 로드
function loadSampleData() {
  fireDetectionData = [...sampleFireData];
  parkingData = [...sampleParkingData];
  updateParkingStatus();
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
  
  displayCapacityWarning();
}

// 용량 경고 표시
function displayCapacityWarning() {
  const warnings = [];
  
  if (parkingStatus.approvedMonthly >= PARKING_LIMITS.MONTHLY_LIMIT) {
    warnings.push(`월주차 한도 초과: ${parkingStatus.approvedMonthly}/${PARKING_LIMITS.MONTHLY_LIMIT}대`);
  }
  
  const totalUsed = parkingStatus.approvedMonthly + parkingStatus.approvedDaily + parkingStatus.currentGeneral;
  if (totalUsed >= PARKING_LIMITS.TOTAL_SPACES) {
    warnings.push(`전체 주차 공간 부족: ${totalUsed}/${PARKING_LIMITS.TOTAL_SPACES}대`);
  }
  
  if (warnings.length > 0) {
    console.warn('주차 용량 경고:', warnings);
  }
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

// 요소가 존재할 때만 업데이트
function updateElementIfExists(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

// 사이드바 토글
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const mainContent = document.querySelector('.main-content');
  const sidebarShowBtn = document.getElementById('sidebarShowBtn');
  
  sidebarOpen = !sidebarOpen;
  
  if (sidebarOpen) {
    sidebar.classList.remove('collapsed');
    mainContent.classList.remove('expanded');
    sidebarShowBtn.classList.remove('visible');
  } else {
    sidebar.classList.add('collapsed');
    mainContent.classList.add('expanded');
    sidebarShowBtn.classList.add('visible');
  }
}

// 알림 팝업 표시
function showAlert(message) {
  const alertPopup = document.getElementById('alertPopup');
  const alertMessage = document.getElementById('alertMessage');
  
  if (alertMessage && alertPopup) {
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

// 모달 관련 함수들
function showModal(content) {
  const modalOverlay = document.getElementById('modalOverlay');
  const modalContent = document.getElementById('modalContent');
  
  if (modalContent && modalOverlay) {
    modalContent.innerHTML = content;
    modalOverlay.classList.add('active');
  }
}

function closeModal() {
  const modalOverlay = document.getElementById('modalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
  }
}

// 기타 더미 함수들 (원본에서 가져온 함수들)
function exportFireLog() { showAlert('화재 감지 로그를 내보냅니다.'); }
function refreshFireLog() { showAlert('화재 감지 로그를 새로고침합니다.'); }
function addManualFireLog() { showAlert('수동 화재 기록 추가 기능입니다.'); }
function showNotifications() { showAlert('알림 패널을 표시합니다.'); }
function showSettings() { showAlert('설정 화면을 표시합니다.'); }
function showAdminRegister() { showAlert('관리자 등록 화면을 표시합니다.'); }
function logout() { 
  if (confirm('로그아웃 하시겠습니까?')) {
    // 모든 카메라 정지
    stopAllCameras();
    showAlert('로그아웃되었습니다.');
    const form = document.getElementById('logoutForm');
    if (form) {
      form.submit();
    } else {
      console.error("❌ 로그아웃 폼이 존재하지 않습니다.");
    }
  }
}
function saveCurrentSettings() { showAlert('현재 설정이 저장되었습니다.'); }
function refreshCurrentSection() { 
  showAlert('현재 화면을 새로고침합니다.');
  if (currentTab === 'fire-management') {
    // CCTV 타임스탬프 업데이트
    updateCCTVTimestamps();
  }
}

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  // 모든 카메라 스트림 정리
  stopAllCameras();
});

// 로그인 정보 확인
window.addEventListener('DOMContentLoaded', function() {
  const loginData = localStorage.getItem('smartParkingLogin') || 
                   sessionStorage.getItem('smartParkingLogin');
  
  if (loginData) {
    try {
      const userData = JSON.parse(loginData);
      console.log('관리자 로그인 정보:', userData);
      
      const userElement = document.getElementById('adminName');
      if (userElement && userData.user) {
        userElement.textContent = userData.user.name || 'Admin';
      }
    } catch (e) {
      console.log('로그인 정보 파싱 오류');
    }
  }
});