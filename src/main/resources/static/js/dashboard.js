// ========================================
// 대시보드 실시간 현황 (dashboard.js)
// ========================================

let updateInterval = null;

// ========================================
// 초기화
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📊 대시보드 모듈 로드됨');
  
  // 공통 라이브러리 초기화
  if (!initializeCommon()) {
    return;
  }
  
  // 대시보드 초기화
  initializeDashboard();
  
  console.log('✅ 대시보드 초기화 완료');
});

function initializeDashboard() {
  // 초기 데이터 로드
  loadInitialData();
  
  // 실시간 업데이트 시작
  startRealTimeUpdates();
  
  // 사용자 정보 업데이트
  updateUserInfo();
}

// ========================================
// 실시간 주차장 현황 API
// ========================================
async function loadLiveStatus() {
  console.log('📊 실시간 주차장 현황 로드 중...');
  
  const data = await apiRequest('/api/parking/live-status');
  if (!data) return false;
  
  try {
    const statusNumbers = document.querySelectorAll('.status-number');
    if (statusNumbers.length >= 4) {
      statusNumbers[0].textContent = data.totalSlots || 0;
      statusNumbers[1].textContent = data.occupiedSlots || 0;
      statusNumbers[2].textContent = data.availableSlots || 0;
      statusNumbers[3].textContent = (data.occupancyRate || 0) + '%';
      
      console.log('📊 실시간 현황 업데이트 완료');
    }
    return true;
  } catch (error) {
    console.error('❌ 실시간 현황 UI 업데이트 실패:', error);
    return false;
  }
}

// ========================================
// 현재 주차 상태 API (개인화)
// ========================================
async function loadCurrentParkingStatus() {
  console.log('🚗 현재 주차 상태 로드 중...');
  
  const data = await apiRequest('/api/parking/status');
  if (!data) return false;
  
  try {
    // 현재 주차중 상태 업데이트
    if (data.currentStatus && data.currentStatus.type === 'active') {
      updateCurrentParkingDisplay(data.currentStatus);
    }
    
    // 예약 상태 업데이트
    if (data.reservationStatus && data.reservationStatus.type === 'reserved') {
      updateReservationDisplay(data.reservationStatus);
    }
    
    console.log('✅ 현재 주차 상태 업데이트 완료');
    return true;
  } catch (error) {
    console.error('❌ 현재 주차 상태 UI 업데이트 실패:', error);
    return false;
  }
}

function updateCurrentParkingDisplay(currentStatus) {
  // 경과시간 업데이트
  const elapsedElement = document.getElementById('elapsed-time');
  if (elapsedElement) {
    elapsedElement.textContent = currentStatus.elapsedTime;
    elapsedElement.dataset.apiUpdated = 'true';
  }
  
  // 주차구역 업데이트
  const slotElements = document.querySelectorAll('.parking-slot');
  slotElements.forEach(el => {
    if (el) el.textContent = currentStatus.slotName;
  });
  
  // 예상요금 업데이트
  const feeElements = document.querySelectorAll('.estimated-fee, .current-fee');
  feeElements.forEach(el => {
    if (el) el.textContent = '₩' + currentStatus.estimatedFee.toLocaleString();
  });
  
  // 입차시간 업데이트
  const entryTimeElement = document.getElementById('entry-time');
  if (entryTimeElement) {
    entryTimeElement.textContent = currentStatus.entryTime;
  }
}

function updateReservationDisplay(reservationStatus) {
  const reservationElements = {
    slot: document.querySelectorAll('.reserved-slot'),
    time: document.querySelectorAll('.reserved-time'),
    duration: document.querySelectorAll('.reserved-duration'),
    fee: document.querySelectorAll('.reserved-fee')
  };
  
  reservationElements.slot.forEach(el => el.textContent = reservationStatus.slotName);
  reservationElements.time.forEach(el => el.textContent = reservationStatus.reservationTime);
  reservationElements.duration.forEach(el => el.textContent = reservationStatus.duration + '시간');
  reservationElements.fee.forEach(el => el.textContent = '₩' + reservationStatus.reservationFee.toLocaleString());
}

// ========================================
// 구역별 실시간 현황 API
// ========================================
async function loadRealtimeStatus() {
  console.log('🏢 구역별 실시간 현황 로드 중...');
  
  const data = await apiRequest('/api/parking/realtime-status');
  if (!data || !data.zones) return false;
  
  try {
    const zoneElements = document.querySelectorAll('.zone-status');
    
    data.zones.forEach((zone, index) => {
      if (zoneElements[index]) {
        const zoneElement = zoneElements[index];
        
        // 가용 주차면 업데이트
        const availableElement = zoneElement.querySelector('.available');
        if (availableElement) {
          availableElement.textContent = zone.total - zone.used;
        }
        
        // 전체 주차면 업데이트
        const totalElement = zoneElement.querySelector('.total');
        if (totalElement) {
          totalElement.textContent = zone.total;
        }
        
        // 가용률 업데이트
        const availableRate = Math.round(((zone.total - zone.used) / zone.total) * 100);
        const rateElement = zoneElement.querySelector('.zone-rate');
        if (rateElement) {
          rateElement.innerHTML = `가용률: ${availableRate}%<div class="rate-progress"></div>`;
          
          // 진행바 업데이트
          const progressElement = zoneElement.querySelector('.rate-progress');
          if (progressElement) {
            progressElement.style.setProperty('--progress', `${availableRate}%`);
          }
        }
        
        // 구역 색상 업데이트
        updateZoneColor(zoneElement, availableRate);
      }
    });
    
    console.log('✅ 구역별 실시간 현황 업데이트 완료');
    return true;
  } catch (error) {
    console.error('❌ 구역별 실시간 현황 UI 업데이트 실패:', error);
    return false;
  }
}

function updateZoneColor(zoneElement, availableRate) {
  zoneElement.classList.remove('low-availability', 'medium-availability', 'high-availability');
  
  if (availableRate < 20) {
    zoneElement.classList.add('low-availability');
  } else if (availableRate < 50) {
    zoneElement.classList.add('medium-availability');
  } else {
    zoneElement.classList.add('high-availability');
  }
}

// ========================================
// 입출차 로그 API
// ========================================
async function loadParkingLogs(page = 1, limit = 20) {
  console.log('📋 입출차 로그 로드 중...', { page, limit });
  
  try {
    const data = await apiRequest(`/api/parking/logs?page=${page}&limit=${limit}`);
    if (!data) return false;
    
    renderParkingLogsTable(data.logs || []);
    updatePaginationInfo(data.pagination || {});
    
    console.log('✅ 입출차 로그 업데이트 완료', { 
      totalLogs: data.logs?.length || 0,
      currentPage: page 
    });
    
    return true;
  } catch (error) {
    console.error('❌ 입출차 로그 로드 실패:', error);
    showErrorMessage('입출차 로그를 불러오는데 실패했습니다.');
    return false;
  }
}

// ========================================
// 로그 테이블 렌더링
// ========================================
function renderParkingLogsTable(logs) {
  const tbody = document.getElementById('parkinglog');
  if (!tbody) {
    console.warn('⚠️ 입출차 로그 테이블 엘리먼트를 찾을 수 없습니다.');
    return;
  }
  
  tbody.innerHTML = ''; // 기존 내용 초기화
  
  if (!logs || logs.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="no-data">
          입출차 로그가 없습니다.
        </td>
      </tr>
    `;
    return;
  }
  
  logs.forEach((log, index) => {
    const row = document.createElement('tr');
    row.className = getLogRowClass(log.status);
    
    // 주차 시간 계산
    const duration = calculateParkingDuration(log.entryTime, log.exitTime);
    
    row.innerHTML = `
      <td>${log.id || (index + 1)}</td>
      <td class="car-number">${escapeHtml(log.carNumber || '-')}</td>
      <td class="requester">${escapeHtml(log.requester || '-')}</td>
      <td class="parking-type">${getParkingTypeBadge(log.parkingType)}</td>
      <td class="entry-time">${formatDateTime(log.entryTime)}</td>
      <td class="exit-time">${formatDateTime(log.exitTime)}</td>
      <td class="duration">${duration}</td>
      <td class="status">${getStatusBadge(log.status)}</td>
      <td class="fee">₩${(log.fee || 0).toLocaleString()}</td>
    `;
    
    tbody.appendChild(row);
  });
}

// ========================================
// 로그 관련 유틸리티 함수
// ========================================
function getLogRowClass(status) {
  const statusClasses = {
    'completed': 'log-completed',
    'active': 'log-active',
    'cancelled': 'log-cancelled'
  };
  return statusClasses[status] || '';
}

function getParkingTypeBadge(type) {
  const typeMap = {
    'monthly': '<span class="badge badge-monthly">월주차</span>',
    'daily': '<span class="badge badge-daily">일주차</span>',
    'hourly': '<span class="badge badge-hourly">시간주차</span>'
  };
  return typeMap[type] || '<span class="badge badge-default">-</span>';
}

function getStatusBadge(status) {
  const statusMap = {
    'completed': '<span class="badge badge-success">완료</span>',
    'active': '<span class="badge badge-warning">주차중</span>',
    'cancelled': '<span class="badge badge-danger">취소</span>'
  };
  return statusMap[status] || '<span class="badge badge-default">-</span>';
}

function calculateParkingDuration(entryTime, exitTime) {
  if (!entryTime) return '-';
  if (!exitTime) return '주차중';
  
  const entry = new Date(entryTime);
  const exit = new Date(exitTime);
  const diffMs = exit.getTime() - entry.getTime();
  
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
}

function formatDateTime(dateTime) {
  if (!dateTime) return '-';
  
  try {
    const date = new Date(dateTime);
    const yyyy = date.getFullYear();
    const MM = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}`;
  } catch (error) {
    console.error('❌ 날짜 포맷팅 실패:', error);
    return '-';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========================================
// 페이지네이션 처리
// ========================================
function updatePaginationInfo(pagination) {
  const paginationContainer = document.getElementById('pagination-container');
  if (!paginationContainer || !pagination) return;
  
  const { currentPage = 1, totalPages = 1, totalCount = 0 } = pagination;
  
  // 페이지 정보 업데이트
  const pageInfo = document.getElementById('page-info');
  if (pageInfo) {
    pageInfo.textContent = `${currentPage} / ${totalPages} 페이지 (총 ${totalCount}건)`;
  }
  
  // 페이지네이션 버튼 업데이트
  updatePaginationButtons(currentPage, totalPages);
}

function updatePaginationButtons(currentPage, totalPages) {
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  
  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
    prevBtn.onclick = () => {
      if (currentPage > 1) {
        loadParkingLogs(currentPage - 1);
      }
    };
  }
  
  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => {
      if (currentPage < totalPages) {
        loadParkingLogs(currentPage + 1);
      }
    };
  }
}

// ========================================
// 로그 검색 및 필터링
// ========================================
async function searchParkingLogs(searchParams = {}) {
  console.log('🔍 입출차 로그 검색 중...', searchParams);
  
  const queryParams = new URLSearchParams();
  
  // 검색 조건 추가
  Object.keys(searchParams).forEach(key => {
    if (searchParams[key]) {
      queryParams.append(key, searchParams[key]);
    }
  });
  
  try {
    const data = await apiRequest(`/api/parking/logs/search?${queryParams.toString()}`);
    if (data) {
      renderParkingLogsTable(data.logs || []);
      updatePaginationInfo(data.pagination || {});
      
      console.log('✅ 로그 검색 완료', { 
        results: data.logs?.length || 0,
        searchParams 
      });
    }
  } catch (error) {
    console.error('❌ 로그 검색 실패:', error);
    showErrorMessage('로그 검색에 실패했습니다.');
  }
}

// ========================================
// 로그 내보내기
// ========================================
async function exportParkingLogs(format = 'csv') {
  console.log('📤 입출차 로그 내보내기 중...', { format });
  
  showLoading('로그를 내보내는 중...');
  
  try {
    const response = await apiRequest(`/api/parking/logs/export?format=${format}`, {
      method: 'GET',
      responseType: 'blob'
    });
    
    if (response) {
      const filename = `parking_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      downloadFile(response, filename);
      
      hideLoading();
      showToast('로그가 성공적으로 내보내졌습니다.', 'success');
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 로그 내보내기 실패:', error);
    showToast('로그 내보내기에 실패했습니다.', 'error');
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
// 내 계정 정보 API
// ========================================
async function loadAccountInfo() {
  console.log('💳 내 계정 정보 로드 중...');
  
  const data = await apiRequest('/api/payment/account-info');
  if (!data) return false;
  
  try {
    // 포인트 정보 업데이트
    const pointElements = document.querySelectorAll('.point-amount, #point');
    pointElements.forEach(el => {
      if (el) el.textContent = data.point?.toLocaleString() + 'P';
    });
    
    // 선불 잔액 업데이트
    const balanceElements = document.querySelectorAll('.balance-amount, #prepaid-balance');
    balanceElements.forEach(el => {
      if (el) el.textContent = '₩' + data.prepaidBalance?.toLocaleString();
    });
    
    // 이번달 사용액 업데이트
    const usageElements = document.querySelectorAll('.monthly-usage');
    usageElements.forEach(el => {
      if (el) el.textContent = '₩' + data.monthlyUsage?.toLocaleString();
    });
    
    // 소멸 예정 포인트 업데이트
    const expireElements = document.querySelectorAll('.expire-point');
    expireElements.forEach(el => {
      if (el) el.textContent = data.pointExpireNextMonth?.toLocaleString() + 'P';
    });
    
    // 마지막 충전일 업데이트
    const lastChargedElements = document.querySelectorAll('#last-charged');
    lastChargedElements.forEach(el => {
      if (el) el.textContent = data.lastChargedAt || '-';
    });
    
    // 절약 정보 업데이트
    const savingsElements = document.querySelectorAll('.savings-rate');
    savingsElements.forEach(el => {
      if (el && data.compareLastMonth !== undefined) {
        const rate = Math.abs(data.compareLastMonth);
        const isPositive = data.compareLastMonth < 0;
        el.textContent = (isPositive ? '↓' : '↑') + rate + '%';
        el.style.color = isPositive ? '#10b981' : '#ef4444';
      }
    });
    
    console.log('✅ 내 계정 정보 업데이트 완료');
    return true;
  } catch (error) {
    console.error('❌ 내 계정 정보 UI 업데이트 실패:', error);
    return false;
  }
}

// ========================================
// 멤버십 정보 API
// ========================================
async function loadMembershipInfo() {
  console.log('🏆 멤버십 정보 로드 중...');
  
  const data = await apiRequest('/api/membership/info');
  if (!data) return false;
  
  try {
    // 멤버십 등급 업데이트
    const gradeElements = document.querySelectorAll('.membership-grade, #membership-grade');
    gradeElements.forEach(el => {
      if (el) el.textContent = data.membershipGrade;
    });
    
    // 할인율 업데이트
    const discountElements = document.querySelectorAll('.discount-rate');
    discountElements.forEach(el => {
      if (el) el.textContent = data.discountRate + '%';
    });
    
    console.log('✅ 멤버십 정보 업데이트 완료');
    return true;
  } catch (error) {
    console.error('❌ 멤버십 정보 UI 업데이트 실패:', error);
    return false;
  }
}

// ========================================
// 사용자 정보 업데이트
// ========================================
function updateUserInfo() {
  const user = getCurrentUser();
  if (user && user.name) {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      userNameElement.textContent = user.name;
    }
  }
}

// ========================================
// 실시간 업데이트 관리
// ========================================
function startRealTimeUpdates() {
  // 30초마다 실시간 데이터 업데이트
  updateInterval = setInterval(async () => {
    console.log('🔄 실시간 데이터 업데이트 중...');
    
    try {
      await Promise.all([
        loadLiveStatus(),
        loadRealtimeStatus(),
        loadCurrentParkingStatus(),
        loadParkingLogs(1, 20) // 로그도 실시간 업데이트에 포함
      ]);
      
      console.log('✅ 실시간 업데이트 완료');
    } catch (error) {
      console.error('❌ 실시간 업데이트 실패:', error);
    }
  }, 30000); // 30초
  
  console.log('⏰ 실시간 업데이트 시작 (30초 간격)');
}

function stopRealTimeUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log('⏰ 실시간 업데이트 중지');
  }
}

// ========================================
// 출차 요청
// ========================================
async function requestExit() {
  if (!confirm('출차를 요청하시겠습니까?')) {
    return;
  }
  
  showLoading('출차를 처리중입니다...');
  
  try {
    const response = await apiRequest('/api/parking/exit', {
      method: 'POST'
    });
    
    if (response) {
      hideLoading();
      showToast(`출차가 완료되었습니다!\n최종요금: ₩${response.finalFee?.toLocaleString()}\n주차시간: ${response.totalDuration}`, 'success');
      
      // 주차 상태 및 로그 업데이트
      await Promise.all([
        loadCurrentParkingStatus(),
        loadAccountInfo(),
        loadParkingLogs(1, 20) // 출차 후 로그 새로고침
      ]);
    }
  } catch (error) {
    hideLoading();
    showToast('출차 처리 중 오류가 발생했습니다.', 'error');
  }
}

// ========================================
// 예약 취소
// ========================================
async function cancelReservation(reservationId) {
  if (!confirm('예약을 정말 취소하시겠습니까?\n취소 수수료가 발생할 수 있습니다.')) {
    return;
  }
  
  showLoading('예약을 취소하는 중...');
  
  try {
    const response = await apiRequest(`/api/reservations/${reservationId}`, {
      method: 'DELETE'
    });
    
    if (response) {
      hideLoading();
      
      if (response.cancellationFee && response.cancellationFee > 0) {
        showToast(`예약이 취소되었습니다. 취소 수수료: ₩${response.cancellationFee.toLocaleString()}`, 'info');
      } else {
        showToast('예약이 취소되었습니다.', 'success');
      }
      
      // 예약 상태 및 로그 새로고침
      await Promise.all([
        loadCurrentParkingStatus(),
        loadParkingLogs(1, 20)
      ]);
    }
  } catch (error) {
    hideLoading();
    showToast('예약 취소에 실패했습니다.', 'error');
  }
}

// ========================================
// 에러 메시지 표시
// ========================================
function showErrorMessage(message) {
  const errorContainer = document.getElementById('error-message');
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
// 초기 데이터 로드
// ========================================
async function loadInitialData() {
  showLoading('데이터를 불러오는 중...');
  
  try {
    // 순차적 로드 (중요한 순서대로)
    await loadLiveStatus();
    await loadCurrentParkingStatus();
    
    // 병렬 로드 (나머지)
    await Promise.all([
      loadRealtimeStatus(),
      loadAccountInfo(),
      loadMembershipInfo(),
      loadParkingLogs(1, 20) // 초기 로그 로드
    ]);
    
    hideLoading();
    showToast('데이터 로드 완료!', 'success');
    
  } catch (error) {
    hideLoading();
    console.error('❌ 초기 데이터 로드 실패:', error);
    showToast('일부 데이터를 불러오지 못했습니다. 페이지를 새로고침해주세요.', 'warning');
  }
}

// ========================================
// 페이지 정리
// ========================================
window.addEventListener('beforeunload', function() {
  stopRealTimeUpdates();
});

// ========================================
// 전역 함수 노출
// ========================================
window.requestExit = requestExit;
window.cancelReservation = cancelReservation;
window.loadInitialData = loadInitialData;
window.loadParkingLogs = loadParkingLogs;
window.searchParkingLogs = searchParkingLogs;
window.exportParkingLogs = exportParkingLogs;