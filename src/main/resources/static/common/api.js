// ========================================
// 공통 API 및 유틸리티 (common/api.js)
// ========================================

// 전역 변수
let currentUserFromSession = null;
let userRoleFromSession = null;
let isLoggedIn = false;

// ========================================
// 로그인 상태 확인 및 검증
// ========================================
function checkAndValidateLogin() {
  let parsedUserData = null;

  try {
    if (typeof serverUserData === 'string') {
      parsedUserData = JSON.parse(serverUserData);
    } else if (typeof serverUserData === 'object') {
      parsedUserData = serverUserData;
    }
  } catch (e) {
    console.warn('❌ serverUserData 파싱 실패:', e);
    parsedUserData = null;
  }

  if (parsedUserData && parsedUserData.user) {
    currentUserFromSession = parsedUserData.user;
    userRoleFromSession = parsedUserData.role;
    isLoggedIn = true;

    if (userRoleFromSession !== 'USER') {
      console.warn('⚠️ 고객 전용 서비스입니다. 현재 역할:', userRoleFromSession);
      showToast('고객 전용 서비스입니다.', 'warning');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      return false;
    }

    console.log('👤 로그인된 고객:', {
      user: currentUserFromSession,
      role: userRoleFromSession
    });
    return true;
  } else {
    console.warn('🔒 로그인이 필요한 서비스입니다 (user 정보 없음)');
    showLoginRequiredModal();
    return false;
  }
}


function showLoginRequiredModal() {
  // 로그인 필요 안내 모달 표시
  const modal = document.createElement('div');
  modal.className = 'login-required-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    color: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;

  modal.innerHTML = `
    <div style="
      background: white;
      color: black;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      max-width: 400px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    ">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
      <h2 style="margin: 0 0 1rem 0; color: #1e3a8a;">로그인이 필요합니다</h2>
      <p style="margin: 0 0 1.5rem 0; color: #64748b; line-height: 1.5;">
        개인화된 주차 서비스를 이용하시려면<br>
        로그인을 해주세요.
      </p>
      <div style="display: flex; gap: 0.5rem; justify-content: center;">
        <button onclick="goToLogin()" style="
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        ">로그인</button>
        <button onclick="goToHome()" style="
          background: #e2e8f0;
          color: #64748b;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        ">홈으로</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 전역 함수 정의
  window.goToLogin = function() {
    window.location.href = '/login';
  };

  window.goToHome = function() {
    window.location.href = '/';
  };
}

// ========================================
// API 요청 헬퍼 함수
// ========================================
async function apiRequest(url, options = {}) {
  // 로그인 상태 재확인
  if (!isLoggedIn) {
    console.error('🔒 API 요청 거부: 로그인 필요');
    showToast('로그인이 필요합니다.', 'error');
    setTimeout(() => window.location.href = '/login', 1000);
    return null;
  }

  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include' // 세션 쿠키를 자동으로 포함
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };

  try {
    console.log(`🌐 API 요청: ${url}`);
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        console.error('🔒 인증 실패 - 세션 만료');
        showToast('로그인 세션이 만료되었습니다. 다시 로그인해주세요.', 'error');
        setTimeout(() => window.location.href = '/login', 2000);
        return null;
      }
      if (response.status === 403) {
        console.error('🚫 권한 없음');
        showToast('접근 권한이 없습니다.', 'error');
        return null;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ API 응답 성공: ${url}`);
    return data;

  } catch (error) {
    console.error(`❌ API 요청 실패 [${url}]:`, error);

    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      showToast('네트워크 연결을 확인해주세요.', 'error');
    } else {
      showToast('서버 연결에 문제가 발생했습니다.', 'error');
    }
    return null;
  }
}

// ========================================
// UI 유틸리티 함수들
// ========================================
function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

function showToast(message, type = 'info') {
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());

  const toast = document.createElement('div');
  toast.className = `toast show ${type}`;

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span style="margin-right: 0.5rem;">${icons[type] || icons.info}</span>
    ${message.replace(/\n/g, '<br>')}
  `;

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    font-size: 0.95rem;
    animation: slideInFromRight 0.3s ease-out;
    max-width: 400px;
    line-height: 1.4;
  `;

  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideInFromRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutToRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutToRight 0.3s ease-out';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, 4000);

  console.log('📢 토스트:', message);
}

function showLoading(message = '처리중...') {
  const existing = document.querySelector('.loading-overlay');
  if (existing) existing.remove();

  const loading = document.createElement('div');
  loading.className = 'loading-overlay';
  loading.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    color: white;
    font-size: 1.2rem;
    backdrop-filter: blur(2px);
  `;

  loading.innerHTML = `
    <div style="text-align: center;">
      <div style="margin-bottom: 1rem; font-size: 2rem;">⏳</div>
      <div>${message}</div>
    </div>
  `;

  document.body.appendChild(loading);
}

function hideLoading() {
  const loading = document.querySelector('.loading-overlay');
  if (loading) {
    loading.remove();
  }
}

function showQR() {
  showLoading('QR 코드를 생성중입니다...');

  setTimeout(() => {
    hideLoading();

    // QR 코드 모달 생성
    const qrModal = document.createElement('div');
    qrModal.className = 'qr-modal';
    qrModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    qrModal.innerHTML = `
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        max-width: 300px;
      ">
        <h3 style="margin: 0 0 1rem 0;">입차용 QR 코드</h3>
        <div style="
          width: 200px;
          height: 200px;
          background: #f8fafc;
          border: 2px dashed #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem auto;
          font-size: 48px;
        ">📱</div>
        <p style="margin: 0 0 1rem 0; color: #64748b; font-size: 0.9rem;">
          게이트에서 이 QR코드를 스캔해주세요
        </p>
        <button onclick="closeQRModal()" style="
          background: #3b82f6;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
        ">닫기</button>
      </div>
    `;

    document.body.appendChild(qrModal);

    window.closeQRModal = function() {
      document.body.removeChild(qrModal);
      delete window.closeQRModal;
    };

    // 모달 외부 클릭시 닫기
    qrModal.addEventListener('click', function(e) {
      if (e.target === qrModal) {
        closeQRModal();
      }
    });
  }, 1000);
}

// ========================================
// 접근성 및 에러 처리
// ========================================
function enhanceAccessibility() {
  const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  interactiveElements.forEach(element => {
    element.addEventListener('focus', function() {
      this.style.outline = '3px solid #60a5fa';
      this.style.outlineOffset = '2px';
    });

    element.addEventListener('blur', function() {
      this.style.outline = 'none';
    });
  });

  // ARIA 라벨 추가
  const statusElements = document.querySelectorAll('.status-number');
  statusElements.forEach((element, index) => {
    const labels = ['전체 주차면', '사용중', '빈공간', '이용률'];
    element.setAttribute('aria-label', labels[index]);
  });

  console.log('♿ 접근성 개선 완료');
}

function setupErrorHandling() {
  window.addEventListener('error', function(e) {
    console.error('JavaScript 오류:', e.error);

    const errorMessages = {
      'TypeError': '일시적인 시스템 오류가 발생했습니다.',
      'ReferenceError': '페이지를 새로고침해 주세요.',
      'NetworkError': '인터넷 연결을 확인해주세요.',
      'SyntaxError': '데이터 처리 중 오류가 발생했습니다.'
    };

    const errorType = e.error?.constructor.name || 'Error';
    const message = errorMessages[errorType] || '알 수 없는 오류가 발생했습니다.';

    showToast(message, 'error');
  });

  window.addEventListener('unhandledrejection', function(e) {
    console.error('처리되지 않은 Promise 거부:', e.reason);

    if (e.reason?.message?.includes('fetch')) {
      showToast('서버 연결을 확인해주세요.', 'error');
    } else {
      showToast('요청 처리 중 오류가 발생했습니다.', 'error');
    }

    e.preventDefault();
  });

  console.log('🛡️ 에러 처리 설정 완료');
}

// ========================================
// 키보드 단축키
// ========================================
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(event) {
    // 기본 단축키
    if (event.ctrlKey && event.key === 'h') {
      event.preventDefault();
      window.location.href = '/';
      showToast('홈으로 이동합니다.', 'info');
      return;
    }

    // 고객 전용 단축키
    if (event.ctrlKey) {
      switch(event.key) {
        case 'r':
          event.preventDefault();
          window.location.href = '/customer/reservation';
          showToast('예약 페이지로 이동합니다.', 'info');
          break;
        case 'p':
          event.preventDefault();
          window.location.href = '/customer/payment';
          showToast('결제 페이지로 이동합니다.', 'info');
          break;
        case 'l':
          event.preventDefault();
          window.location.href = '/customer/records';
          showToast('이용내역 페이지로 이동합니다.', 'info');
          break;
        case 'q':
          event.preventDefault();
          showQR();
          break;
        case 'e':
          event.preventDefault();
          if (confirm('출차를 요청하시겠습니까?')) {
            if (window.requestExit) {
              requestExit();
            }
          }
          break;
      }
    }
  });

  console.log('⌨️ 고객 전용 키보드 단축키 활성화');
  console.log('   Ctrl + H: 홈, Ctrl + R: 예약, Ctrl + P: 결제');
  console.log('   Ctrl + L: 이용내역, Ctrl + Q: QR코드, Ctrl + E: 출차');
}

// ========================================
// 페이지 이벤트 처리
// ========================================
function setupPageEvents() {
  // 페이지 가시성 변경 감지
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden && isLoggedIn) {
      console.log('🔄 페이지 활성화 - 데이터 새로고침');
      if (window.loadInitialData) {
        loadInitialData();
      }
    }
  });

  // 온라인/오프라인 상태 감지
  window.addEventListener('online', function() {
    if (isLoggedIn) {
      showToast('인터넷 연결이 복구되었습니다.', 'success');
      if (window.loadInitialData) {
        loadInitialData();
      }
    }
  });

  window.addEventListener('offline', function() {
    showToast('인터넷 연결을 확인해주세요.', 'warning');
  });

  // ESC 키로 모달 닫기
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      if (window.closeModal) closeModal();
      if (window.cancelVehicleForm) cancelVehicleForm();
      if (window.closeQRModal) closeQRModal();
    }
  });

  // 입력 필드 실시간 유효성 검사
  document.addEventListener('input', function(event) {
    // 차량번호 패턴 검사
    if (event.target.type === 'text' && event.target.id === 'car-number') {
      const value = event.target.value;
      const pattern = /^\d{2,3}[가-힣]\d{4}$/;

      if (value && !pattern.test(value)) {
        event.target.style.borderColor = '#e53e3e';
        event.target.style.background = '#fef2f2';
      } else {
        event.target.style.borderColor = '#e2e8f0';
        event.target.style.background = 'white';
      }
    }

    // 이메일 패턴 검사
    if (event.target.type === 'email') {
      const value = event.target.value;
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (value && !emailPattern.test(value)) {
        event.target.style.borderColor = '#e53e3e';
      } else {
        event.target.style.borderColor = '#e2e8f0';
      }
    }

    // 전화번호 자동 포맷팅
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

  // 숫자 입력 필드 검증
  document.addEventListener('input', function(event) {
    if (event.target.type === 'number') {
      const value = parseInt(event.target.value);
      const min = parseInt(event.target.min);
      const max = parseInt(event.target.max);

      if (min && value < min) {
        event.target.value = min;
      }
      if (max && value > max) {
        event.target.value = max;
      }
    }
  });
}

// ========================================
// 공통 초기화
// ========================================
function initializeCommon() {
  console.log('🚗 스마트파킹 공통 라이브러리 로드됨');

  // 로그인 상태 확인
  if (!checkAndValidateLogin()) {
    return false;
  }

  // 공통 기능 초기화
  enhanceAccessibility();
  setupErrorHandling();
  setupKeyboardShortcuts();
  setupPageEvents();

  console.log('✅ 공통 라이브러리 초기화 완료');
  return true;
}

// ========================================
// 전역 함수 노출
// ========================================
window.apiRequest = apiRequest;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.showQR = showQR;
window.updateElement = updateElement;
window.initializeCommon = initializeCommon;
window.checkAndValidateLogin = checkAndValidateLogin;

// 사용자 정보도 전역에서 접근 가능하도록
window.getCurrentUser = () => currentUserFromSession;
window.getUserRole = () => userRoleFromSession;
window.isUserLoggedIn = () => isLoggedIn;