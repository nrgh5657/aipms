// ========================================
// 대시보드 실시간 현황 (dashboard.js)
// ========================================

let updateInterval = null;

// ========================================
// 초기화
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('📊 대시보드 모듈 로드됨');

  // 공통 라이브러리 확인
  if (!checkCommonLibraries()) {
    console.error('❌ 공통 라이브러리가 로드되지 않았습니다.');
    return;
  }
  initializeCommon()
  // 대시보드 초기화
  initializeDashboard();

  console.log('✅ 대시보드 초기화 완료');
});

function checkCommonLibraries() {
  return typeof apiRequest === 'function' &&
      typeof showLoading === 'function' &&
      typeof hideLoading === 'function' &&
      typeof showToast === 'function';
}

function initializeDashboard() {
  // 초기 데이터 로드
  loadInitialData();

  // 실시간 업데이트 시작
  startRealTimeUpdates();

  // 사용자 정보 업데이트
  updateUserInfo();

  // 모달 관련 이벤트 리스너 설정
  setupModalEvents();
}

function setupModalEvents() {
  // 모달 외부 클릭시 닫기
  document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });

  // ESC 키로 모달 닫기
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeModal();
      closeQRModal();
    }
  });
}

// ========================================
// 실시간 주차장 현황 API
// ========================================
async function loadLiveStatus() {
  console.log('📊 실시간 주차장 현황 로드 중...');

  try {
    const data = await apiRequest('/api/parking/live-status');
    if (!data) return false;

    const statusNumbers = document.querySelectorAll('.status-number');
    if (statusNumbers.length >= 4) {
      statusNumbers[0].textContent = data.totalSlots || 247;
      statusNumbers[1].textContent = data.occupiedSlots || 189;
      statusNumbers[2].textContent = data.availableSlots || 58;
      statusNumbers[3].textContent = (data.occupancyRate || 76) + '%';

      console.log('📊 실시간 현황 업데이트 완료');
    }
    return true;
  } catch (error) {
    console.error('❌ 실시간 현황 로드 실패:', error);
    return false;
  }
}

// ========================================
// 현재 주차 상태 API
// ========================================
async function loadCurrentParkingStatus() {
  console.log('🚗 현재 주차 상태 로드 중...');

  try {
    const data = await apiRequest('/api/parking/status');
    if (!data) return false;

    // 현재 주차중 상태 업데이트
    if (data.currentStatus && data.currentStatus.type === 'active') {
      updateCurrentParkingDisplay(data.currentStatus);
    }

    // 예약 상태 업데이트
    if (data.reservationStatus && data.reservationStatus.type === 'reserved') {
      updateReservationDisplay(data.reservationStatus);
    }

    // 이용 내역 업데이트
    if (data.history && data.history.length > 0) {
      updateRecentHistoryDisplay(data.history);
    }

    console.log('✅ 현재 주차 상태 업데이트 완료');
    return true;
  } catch (error) {
    console.error('❌ 현재 주차 상태 로드 실패:', error);
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

function updateRecentHistoryDisplay(history) {
  const historyContainer = document.querySelector('.recent-history-list');
  if (!historyContainer) return;

  historyContainer.innerHTML = '';

  // 최근 3개 항목만 표시
  history.slice(0, 3).forEach(record => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-date">${record.date}</div>
      <div class="history-details">
        <span class="history-spot">${record.slotName}</span>
        <span class="history-time">${record.duration}</span>
        <span class="history-amount">₩${record.fee.toLocaleString()}</span>
      </div>
      <span class="history-status completed">${record.status}</span>
    `;
    historyContainer.appendChild(item);
  });
}

// ========================================
// 구역별 실시간 현황 API
// ========================================
async function loadRealtimeStatus() {
  console.log('🏢 구역별 실시간 현황 로드 중...');

  try {
    const data = await apiRequest('/api/parking/realtime-status');
    if (!data || !data.zones) return false;

    const zoneContainer = document.querySelector('.zone-status-container');
    if (!zoneContainer) return false;

    zoneContainer.innerHTML = '';

    data.zones.forEach(zone => {
      const zoneElement = document.createElement('div');
      zoneElement.className = 'zone-status-item';

      // 가용률 계산
      const availableSlots = zone.total - zone.used;
      const availabilityRate = Math.round((availableSlots / zone.total) * 100);

      // 상태에 따른 클래스 설정
      let statusClass = 'high-availability';
      if (availabilityRate < 20) statusClass = 'low-availability';
      else if (availabilityRate < 50) statusClass = 'medium-availability';

      zoneElement.innerHTML = `
        <div class="zone-header">
          <span class="zone-name">${zone.zoneName}</span>
          <span class="zone-code">${zone.zoneCode}</span>
        </div>
        <div class="zone-stats">
          <div class="zone-available ${statusClass}">
            <span class="available-count">${availableSlots}</span>
            <span class="total-count">/${zone.total}</span>
          </div>
          <div class="zone-rate ${statusClass}">
            가용률: ${availabilityRate}%
            <div class="rate-progress">
              <div class="rate-bar" style="width: ${availabilityRate}%"></div>
            </div>
          </div>
        </div>
        <div class="zone-usage-rate">
          이용률: ${zone.usageRate}%
        </div>
      `;

      zoneContainer.appendChild(zoneElement);
    });

    console.log('✅ 구역별 실시간 현황 업데이트 완료');
    return true;
  } catch (error) {
    console.error('❌ 구역별 실시간 현황 로드 실패:', error);
    return false;
  }
}

// ========================================
// 내 계정 정보 API
// ========================================
async function loadAccountInfo() {
  console.log('💳 내 계정 정보 로드 중...');

  try {
    const data = await apiRequest('/api/payment/account-info');
    if (!data) return false;

    // 포인트 정보 업데이트
    const pointElements = document.querySelectorAll('.point-amount, #point');
    pointElements.forEach(el => {
      if (el) el.textContent = (data.point || 12500).toLocaleString() + 'P';
    });

    // 선불 잔액 업데이트
    const balanceElements = document.querySelectorAll('.balance-amount, #prepaid-balance');
    balanceElements.forEach(el => {
      if (el) el.textContent = '₩' + (data.prepaidBalance || 150000).toLocaleString();
    });

    // 이번달 사용액 업데이트
    const usageElements = document.querySelectorAll('.monthly-usage');
    usageElements.forEach(el => {
      if (el) el.textContent = '₩' + (data.monthlyUsage || 89500).toLocaleString();
    });

    // 소멸 예정 포인트 업데이트
    const expireElements = document.querySelectorAll('.expire-point');
    expireElements.forEach(el => {
      if (el && data.pointExpireNextMonth !== undefined) {
        el.textContent = '다음달 소멸 예정: ' + data.pointExpireNextMonth.toLocaleString() + 'P';
      }
    });

    // 마지막 충전일 업데이트
    const lastChargedElements = document.querySelectorAll('#last-charged');
    lastChargedElements.forEach(el => {
      if (el) el.textContent = data.lastChargedAt || '2025-06-28';
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
    console.error('❌ 내 계정 정보 로드 실패:', error);
    return false;
  }
}

// ========================================
// 멤버십 정보 API
// ========================================
async function loadMembershipInfo() {
  console.log('🏆 멤버십 정보 로드 중...');

  try {
    const data = await apiRequest('/api/membership/info');
    if (!data) return false;

    // 멤버십 등급 업데이트
    const gradeElements = document.querySelectorAll('.membership-grade, #membership-grade');
    gradeElements.forEach(el => {
      if (el) el.textContent = data.membershipGrade || '골드 멤버';
    });

    // 할인율 업데이트
    const discountElements = document.querySelectorAll('.discount-rate');
    discountElements.forEach(el => {
      if (el) el.textContent = (data.discountRate || 15) + '%';
    });

    console.log('✅ 멤버십 정보 업데이트 완료');
    return true;
  } catch (error) {
    console.error('❌ 멤버십 정보 로드 실패:', error);
    return false;
  }
}

// ========================================
// 사용자 정보 업데이트
// ========================================
function updateUserInfo() {
  try {
    // 서버에서 전달된 사용자 정보 확인
    if (typeof window.serverUserData !== 'undefined' && window.serverUserData.user) {
      const user = window.serverUserData.user;
      const userNameElement = document.getElementById('user-name');
      if (userNameElement && user.name) {
        userNameElement.textContent = user.name;
      }
    } else {
      // 기본값 유지
      const userNameElement = document.getElementById('user-name');
      if (userNameElement && !userNameElement.textContent) {
        userNameElement.textContent = '김고객';
      }
    }
  } catch (error) {
    console.error('❌ 사용자 정보 업데이트 실패:', error);
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
        loadCurrentParkingStatus()
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

      // 주차 상태 및 계정 정보 업데이트
      await Promise.all([
        loadCurrentParkingStatus(),
        loadAccountInfo()
      ]);
    }
  } catch (error) {
    hideLoading();
    showToast('출차 처리 중 오류가 발생했습니다.', 'error');
    console.error('❌ 출차 요청 실패:', error);
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

      // 예약 상태 새로고침
      await loadCurrentParkingStatus();
    }
  } catch (error) {
    hideLoading();
    showToast('예약 취소에 실패했습니다.', 'error');
    console.error('❌ 예약 취소 실패:', error);
  }
}

// ========================================
// QR 코드 표시
// ========================================
function showQR() {
  const qrModal = document.getElementById('qr-modal');
  if (qrModal) {
    qrModal.style.display = 'flex';

    // QR 코드 생성 (실제로는 QR 라이브러리 사용)
    generateQRCode();
  }
}

function closeQRModal() {
  const qrModal = document.getElementById('qr-modal');
  if (qrModal) {
    qrModal.style.display = 'none';
  }
}

function generateQRCode() {
  // 실제 QR 코드 생성 로직
  const qrDisplay = document.getElementById('qr-code-display');
  if (qrDisplay) {
    // 임시 QR 코드 표시
    const qrContainer = qrDisplay.querySelector('div');
    if (qrContainer) {
      qrContainer.style.background = '#333';
      qrContainer.style.color = '#fff';
      qrContainer.innerHTML = '■■□■□<br>□■■□■<br>■□□■■<br>□■■□□<br>■■□■■';
      qrContainer.style.fontFamily = 'monospace';
      qrContainer.style.lineHeight = '1';
    }
  }
}

// ========================================
// 모달 관리
// ========================================
function closeModal() {
  const modal = document.getElementById('detail-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function showModal(content) {
  const modal = document.getElementById('detail-modal');
  const contentDiv = document.getElementById('detail-content');

  if (modal && contentDiv) {
    contentDiv.innerHTML = content;
    modal.style.display = 'flex';
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
      loadMembershipInfo()
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
window.showQR = showQR;
window.closeQRModal = closeQRModal;
window.closeModal = closeModal;
window.loadInitialData = loadInitialData;
window.loadLiveStatus = loadLiveStatus;
window.loadCurrentParkingStatus = loadCurrentParkingStatus;
window.loadRealtimeStatus = loadRealtimeStatus;
window.loadAccountInfo = loadAccountInfo;
window.loadMembershipInfo = loadMembershipInfo;