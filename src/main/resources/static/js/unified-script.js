// ========================================
// 스마트파킹 Thymeleaf 호환 통합 스크립트
// ========================================

// 전역 변수 (Thymeleaf 호환)
let isThymeleafMode = true; // Thymeleaf 모드 플래그
let currentUserFromSession = null; // 서버에서 전달받은 사용자 정보
let userRoleFromSession = null; // 서버에서 전달받은 역할 정보

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚗 Thymeleaf 호환 스마트파킹 시스템 로드됨');
  
  // Thymeleaf 모드에서는 서버 사이드 렌더링 우선
  initializeThymeleafPage();
  
  // 기본 상호작용 기능들
  initializeInteractions();
  
  // 실시간 데이터 업데이트
  setInterval(updateRealTimeData, 30000);
  
  // 개선 기능들
  enhanceAccessibility();
  optimizePerformance();
  setupErrorHandling();
  checkBrowserCompatibility();
  setupDarkMode();
  
  console.log('✅ Thymeleaf 호환 초기화 완료');
});

// ========================================
// Thymeleaf 페이지 초기화
// ========================================
function initializeThymeleafPage() {
  console.log('🔧 Thymeleaf 모드 초기화');
  
  // 서버에서 전달된 사용자 정보 확인 (inline script에서 설정)
  if (typeof serverUserData !== 'undefined') {
    currentUserFromSession = serverUserData.user;
    userRoleFromSession = serverUserData.role;
    console.log('👤 서버 사용자 정보:', { user: currentUserFromSession?.name, role: userRoleFromSession });
  }
  
  // 부드러운 스크롤 설정
  setupSmoothScroll();
  
  // 스크롤 애니메이션 설정
  setupScrollAnimations();
  
  // URL 해시 처리
  handleHashNavigation();
}

// ========================================
// 기본 상호작용 기능 초기화
// ========================================
function initializeInteractions() {
  console.log('🔗 상호작용 기능 초기화');
  
  // 로고 이미지 에러 처리
  const logoImage = document.getElementById('logo-image');
  if (logoImage) {
    logoImage.addEventListener('error', function() {
      this.style.display = 'none';
      console.log('🖼️ 로고 이미지 로드 실패 - 숨김 처리');
    });
  }
  
  // FAQ 토글 기능
  setupFAQToggle();
  
  // 지도 기능
  setupMapFunction();
  
  // 모달 기능 (필요한 경우)
  setupModalHandlers();
  
  // 키보드 단축키 (로그인된 사용자용)
  setupKeyboardShortcuts();
}

// ========================================
// FAQ 토글 기능
// ========================================
function setupFAQToggle() {
  window.toggleFAQ = function(element) {
    const faqItem = element.parentElement;
    const answer = faqItem.querySelector('.faq-answer');
    const toggle = element.querySelector('.faq-toggle');
    
    if (!answer || !toggle) return;
    
    // 다른 FAQ 닫기
    document.querySelectorAll('.faq-item').forEach(item => {
      if (item !== faqItem) {
        const otherAnswer = item.querySelector('.faq-answer');
        const otherToggle = item.querySelector('.faq-toggle');
        if (otherAnswer && otherAnswer.style.display === 'block') {
          otherAnswer.style.display = 'none';
          if (otherToggle) otherToggle.textContent = '+';
        }
      }
    });
    
    // 현재 FAQ 토글
    if (answer.style.display === 'block') {
      answer.style.display = 'none';
      toggle.textContent = '+';
    } else {
      answer.style.display = 'block';
      toggle.textContent = '-';
    }
    
    console.log('❓ FAQ 토글:', answer.style.display === 'block' ? '열림' : '닫힘');
  };
}

// ========================================
// 지도 기능
// ========================================
function setupMapFunction() {
  window.openMap = function() {
    console.log('🗺️ 지도 열기 요청');
    const mapUrl = 'https://map.naver.com/v5/search/서울특별시%20강남구%20테헤란로%20123';
    window.open(mapUrl, '_blank');
    showToast('지도가 새 창에서 열렸습니다.', 'success');
  };
}

// ========================================
// 회원가입 안내 (정적 기능)
// ========================================
function setupSignupInfo() {
  window.showAdminSignupInfo = function() {
    console.log('👨‍💼 관리자 회원가입 안내 표시');
    alert(`관리자 회원가입 안내

🔐 관리자 계정은 별도 승인이 필요합니다.

📋 필요 서류:
• 신분증 사본
• 재직증명서
• 관리자 추천서

📞 문의처:
• 전화: 02-1234-5678
• 이메일: admin@smartparking.com

⏰ 승인 기간: 영업일 기준 3-5일`);
  };
}

// ========================================
// 부드러운 스크롤 설정
// ========================================
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
        console.log('📍 부드러운 스크롤:', this.getAttribute('href'));
      }
    });
  });
}

// ========================================
// 실시간 데이터 업데이트
// ========================================
function updateRealTimeData() {
  console.log('🔄 실시간 데이터 업데이트');
  
  // 주차장 현황 업데이트
  updateParkingStatus();
  
  // 요금 정보 업데이트 (피크 시간 반영)
  updatePricingInfo();
}

function updateParkingStatus() {
  const statusNumbers = document.querySelectorAll('.status-number');
  if (statusNumbers.length >= 4) {
    const totalSpots = 247;
    const currentUsed = parseInt(statusNumbers[1]?.textContent) || 189;
    const change = Math.floor(Math.random() * 6) - 3; // -3 ~ +3 변화
    const newUsed = Math.max(0, Math.min(totalSpots, currentUsed + change));
    const available = totalSpots - newUsed;
    const utilization = Math.floor((newUsed / totalSpots) * 100);
    
    statusNumbers[1].textContent = newUsed;
    statusNumbers[2].textContent = available;
    statusNumbers[3].textContent = utilization + '%';
    
    console.log('📊 주차장 현황 업데이트:', { 이용중: newUsed, 빈공간: available, 이용률: utilization + '%' });
  }
}

function updatePricingInfo() {
  // 피크 시간대 요금 조정
  const currentHour = new Date().getHours();
  const isPeakTime = (currentHour >= 7 && currentHour <= 9) || 
                     (currentHour >= 17 && currentHour <= 19);
  
  const priceElements = document.querySelectorAll('.price');
  priceElements.forEach((element, index) => {
    const basePrice = [2000, 20000, 150000][index];
    const adjustedPrice = isPeakTime ? Math.floor(basePrice * 1.2) : basePrice;
    
    if (element.textContent.includes('₩')) {
      const span = element.querySelector('span');
      const unit = span ? span.textContent : '';
      element.innerHTML = `₩${adjustedPrice.toLocaleString()}<span>${unit}</span>`;
      
      if (isPeakTime && !element.classList.contains('peak-price')) {
        element.classList.add('peak-price');
        element.style.color = '#e53e3e';
        
        if (index === 0) { // 첫 번째 요금만 알림
          showToast('⚠️ 피크 시간 요금이 적용되었습니다.', 'warning');
        }
      } else if (!isPeakTime && element.classList.contains('peak-price')) {
        element.classList.remove('peak-price');
        element.style.color = '#1e3a8a';
      }
    }
  });
  
  if (isPeakTime) {
    console.log('⏰ 피크 시간 요금 적용됨');
  }
}

// ========================================
// 스크롤 애니메이션 설정
// ========================================
function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);
  
  // 애니메이션할 요소들
  const animatedElements = document.querySelectorAll(
    '.pricing-card, .contact-card, .feature-card, .faq-item'
  );
  
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
  });
  
  console.log('🎬 스크롤 애니메이션 설정 완료:', animatedElements.length + '개 요소');
}

// ========================================
// URL 해시 네비게이션 처리
// ========================================
function handleHashNavigation() {
  if (window.location.hash) {
    setTimeout(() => {
      const targetId = window.location.hash.slice(1);
      const section = document.getElementById(targetId);
      if (section) {
        section.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        console.log('🔗 해시 네비게이션:', targetId);
      }
    }, 1000);
  }
}

// ========================================
// 모달 핸들러 설정
// ========================================
function setupModalHandlers() {
  // ESC 키로 모달 닫기
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeAllModals();
    }
  });
  
  // 모달 외부 클릭으로 닫기
  document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      if (event.target === modal) {
        closeAllModals();
      }
    });
  });
}

function closeAllModals() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
  });
  console.log('❌ 모든 모달 닫음');
}

// ========================================
// 키보드 단축키 (로그인된 사용자용)
// ========================================
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(event) {
    // 로그인된 사용자만 단축키 사용 가능
    if (!userRoleFromSession) return;
    
    // Ctrl + H: 홈으로
    if (event.ctrlKey && event.key === 'h') {
      event.preventDefault();
      window.location.href = '/';
      showToast('홈으로 이동합니다.', 'info');
    }
    
    // 역할별 단축키
    if (userRoleFromSession === 'CUSTOMER') {
      handleCustomerShortcuts(event);
    } else if (['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(userRoleFromSession)) {
      handleAdminShortcuts(event);
    }
  });
}

function handleCustomerShortcuts(event) {
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
    }
  }
}

function handleAdminShortcuts(event) {
  if (event.ctrlKey) {
    switch(event.key) {
      case 'f':
        event.preventDefault();
        window.location.href = '/admin/fire-detection';
        showToast('화재감지 페이지로 이동합니다.', 'info');
        break;
      case 'a':
        event.preventDefault();
        window.location.href = '/admin/approval';
        showToast('승인관리 페이지로 이동합니다.', 'info');
        break;
      case 't':
        event.preventDefault();
        window.location.href = '/admin/traffic';
        showToast('교통관리 페이지로 이동합니다.', 'info');
        break;
      case 'c':
        event.preventDefault();
        window.location.href = '/admin/cctv';
        showToast('CCTV 모니터링 페이지로 이동합니다.', 'info');
        break;
    }
  }
}

// ========================================
// 접근성 개선
// ========================================
function enhanceAccessibility() {
  // 키보드 네비게이션 개선
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
  
  // FAQ 키보드 지원
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(question => {
    question.setAttribute('tabindex', '0');
    question.setAttribute('role', 'button');
    question.setAttribute('aria-expanded', 'false');
    
    question.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleFAQ(this);
        this.setAttribute('aria-expanded', 
          this.parentElement.querySelector('.faq-answer').style.display === 'block'
        );
      }
    });
  });
  
  console.log('♿ 접근성 개선 완료');
}

// ========================================
// 성능 최적화
// ========================================
function optimizePerformance() {
  // 스크롤 이벤트 최적화
  let ticking = false;
  
  function updateScrollPosition() {
    const scrolled = window.pageYOffset;
    const header = document.getElementById('main-header');
    
    if (header) {
      if (scrolled > 100) {
        header.style.background = 'linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)';
        header.style.backdropFilter = 'blur(10px)';
      } else {
        header.style.background = 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
        header.style.backdropFilter = 'none';
      }
    }
    
    ticking = false;
  }
  
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateScrollPosition);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestTick);
  
  console.log('⚡ 성능 최적화 완료');
}

// ========================================
// 에러 처리 개선
// ========================================
function setupErrorHandling() {
  window.addEventListener('error', function(e) {
    console.error('JavaScript 오류:', e.error);
    
    const errorMessages = {
      'TypeError': '일시적인 시스템 오류가 발생했습니다.',
      'ReferenceError': '페이지를 새로고침해 주세요.',
      'NetworkError': '인터넷 연결을 확인해주세요.'
    };
    
    const errorType = e.error?.constructor.name || 'Error';
    const message = errorMessages[errorType] || '알 수 없는 오류가 발생했습니다.';
    
    showToast(message, 'error');
  });
  
  // Promise 거부 처리
  window.addEventListener('unhandledrejection', function(e) {
    console.error('처리되지 않은 Promise 거부:', e.reason);
    showToast('요청 처리 중 오류가 발생했습니다.', 'error');
    e.preventDefault();
  });
  
  console.log('🛡️ 에러 처리 설정 완료');
}

// ========================================
// 브라우저 호환성 확인
// ========================================
function checkBrowserCompatibility() {
  const features = {
    intersectionObserver: 'IntersectionObserver' in window,
    css3Animations: CSS && CSS.supports && CSS.supports('animation', 'none'),
    flexbox: CSS && CSS.supports && CSS.supports('display', 'flex'),
    grid: CSS && CSS.supports && CSS.supports('display', 'grid')
  };
  
  const unsupportedFeatures = Object.entries(features)
    .filter(([feature, supported]) => !supported)
    .map(([feature]) => feature);
  
  if (unsupportedFeatures.length > 0) {
    console.warn('⚠️ 지원되지 않는 기능들:', unsupportedFeatures);
    
    if (!features.grid) {
      document.body.classList.add('no-grid-support');
    }
    
    if (!features.intersectionObserver) {
      const elements = document.querySelectorAll('[data-animate]');
      elements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    }
  } else {
    console.log('✅ 모든 브라우저 기능 지원됨');
  }
}

// ========================================
// 다크모드 지원
// ========================================
function setupDarkMode() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  
  function handleDarkModeChange(e) {
    if (e.matches) {
      document.body.classList.add('dark-mode');
      showToast('다크모드가 활성화되었습니다.', 'info');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }
  
  prefersDark.addEventListener('change', handleDarkModeChange);
  
  if (prefersDark.matches) {
    handleDarkModeChange(prefersDark);
  }
  
  console.log('🌙 다크모드 지원 설정 완료');
}

// ========================================
// 유틸리티 함수들
// ========================================
function showToast(message, type = 'info') {
  // 기존 토스트 제거
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
    ${message}
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
  `;
  
  // CSS 추가
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
  
  // 3초 후 제거
  setTimeout(() => {
    toast.style.animation = 'slideOutToRight 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
  
  console.log('📢 토스트 메시지:', message);
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
  `;
  
  loading.innerHTML = `
    <div style="text-align: center;">
      <div style="margin-bottom: 1rem; font-size: 2rem;">⏳</div>
      <div>${message}</div>
    </div>
  `;
  
  document.body.appendChild(loading);
  console.log('⏳ 로딩 표시:', message);
}

function hideLoading() {
  const loading = document.querySelector('.loading-overlay');
  if (loading) {
    loading.remove();
    console.log('✅ 로딩 숨김');
  }
}

// ========================================
// 페이지 가시성 변경 감지
// ========================================
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    updateRealTimeData();
    showToast('시스템 현황이 업데이트되었습니다.', 'info');
  }
});

// ========================================
// 온라인/오프라인 상태 감지
// ========================================
window.addEventListener('online', function() {
  showToast('인터넷 연결이 복구되었습니다.', 'success');
  updateRealTimeData();
});

window.addEventListener('offline', function() {
  showToast('인터넷 연결을 확인해주세요.', 'warning');
});

// ========================================
// 성능 모니터링
// ========================================
window.addEventListener('load', function() {
  setTimeout(() => {
    if (performance && performance.getEntriesByType) {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        
        if (loadTime > 3000) {
          console.warn(`⚠️ 페이지 로드 시간이 길어집니다: ${loadTime}ms`);
        }
        
        console.log(`📊 페이지 로드 완료: ${loadTime}ms`);
      }
    }
  }, 1000);
});

// ========================================
// 초기화 완료 로그
// ========================================
setTimeout(() => {
  console.log('🎉 Thymeleaf 호환 스마트파킹 시스템 완전 로드됨!');
  console.log('🔧 모드: Thymeleaf 서버 사이드 렌더링');
  console.log('👤 사용자 정보:', currentUserFromSession?.name || '비로그인');
  console.log('🎭 사용자 역할:', userRoleFromSession || '없음');
  console.log('💡 키보드 단축키:');
  console.log('   Ctrl + H: 홈으로');
  
  if (userRoleFromSession === 'CUSTOMER') {
    console.log('   Ctrl + R: 예약, Ctrl + P: 결제, Ctrl + L: 이용내역');
  } else if (['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(userRoleFromSession)) {
    console.log('   Ctrl + F: 화재감지, Ctrl + A: 승인관리, Ctrl + T: 교통관리, Ctrl + C: CCTV');
  }
  
  console.log('📝 FAQ, 지도, 스크롤 애니메이션, 실시간 업데이트 활성화됨');
}, 1000);

// ========================================
// 전역 함수 노출 (HTML에서 사용)
// ========================================
window.toggleFAQ = window.toggleFAQ || function() { console.warn('FAQ 기능이 아직 로드되지 않았습니다.'); };
window.openMap = window.openMap || function() { console.warn('지도 기능이 아직 로드되지 않았습니다.'); };
window.showAdminSignupInfo = window.showAdminSignupInfo || function() { console.warn('회원가입 안내 기능이 아직 로드되지 않았습니다.'); };

// 회원가입 안내 기능 즉시 설정
setupSignupInfo();

function logout() {
  if (confirm('로그아웃 하시겠습니까?')) {
    document.getElementById('logoutForm').submit();
  }
}