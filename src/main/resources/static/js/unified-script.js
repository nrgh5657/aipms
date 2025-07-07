// 전역 변수
let currentUser = null;
let userRole = null; // 'customer' or 'admin' or null

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  initializePage();
  
  // 로그인 상태 확인 (시뮬레이션 - 실제로는 세션/쿠키 확인)
  checkLoginStatus();
  
  // 경과 시간 업데이트 (고객용)
  updateElapsedTime();
  setInterval(updateElapsedTime, 60000);
  
  // 실시간 데이터 업데이트
  setInterval(updateRealTimeData, 30000);
  
  // 초기화 함수들
  enhanceAccessibility();
  optimizePerformance();
  setupErrorHandling();
  checkBrowserCompatibility();
  setupDarkMode();
});

// 페이지 초기화
function initializePage() {
  // 부드러운 스크롤
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
  
  // 모달 외부 클릭시 닫기
  document.addEventListener('click', function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
      if (event.target === modal) {
        closeModal();
        closeSignupModal();
      }
    });
  });
  
  // ESC 키로 모달 닫기
  document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
      closeModal();
      closeSignupModal();
    }
  });
  
  // 스크롤 애니메이션 설정
  setupScrollAnimations();
  
  // URL 해시가 있으면 해당 섹션으로 스크롤
  if (window.location.hash) {
    setTimeout(() => {
      const targetId = window.location.hash.slice(1);
      smoothScrollToSection(targetId);
    }, 1000);
  }
}

// === 로그인/로그아웃 관련 ===

function checkLoginStatus() {
  // 시뮬레이션 - 실제로는 서버에서 세션 확인
  const savedUser = localStorage.getItem('currentUser');
  const savedRole = localStorage.getItem('userRole');
  
  if (savedUser && savedRole) {
    currentUser = JSON.parse(savedUser);
    userRole = savedRole;
    updateUIForLoggedInUser();
  } else {
    showGuestUI();
  }
}

function logout() {
  if (confirm('로그아웃 하시겠습니까?')) {
    currentUser = null;
    userRole = null;
    
    // 저장된 로그인 정보 삭제
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userRole');
    
    showGuestUI();
    showToast('로그아웃되었습니다.', 'info');
  }
}

function updateUIForLoggedInUser() {
  // 인증 섹션 업데이트
  document.getElementById('login-buttons').style.display = 'none';
  document.getElementById('user-info').style.display = 'flex';
  document.getElementById('welcome-text').textContent = 
    `${currentUser.name}님 환영합니다!`;
  
  // 메뉴 변경
  document.getElementById('guest-menu').style.display = 'none';
  
  if (userRole === 'customer') {
    document.getElementById('customer-menu').style.display = 'block';
    document.getElementById('admin-menu').style.display = 'none';
    
    // 컨텐츠 변경
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('customer-dashboard').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
    
  } else if (userRole === 'admin') {
    document.getElementById('customer-menu').style.display = 'none';
    document.getElementById('admin-menu').style.display = 'block';
    
    // 컨텐츠 변경
    document.getElementById('welcome-section').style.display = 'none';
    document.getElementById('customer-dashboard').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
  }
  
  document.getElementById('dynamic-content').style.display = 'none';
}

function showGuestUI() {
  // 인증 섹션 복원
  document.getElementById('login-buttons').style.display = 'flex';
  document.getElementById('user-info').style.display = 'none';
  
  // 메뉴 복원
  document.getElementById('guest-menu').style.display = 'block';
  document.getElementById('customer-menu').style.display = 'none';
  document.getElementById('admin-menu').style.display = 'none';
  
  // 컨텐츠 복원
  document.getElementById('welcome-section').style.display = 'block';
  document.getElementById('customer-dashboard').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'none';
  document.getElementById('dynamic-content').style.display = 'none';
}

// === 회원가입 관련 ===

function showSignupModal() {
  closeModal(); // 로그인 모달 닫기
  document.getElementById('signup-modal').style.display = 'flex';
}

function closeSignupModal() {
  document.getElementById('signup-modal').style.display = 'none';
}

function showAdminSignupInfo() {
  closeSignupModal();
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
}

// === 페이지 로딩 관련 ===

function loadPage(pageType) {
  const dynamicContent = document.getElementById('dynamic-content');
  
  // 기존 대시보드 숨기기
  if (userRole === 'customer') {
    document.getElementById('customer-dashboard').style.display = 'none';
  } else if (userRole === 'admin') {
    document.getElementById('admin-dashboard').style.display = 'none';
  }
  
  // 동적 컨텐츠 표시
  dynamicContent.style.display = 'block';
  
  showLoading('페이지 로딩중...');
  
  setTimeout(() => {
    hideLoading();
    loadPageContent(pageType);
  }, 800);
}

function loadPageContent(pageType) {
  const content = document.getElementById('dynamic-content');
  
  // 페이지별 컨텐츠 (수정된 버전)
  const pageContents = {
    // 고객용 페이지들
    'reservation': createPageHTML(
      '🅿️ 주차 예약',
      '원하는 날짜와 시간에 편리하게 주차하세요!',
      '예약 페이지를 로딩중입니다...',
      'reservation.html 컨텐츠가 여기에 동적으로 로드됩니다.'
    ),
    'payment': createPageHTML(
      '💳 요금 결제',
      '미납 요금을 확인하고 간편하게 결제하세요!',
      '결제 페이지를 로딩중입니다...',
      'payment.html 컨텐츠가 여기에 동적으로 로드됩니다.'
    ),
    'records': createPageHTML(
      '📊 이용 내역',
      '주차 이용기록과 결제내역을 확인하세요!',
      '이용내역 페이지를 로딩중입니다...',
      'my-records.html 컨텐츠가 여기에 동적으로 로드됩니다.'
    ),
    
    // 관리자용 페이지들
    'fire-detection': createAdminPageHTML(
      '🔥 화재 감지 시스템',
      '실시간 화재감지 현황과 경보 이력을 관리합니다.',
      [
        { title: '✅ 정상', subtitle: 'A구역 센서 (24개)', color: '#48bb78' },
        { title: '✅ 정상', subtitle: 'B구역 센서 (18개)', color: '#48bb78' },
        { title: '✅ 정상', subtitle: 'C구역 센서 (16개)', color: '#48bb78' }
      ]
    ),
    'approval': createAdminPageHTML(
      '✅ 주차 요청 승인',
      '고객의 주차 예약 요청을 검토하고 승인/거절 처리합니다.',
      [
        {
          title: '⏳ 승인 대기: 김고객님 (12가3456)',
          subtitle: '요청일시: 2025-07-02 14:30 | 원하는 날짜: 2025-07-03 09:00-17:00',
          color: '#ed8936',
          hasButtons: true
        }
      ]
    ),
    'traffic': createAdminPageHTML(
      '🚙 입출차 현황',
      '실시간 차량 입출차 현황을 모니터링합니다.',
      [
        {
          title: '최근 입차',
          content: ['• 14:25 - 12가3456 (A-15)', '• 14:18 - 34나5678 (B-07)', '• 14:12 - 56다9012 (C-23)']
        },
        {
          title: '최근 출차',
          content: ['• 14:20 - 78라3456 (A-08)', '• 14:15 - 90마7890 (B-12)', '• 14:10 - 12바3456 (C-05)']
        }
      ]
    ),
    'cctv': createAdminPageHTML(
      '📹 CCTV 모니터링',
      '주차장 내 보안 카메라를 실시간으로 모니터링합니다.',
      [
        { title: '📹 CAM-01', subtitle: 'A구역 입구', status: '정상' },
        { title: '📹 CAM-02', subtitle: 'B구역 중앙', status: '정상' },
        { title: '📹 CAM-03', subtitle: 'C구역 출구', status: '정상' }
      ]
    )
  };
  
  content.innerHTML = pageContents[pageType] || createPageHTML(
    '🚧 페이지 준비중',
    '요청하신 페이지를 준비하고 있습니다.',
    '',
    ''
  );
}

// HTML 생성 헬퍼 함수들
function createPageHTML(title, description, loadingText, detailText) {
  return `
    <h2>${title}</h2>
    <p>${description}</p>
    <div style="padding: 2rem; background: #f8fafc; border-radius: 12px; margin-top: 1rem;">
      ${loadingText ? `<p>🚧 ${loadingText}</p>` : ''}
      ${detailText ? `<p>실제로는 ${detailText}</p>` : ''}
      <button onclick="goBack()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #4299e1; color: white; border: none; border-radius: 6px; cursor: pointer;">← 대시보드로 돌아가기</button>
    </div>
  `;
}

function createAdminPageHTML(title, description, items) {
  let itemsHTML = '';
  
  if (Array.isArray(items)) {
    items.forEach(item => {
      if (item.content) {
        // 입출차 현황용
        itemsHTML += `
          <div style="background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem;">
            <h4 style="color: #1e3a8a; margin-bottom: 1rem;">${item.title}</h4>
            <div style="font-size: 0.9rem; line-height: 1.8;">
              ${item.content.map(line => `<p>${line}</p>`).join('')}
            </div>
          </div>
        `;
      } else if (item.status) {
        // CCTV용
        itemsHTML += `
          <div style="background: #2d3748; padding: 2rem; border-radius: 8px; text-align: center; color: white; margin-bottom: 1rem;">
            <p>${item.title}</p>
            <p style="font-size: 0.8rem; margin-top: 0.5rem;">${item.subtitle}</p>
            <span style="background: #48bb78; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.7rem;">${item.status}</span>
          </div>
        `;
      } else if (item.hasButtons) {
        // 승인 관리용
        itemsHTML += `
          <div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid ${item.color};">
            <h4>${item.title}</h4>
            <p>${item.subtitle}</p>
            <div style="margin-top: 1rem;">
              <button style="padding: 0.5rem 1rem; background: #48bb78; color: white; border: none; border-radius: 4px; margin-right: 0.5rem; cursor: pointer;">승인</button>
              <button style="padding: 0.5rem 1rem; background: #e53e3e; color: white; border: none; border-radius: 4px; cursor: pointer;">거절</button>
            </div>
          </div>
        `;
      } else {
        // 화재 감지용
        itemsHTML += `
          <div style="background: white; padding: 1.5rem; border-radius: 8px; border: 2px solid ${item.color}; margin-bottom: 1rem;">
            <h4 style="color: ${item.color}; margin-bottom: 0.5rem;">${item.title}</h4>
            <p>${item.subtitle}</p>
          </div>
        `;
      }
    });
  }
  
  return `
    <h2>${title}</h2>
    <p>${description}</p>
    <div style="padding: 2rem; background: #f8fafc; border-radius: 12px; margin-top: 1rem;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        ${itemsHTML}
      </div>
      <button onclick="goBack()" style="padding: 0.5rem 1rem; background: #e53e3e; color: white; border: none; border-radius: 6px; cursor: pointer;">← 관리자 대시보드로 돌아가기</button>
    </div>
  `;
}

function goBack() {
  const dynamicContent = document.getElementById('dynamic-content');
  dynamicContent.style.display = 'none';
  
  if (userRole === 'customer') {
    document.getElementById('customer-dashboard').style.display = 'block';
  } else if (userRole === 'admin') {
    document.getElementById('admin-dashboard').style.display = 'block';
  }
}

// === 고객용 기능들 ===

function updateElapsedTime() {
  const elapsedElement = document.getElementById('elapsed-time');
  if (elapsedElement) {
    const entryTime = new Date('2025-07-02 09:30:00');
    const now = new Date();
    const elapsed = now - entryTime;
    
    const hours = Math.floor(elapsed / (1000 * 60 * 60));
    const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
    
    elapsedElement.textContent = `${hours}시간 ${minutes}분`;
  }
}

function requestExit() {
  if (confirm('출차를 요청하시겠습니까?')) {
    showLoading('출차를 처리중입니다...');
    
    setTimeout(() => {
      hideLoading();
      showToast('출차가 완료되었습니다! 최종요금: ₩5,000', 'success');
      
      // 주차 상태 업데이트
      const statusCard = event.target.closest('.parking-status-card');
      if (statusCard) {
        statusCard.querySelector('.status-badge').textContent = '출차완료';
        statusCard.querySelector('.status-badge').style.background = '#718096';
        event.target.remove();
      }
    }, 2000);
  }
}

function showQR() {
  showToast('QR 코드를 생성중입니다...', 'info');
  
  setTimeout(() => {
    alert('QR 코드가 생성되었습니다!\n입차시 게이트에 스캔해주세요.\n\n[QR 코드 이미지가 여기에 표시됩니다]');
  }, 1000);
}

function showProfile() {
  showToast('내 정보 페이지로 이동합니다.', 'info');
  loadPage('profile');
}

function showSupport() {
  alert('고객지원 센터\n\n📞 1588-1234\n📧 support@smartparking.com\n🕐 운영시간: 09:00-18:00\n\nFAQ 바로가기도 준비되어 있습니다.');
}

// === 실시간 데이터 업데이트 ===

function updateRealTimeData() {
  // 주차장 현황 업데이트
  updateParkingStatus();
  
  // 관리자 통계 업데이트 (관리자 로그인시에만)
  if (userRole === 'admin') {
    updateAdminStats();
  }
  
  // 요금 정보 업데이트
  updatePricingInfo();
}

function updateParkingStatus() {
  const statusNumbers = document.querySelectorAll('.status-number');
  if (statusNumbers.length > 0) {
    // 시뮬레이션: 주차장 현황 변경
    const totalSpots = 247;
    const currentUsed = parseInt(statusNumbers[1]?.textContent) || 189;
    const change = Math.floor(Math.random() * 6) - 3; // -3 ~ +3 변화
    const newUsed = Math.max(0, Math.min(totalSpots, currentUsed + change));
    const available = totalSpots - newUsed;
    const utilization = Math.floor((newUsed / totalSpots) * 100);
    
    if (statusNumbers[1]) statusNumbers[1].textContent = newUsed;
    if (statusNumbers[2]) statusNumbers[2].textContent = available;
    if (statusNumbers[3]) statusNumbers[3].textContent = utilization + '%';
  }
}

function updateAdminStats() {
  // 관리자 통계 업데이트 (시뮬레이션)
  const pendingElement = document.querySelector('.stat-card.pending .stat-number');
  if (pendingElement) {
    const current = parseInt(pendingElement.textContent) || 5;
    const change = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
    const newValue = Math.max(0, current + change);
    pendingElement.textContent = newValue;
  }
}

function updatePricingInfo() {
  // 동적 요금 조정 시뮬레이션 (피크 시간대)
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
        
        // 피크 시간 알림
        if (index === 0) { // 첫 번째 요금만 알림
          showToast('⚠️ 피크 시간 요금이 적용되었습니다.', 'warning');
        }
      } else if (!isPeakTime && element.classList.contains('peak-price')) {
        element.classList.remove('peak-price');
        element.style.color = '#1e3a8a';
      }
    }
  });
}

// === 새로운 기능들 ===

// 지도 열기
function openMap() {
  showToast('지도 서비스를 열고 있습니다...', 'info');
  
  setTimeout(() => {
    // 실제로는 구글맵이나 네이버맵 API 연동
    const mapUrl = `https://map.naver.com/v5/search/서울특별시%20강남구%20테헤란로%20123`;
    window.open(mapUrl, '_blank');
    showToast('지도가 새 창에서 열렸습니다.', 'success');
  }, 1000);
}

// FAQ 토글
function toggleFAQ(element) {
  const faqItem = element.parentElement;
  const answer = faqItem.querySelector('.faq-answer');
  const toggle = element.querySelector('.faq-toggle');
  
  // 다른 FAQ 닫기
  const allFAQs = document.querySelectorAll('.faq-item');
  allFAQs.forEach(item => {
    if (item !== faqItem) {
      const otherAnswer = item.querySelector('.faq-answer');
      const otherToggle = item.querySelector('.faq-toggle');
      if (otherAnswer && otherAnswer.classList.contains('open')) {
        otherAnswer.classList.remove('open');
        otherToggle.textContent = '+';
        otherToggle.style.transform = 'rotate(0deg)';
      }
    }
  });
  
  // 현재 FAQ 토글
  if (answer.classList.contains('open')) {
    answer.classList.remove('open');
    toggle.textContent = '+';
    toggle.style.transform = 'rotate(0deg)';
  } else {
    answer.classList.add('open');
    toggle.textContent = '−';
    toggle.style.transform = 'rotate(180deg)';
  }
}

// 부드러운 스크롤 (앵커 링크용)
function smoothScrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// 스크롤 애니메이션 설정
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
  
  // 애니메이션할 요소들 관찰
  const animatedElements = document.querySelectorAll(
    '.pricing-card, .contact-card, .feature-card, .faq-item'
  );
  
  animatedElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
  });
}

// === 접근성 개선 ===
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
          this.parentElement.querySelector('.faq-answer').classList.contains('open')
        );
      }
    });
  });
}

// === 성능 최적화 ===
function optimizePerformance() {
  // 스크롤 이벤트 최적화
  let ticking = false;
  
  function updateScrollPosition() {
    // 스크롤 기반 애니메이션이나 효과
    const scrolled = window.pageYOffset;
    const header = document.getElementById('main-header');
    
    if (scrolled > 100) {
      header.style.background = 'linear-gradient(135deg, rgba(30, 58, 138, 0.95) 0%, rgba(59, 130, 246, 0.95) 100%)';
      header.style.backdropFilter = 'blur(10px)';
    } else {
      header.style.background = 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)';
      header.style.backdropFilter = 'none';
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
}

// === 에러 처리 개선 ===
function setupErrorHandling() {
  window.addEventListener('error', function(e) {
    console.error('JavaScript 오류:', e.error);
    
    // 사용자에게 친화적인 에러 메시지
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
}

// === 브라우저 호환성 확인 ===
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
    console.warn('지원되지 않는 기능들:', unsupportedFeatures);
    
    // 폴백 스타일 적용
    if (!features.grid) {
      document.body.classList.add('no-grid-support');
    }
    
    if (!features.intersectionObserver) {
      // IntersectionObserver 폴백
      const elements = document.querySelectorAll('[data-animate]');
      elements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    }
  }
}

// === 다크모드 지원 ===
function setupDarkMode() {
  // 시스템 다크모드 감지
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
  
  // 초기 설정
  if (prefersDark.matches) {
    handleDarkModeChange(prefersDark);
  }
}

// === 모달 관리 ===
function closeModal() {
  const loginModal = document.getElementById('login-modal');
  if (loginModal) {
    loginModal.style.display = 'none';
  }
}

// === 유틸리티 함수들 ===
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast show ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

function showLoading(message = '처리중...') {
  const loading = document.createElement('div');
  loading.className = 'loading-overlay';
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
    document.body.removeChild(loading);
  }
}

// === 키보드 단축키 ===
document.addEventListener('keydown', function(event) {
  // 로그인된 사용자만 단축키 사용 가능
  if (!currentUser) return;
  
  // Ctrl + H: 홈으로 (대시보드)
  if (event.ctrlKey && event.key === 'h') {
    event.preventDefault();
    goBack();
    showToast('대시보드로 이동했습니다.', 'info');
  }
  
  // 고객용 단축키
  if (userRole === 'customer') {
    // Ctrl + R: 예약
    if (event.ctrlKey && event.key === 'r') {
      event.preventDefault();
      loadPage('reservation');
    }
    
    // Ctrl + P: 결제
    if (event.ctrlKey && event.key === 'p') {
      event.preventDefault();
      loadPage('payment');
    }
    
    // Ctrl + L: 이용내역 (Records)
    if (event.ctrlKey && event.key === 'l') {
      event.preventDefault();
      loadPage('records');
    }
  }
  
  // 관리자용 단축키
  if (userRole === 'admin') {
    // Ctrl + F: 화재감지
    if (event.ctrlKey && event.key === 'f') {
      event.preventDefault();
      loadPage('fire-detection');
    }
    
    // Ctrl + A: 승인관리
    if (event.ctrlKey && event.key === 'a') {
      event.preventDefault();
      loadPage('approval');
    }
    
    // Ctrl + T: 교통관리 (Traffic)
    if (event.ctrlKey && event.key === 't') {
      event.preventDefault();
      loadPage('traffic');
    }
    
    // Ctrl + C: CCTV
    if (event.ctrlKey && event.key === 'c') {
      event.preventDefault();
      loadPage('cctv');
    }
  }
});

// === 페이지 가시성 변경 감지 ===
document.addEventListener('visibilitychange', function() {
  if (!document.hidden) {
    // 페이지가 다시 보이면 현황 업데이트
    updateRealTimeData();
    showToast('시스템 현황이 업데이트되었습니다.', 'info');
  }
});

// === 온라인/오프라인 상태 감지 ===
window.addEventListener('online', function() {
  showToast('인터넷 연결이 복구되었습니다.', 'success');
  updateRealTimeData();
});

window.addEventListener('offline', function() {
  showToast('인터넷 연결을 확인해주세요.', 'warning');
});

// === 페이지 언로드 시 정리 ===
window.addEventListener('beforeunload', function() {
  // 진행 중인 작업이 있으면 사용자에게 확인
  const hasUnsavedChanges = document.querySelector('.unsaved-changes');
  if (hasUnsavedChanges) {
    return '저장되지 않은 변경사항이 있습니다. 정말 나가시겠습니까?';
  }
});

// === 스크롤 이벤트 디바운스 ===
let scrollTimeout;
window.addEventListener('scroll', function() {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(function() {
    // 스크롤 기반 애니메이션이나 업데이트가 필요한 경우 여기에 추가
  }, 100);
});

// === 창 크기 변경 이벤트 디바운스 ===
let resizeTimeout;
window.addEventListener('resize', function() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function() {
    // 반응형 레이아웃 조정이 필요한 경우 여기에 추가
  }, 250);
});

// === 성능 모니터링 ===
window.addEventListener('load', function() {
  setTimeout(() => {
    if (performance && performance.getEntriesByType) {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
        
        if (loadTime > 3000) { // 3초 이상이면 경고
          console.warn(`⚠️ 페이지 로드 시간이 길어집니다: ${loadTime}ms`);
        }
        
        console.log(`📊 페이지 로드 완료: ${loadTime}ms`);
      }
    }
  }, 1000);
});

// === 초기화 완료 로그 ===
setTimeout(() => {
  console.log('🚗 스마트파킹 통합 시스템이 완전히 로드되었습니다!');
  console.log('🔗 로그인 페이지 연결이 활성화되었습니다.');
  console.log('💡 단축키 안내:');
  console.log('   Ctrl + H: 대시보드');
  if (userRole === 'customer') {
    console.log('   Ctrl + R: 예약, Ctrl + P: 결제, Ctrl + L: 이용내역');
  } else if (userRole === 'admin') {
    console.log('   Ctrl + F: 화재감지, Ctrl + A: 승인관리, Ctrl + T: 교통관리, Ctrl + C: CCTV');
  }
  console.log('📝 FAQ, 지도, 스크롤 애니메이션 등이 활성화되었습니다.');
}, 1000);

// === 로그인 페이지 연결 함수 ===
function showUnifiedLogin() {
  // login.html 페이지로 이동
  window.location.href = 'login.html';
}

// 기존 showSignupModal 함수를 이렇게 수정하세요
function showSignupModal() {
  // signup.html 페이지로 이동
  window.location.href = '/signup';
}