// ========================================
// 메인 페이지 (index.js)
// ========================================

document.addEventListener('DOMContentLoaded', function() {
  console.log('🏠 메인 페이지 로드됨');

  // 공통 라이브러리 확인
  if (!checkCommonLibraries()) {
    console.error('❌ 공통 라이브러리가 로드되지 않았습니다.');
    return;
  }

  // 메인 페이지 초기화
  initializeMainPage();

  console.log('✅ 메인 페이지 초기화 완료');
});


function checkCommonLibraries() {
  return typeof showToast === 'function' &&
      typeof apiRequest === 'function';
}

function initializeMainPage() {
  // 실시간 주차장 현황 로드
  loadParkingStats();

  // 스크롤 애니메이션 설정
  setupScrollAnimations();

  // 부드러운 스크롤 설정
  setupSmoothScroll();

  // 실시간 업데이트 시작
  startStatsUpdate();
}

// ========================================
// 실시간 주차장 현황
// ========================================
async function loadParkingStats() {
  try {
    const data = await apiRequest('/api/parking/live-status');
    updateParkingStats(data);
  } catch (error) {
    console.warn('⚠️ 주차장 현황 API 실패, 기본값 사용:', error.message);
    updateParkingStats({
      totalSlots: 247,
      occupiedSlots: 189,
      availableSlots: 58,
      occupancyRate: 76,
      customerSatisfaction: 98
    });
  }
}

function updateParkingStats(data) {
  const statNumbers = document.querySelectorAll('.status-number');

  if (statNumbers.length >= 4) {
    animateNumber(statNumbers[0], data.totalSlots || 0);                   // 총 주차면
    animateNumber(statNumbers[1], data.occupiedSlots || 0);                // 현재 이용중
    animateNumber(statNumbers[2], data.availableSlots || 0);               // 빈 주차면
    animateNumber(statNumbers[3], data.occupancyRate || 0, '%');           // 이용률 (%)
  }

  console.log('✅ 실시간 주차장 현황 업데이트 완료');
}

function animateNumber(element, targetValue, suffix = '') {
  const startValue = 0;
  const duration = 2000;
  const startTime = performance.now();

  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // easeOutQuart 이징 함수
    const easeProgress = 1 - Math.pow(1 - progress, 4);
    const currentValue = Math.floor(startValue + (targetValue - startValue) * easeProgress);

    element.textContent = currentValue + suffix;

    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    }
  }

  requestAnimationFrame(updateNumber);
}

// ========================================
// 스크롤 애니메이션
// ========================================
function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');

        // 카드들에 순차적 애니메이션 적용
        if (entry.target.classList.contains('features-grid') ||
            entry.target.classList.contains('pricing-grid')) {
          animateCards(entry.target);
        }
      }
    });
  }, observerOptions);

  // 관찰할 요소들 등록
  const animateElements = document.querySelectorAll(
      '.features-section, .pricing-section, .locations-section, .cta-section, .features-grid, .pricing-grid'
  );

  animateElements.forEach(el => observer.observe(el));
}

function animateCards(container) {
  const cards = container.querySelectorAll('.feature-card, .pricing-card');

  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('animate-in');
    }, index * 100);
  });
}

// ========================================
// 부드러운 스크롤
// ========================================
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();

      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        const headerHeight = document.querySelector('header').offsetHeight;
        const targetPosition = targetElement.offsetTop - headerHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ========================================
// 실시간 업데이트
// ========================================
function startStatsUpdate() {
  // 30초마다 통계 업데이트
  setInterval(() => {
    loadParkingStats();
  }, 30000);

  console.log('⏰ 실시간 통계 업데이트 시작');
}

// ========================================
// 사용자 액션 함수들
// ========================================
function showDirections() {
  const address = '서울시 강남구 테헤란로 123';
  const mapUrl = `https://map.kakao.com/link/to/스마트파킹,37.4979,127.0276`;

  if (confirm('길찾기 앱으로 이동하시겠습니까?')) {
    // 모바일인 경우 카카오맵 앱 실행
    if (isMobile()) {
      window.location.href = mapUrl;
    } else {
      // 데스크톱인 경우 새 창에서 열기
      window.open(mapUrl, '_blank');
    }
  }
}

async function checkAvailability() {
  showLoading('실시간 현황을 확인하는 중...');

  try {
    const data = await apiRequest('/api/parking/live-status');
    hideLoading();

    const message = `현재 주차 현황

🅿️ 전체: ${data.totalSlots || 247}면
🚗 사용중: ${data.occupiedSlots || 189}면  
✅ 빈자리: ${data.availableSlots || 58}면
📊 이용률: ${data.occupancyRate || 76}%

지금 예약하시겠습니까?`;

    if (confirm(message)) {
      window.location.href = 'login.html?redirect=reservation.html';
    }
  } catch (error) {
    hideLoading();
    showToast('현황 확인에 실패했습니다. 다시 시도해주세요.', 'error');
  }
}

// ========================================
// 헤더 스크롤 효과
// ========================================
let lastScrollTop = 0;
window.addEventListener('scroll', function() {
  const header = document.querySelector('header');
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  // 스크롤 방향에 따라 헤더 숨김/표시
  if (scrollTop > lastScrollTop && scrollTop > 100) {
    header.style.transform = 'translateY(-100%)';
  } else {
    header.style.transform = 'translateY(0)';
  }

  // 스크롤시 헤더 배경 변경
  if (scrollTop > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }

  lastScrollTop = scrollTop;
});

// ========================================
// 가격 카드 호버 효과
// ========================================
document.querySelectorAll('.pricing-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-10px) scale(1.02)';
  });

  card.addEventListener('mouseleave', function() {
    this.style.transform = 'translateY(0) scale(1)';
  });
});

// ========================================
// 기능 카드 클릭 효과
// ========================================
document.querySelectorAll('.feature-card').forEach(card => {
  card.addEventListener('click', function() {
    // 클릭 애니메이션
    this.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.style.transform = 'scale(1)';
    }, 150);

    // 해당 기능에 대한 상세 정보 표시
    const featureTitle = this.querySelector('h3').textContent;
    showFeatureDetail(featureTitle);
  });
});

function showFeatureDetail(featureTitle) {
  const details = {
    '간편한 예약': '스마트폰 앱으로 언제 어디서나 쉽게 주차 예약이 가능합니다. 실시간으로 빈 자리를 확인하고 미리 예약하세요.',
    '자동 결제': '출차시 자동으로 결제가 처리됩니다. 신용카드, 체크카드, 간편결제 등 다양한 결제 수단을 지원합니다.',
    '실시간 현황': '주차장의 실시간 이용 현황을 확인할 수 있습니다. AI 기반 추천 시스템으로 최적의 주차장을 안내해드립니다.',
    '안전한 보안': '24시간 CCTV 모니터링과 전문 보안팀이 고객님의 차량을 안전하게 보호합니다.',
    '멤버십 혜택': '이용할수록 더 많은 혜택을 받으세요. 등급별 할인율과 포인트 적립, 우선 예약 등의 특별 혜택이 있습니다.',
    '24시간 지원': '언제든지 도움이 필요하시면 연락하세요. 실시간 채팅, 전화, 이메일을 통해 24시간 지원합니다.'
  };

  const detail = details[featureTitle];
  if (detail) {
    showToast(`${featureTitle}\n\n${detail}`, 'info', 5000);
  }
}

// ========================================
// 모바일 메뉴 토글 (필요시)
// ========================================
function toggleMobileMenu() {
  const mainMenu = document.querySelector('.main-menu');
  mainMenu.classList.toggle('mobile-open');
}

// ========================================
// 페이지 로딩 완료 후 처리
// ========================================
window.addEventListener('load', function() {
  // 로딩 애니메이션 제거
  document.body.classList.add('loaded');

  // 환영 메시지 (첫 방문자에게만)
  if (!localStorage.getItem('visited')) {
    setTimeout(() => {
      showToast('스마트파킹에 오신 것을 환영합니다! 🎉', 'success');
      localStorage.setItem('visited', 'true');
    }, 1000);
  }
});

// ========================================
// 전역 함수 노출
// ========================================
window.showDirections = showDirections;
window.checkAvailability = checkAvailability;
window.toggleMobileMenu = toggleMobileMenu;

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 세션 쿠키 유지
    ...options,
  });

  const contentType = response.headers.get('content-type');
  if (!response.ok || !contentType?.includes('application/json')) {
    throw new Error('API 응답 오류 또는 로그인 필요');
  }

  return await response.json();
}
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: type === 'error' ? '#dc3545' : '#333',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    zIndex: 9999,
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out'
  });

  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = 1;
  });

  setTimeout(() => {
    toast.style.opacity = 0;
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
