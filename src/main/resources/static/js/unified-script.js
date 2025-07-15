// ========================================
// 스마트파킹 공개 버전 (백엔드 완전 연동)
// ========================================

// 전역 변수 및 상태 관리
const AppState = {
  isLoggedIn: false,
  currentUser: null,
  userRole: null,
  theme: 'light',
  language: 'ko',
  accessToken: null,
  refreshToken: null,
  realTimeData: {
    parkingStatus: null,
    pricing: null,
    weather: null,
    events: []
  },
  cache: new Map(),
  notifications: [],
  preferences: {
    darkMode: false,
    notifications: true,
    realTimeUpdates: true
  }
};

// 설정 및 상수
const CONFIG = {
  API_BASE_URL: '/api',
  WS_BASE_URL: 'wss://api.smartparking.com/ws',
  UPDATE_INTERVAL: 30000, // 30초
  CACHE_DURATION: 300000, // 5분
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
  SUPPORTED_LANGUAGES: ['ko', 'en'],
  FEATURES: {
    realTimeUpdates: true,
    notifications: true,
    analytics: true,
    pwa: true,
    offline: true
  }
};

// 실시간 연결 관리
let wsConnection = null;
let updateInterval = null;
let retryCount = 0;
let isOffline = false;

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚗 스마트파킹 고급 공개 버전 로드 시작');

  initializeApplication();
});

// ========================================
// 애플리케이션 초기화
// ========================================
async function initializeApplication() {
  try {
    showLoading('시스템을 초기화하는 중...');

    // 병렬 초기화 작업
    await Promise.all([
      initializeUserSession(),
      initializeTheme(),
      initializeLanguage(),
      initializeServiceWorker(),
      loadCachedData()
    ]);

    // 순차 초기화 작업
    await initializeRealTimeData();
    await initializeWebSocket();

    // UI 및 기능 초기화
    initializeUserInterface();
    initializeInteractions();
    initializeAccessibility();
    initializePerformanceMonitoring();

    // 실시간 업데이트 시작
    startRealTimeUpdates();

    hideLoading();

    console.log('✅ 애플리케이션 초기화 완료');
    showWelcomeMessage();

  } catch (error) {
    hideLoading();
    console.error('❌ 애플리케이션 초기화 실패:', error);
    showToast('시스템 초기화에 실패했습니다. 페이지를 새로고침해주세요.', 'error');

    // 기본 모드로 실행
    initializeFallbackMode();
  }
}

// ========================================
// 사용자 세션 초기화
// ========================================
async function initializeUserSession() {
  console.log('👤 사용자 세션 초기화 중...');

  try {
    // 서버 세션 데이터 확인
    if (typeof serverUserData !== 'undefined' && serverUserData) {
      AppState.currentUser = serverUserData.user;
      AppState.userRole = serverUserData.role;
      AppState.isLoggedIn = true;
      AppState.accessToken = serverUserData.accessToken;
      AppState.refreshToken = serverUserData.refreshToken;

      console.log('✅ 서버 세션에서 사용자 정보 로드:', {
        user: AppState.currentUser?.name,
        role: AppState.userRole
      });
    } else {
      // 로컬 저장소에서 토큰 확인
      const storedToken = getStoredToken();
      if (storedToken) {
        const userInfo = await validateToken(storedToken);
        if (userInfo) {
          AppState.currentUser = userInfo.user;
          AppState.userRole = userInfo.role;
          AppState.isLoggedIn = true;
          AppState.accessToken = storedToken;
        }
      }
    }

    // 사용자 환경설정 로드
    if (AppState.isLoggedIn) {
      await loadUserPreferences();
    }

  } catch (error) {
    console.error('❌ 사용자 세션 초기화 실패:', error);
    AppState.isLoggedIn = false;
  }
}

async function validateToken(token) {
  try {
    const response = await apiRequest('/auth/validate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response?.valid ? response : null;
  } catch (error) {
    console.error('❌ 토큰 검증 실패:', error);
    removeStoredToken();
    return null;
  }
}

async function loadUserPreferences() {
  try {
    const preferences = await apiRequest('/user/preferences');
    if (preferences) {
      AppState.preferences = { ...AppState.preferences, ...preferences };
      applyUserPreferences();
    }
  } catch (error) {
    console.error('❌ 사용자 환경설정 로드 실패:', error);
  }
}

function applyUserPreferences() {
  const { darkMode, language, notifications } = AppState.preferences;

  if (darkMode) {
    document.body.classList.add('dark-mode');
    AppState.theme = 'dark';
  }

  if (language && language !== AppState.language) {
    AppState.language = language;
    updateLanguage(language);
  }

  if (!notifications) {
    disableNotifications();
  }
}

// ========================================
// 실시간 데이터 초기화
// ========================================
async function initializeRealTimeData() {
  console.log('📊 실시간 데이터 초기화 중...');

  try {
    // 병렬로 데이터 로드
    const [parkingData, pricingData, weatherData, eventsData] = await Promise.allSettled([
      loadParkingStatus(),
      loadPricingInformation(),
      loadWeatherData(),
      loadSystemEvents()
    ]);

    // 성공한 데이터만 저장
    if (parkingData.status === 'fulfilled') {
      AppState.realTimeData.parkingStatus = parkingData.value;
      updateParkingStatusDisplay(parkingData.value);
    }

    if (pricingData.status === 'fulfilled') {
      AppState.realTimeData.pricing = pricingData.value;
      updatePricingDisplay(pricingData.value);
    }

    if (weatherData.status === 'fulfilled') {
      AppState.realTimeData.weather = weatherData.value;
      updateWeatherDisplay(weatherData.value);
    }

    if (eventsData.status === 'fulfilled') {
      AppState.realTimeData.events = eventsData.value;
      updateSystemEventsDisplay(eventsData.value);
    }

    console.log('✅ 실시간 데이터 초기화 완료');

  } catch (error) {
    console.error('❌ 실시간 데이터 초기화 실패:', error);

    // 폴백: 시뮬레이션 데이터 사용
    loadFallbackData();
  }
}

async function loadParkingStatus() {
  const endpoint = AppState.isLoggedIn ? '/parking/live-status' : '/public/parking/status';

  const data = await apiRequest(endpoint, {
    headers: AppState.isLoggedIn ? {
      'Authorization': `Bearer ${AppState.accessToken}`
    } : {}
  });

  return data;
}

async function loadPricingInformation() {
  const data = await apiRequest('/public/pricing', {
    params: {
      includePromotions: AppState.isLoggedIn,
      userLevel: AppState.userRole || 'GUEST'
    }
  });

  return data;
}

async function loadWeatherData() {
  try {
    const data = await apiRequest('/public/weather', {
      params: {
        location: 'seoul',
        includeTraffic: true
      }
    });

    return data;
  } catch (error) {
    // 날씨 정보는 선택사항이므로 실패해도 계속 진행
    console.warn('⚠️ 날씨 정보 로드 실패:', error);
    return null;
  }
}

async function loadSystemEvents() {
  try {
    const data = await apiRequest('/public/events', {
      params: {
        active: true,
        limit: 5
      }
    });

    return data?.events || [];
  } catch (error) {
    console.warn('⚠️ 시스템 이벤트 로드 실패:', error);
    return [];
  }
}

// ========================================
// WebSocket 연결 관리
// ========================================
async function initializeWebSocket() {
  if (!CONFIG.FEATURES.realTimeUpdates) return;

  console.log('🔌 WebSocket 연결 초기화 중...');

  try {
    const wsUrl = AppState.isLoggedIn
        ? `${CONFIG.WS_BASE_URL}/private/${AppState.currentUser?.id}`
        : `${CONFIG.WS_BASE_URL}/public`;

    wsConnection = new WebSocket(wsUrl);

    wsConnection.onopen = handleWebSocketOpen;
    wsConnection.onmessage = handleWebSocketMessage;
    wsConnection.onclose = handleWebSocketClose;
    wsConnection.onerror = handleWebSocketError;

  } catch (error) {
    console.error('❌ WebSocket 초기화 실패:', error);
  }
}

function handleWebSocketOpen() {
  console.log('✅ WebSocket 연결됨');
  retryCount = 0;

  // 연결 확인 메시지
  if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
    wsConnection.send(JSON.stringify({
      type: 'subscribe',
      channels: ['parking_status', 'pricing', 'system_events'],
      userType: AppState.isLoggedIn ? 'authenticated' : 'guest'
    }));
  }

  showToast('실시간 업데이트가 활성화되었습니다.', 'success');
}

function handleWebSocketMessage(event) {
  try {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'parking_status_update':
        AppState.realTimeData.parkingStatus = data.payload;
        updateParkingStatusDisplay(data.payload);
        break;

      case 'pricing_update':
        AppState.realTimeData.pricing = data.payload;
        updatePricingDisplay(data.payload);
        break;

      case 'system_event':
        AppState.realTimeData.events.unshift(data.payload);
        updateSystemEventsDisplay(AppState.realTimeData.events);
        showSystemNotification(data.payload);
        break;

      case 'weather_update':
        AppState.realTimeData.weather = data.payload;
        updateWeatherDisplay(data.payload);
        break;

      case 'maintenance_notice':
        showMaintenanceNotice(data.payload);
        break;

      default:
        console.log('📨 알 수 없는 WebSocket 메시지:', data.type);
    }

  } catch (error) {
    console.error('❌ WebSocket 메시지 처리 실패:', error);
  }
}

function handleWebSocketClose(event) {
  console.log('❌ WebSocket 연결 종료:', event.code, event.reason);

  // 자동 재연결 시도
  if (retryCount < CONFIG.MAX_RETRIES && !isOffline) {
    retryCount++;
    const delay = CONFIG.RETRY_DELAY * Math.pow(2, retryCount - 1);

    console.log(`🔄 WebSocket 재연결 시도 ${retryCount}/${CONFIG.MAX_RETRIES} (${delay}ms 후)`);

    setTimeout(() => {
      initializeWebSocket();
    }, delay);
  } else {
    showToast('실시간 업데이트 연결이 끊어졌습니다.', 'warning');
  }
}

function handleWebSocketError(error) {
  console.error('❌ WebSocket 오류:', error);
}

// ========================================
// UI 표시 업데이트 함수들
// ========================================
function updateParkingStatusDisplay(data) {
  if (!data) return;

  const statusNumbers = document.querySelectorAll('.status-number');
  if (statusNumbers.length >= 4) {
    statusNumbers[0].textContent = data.totalSlots || 0;
    statusNumbers[1].textContent = data.occupiedSlots || 0;
    statusNumbers[2].textContent = data.availableSlots || 0;
    statusNumbers[3].textContent = (data.occupancyRate || 0) + '%';

    // 가용률에 따른 색상 업데이트
    const rateElement = statusNumbers[3];
    const rate = data.occupancyRate || 0;

    rateElement.className = rate >= 90 ? 'status-number critical' :
        rate >= 70 ? 'status-number warning' :
            'status-number normal';
  }

  // 구역별 상태 업데이트
  if (data.zones) {
    updateZoneStatusDisplay(data.zones);
  }

  // 마지막 업데이트 시간 표시
  const lastUpdated = document.getElementById('last-updated');
  if (lastUpdated) {
    lastUpdated.textContent = new Date().toLocaleTimeString();
  }

  console.log('📊 주차장 현황 업데이트:', data);
}

function updateZoneStatusDisplay(zones) {
  const zoneContainer = document.getElementById('zone-status-container');
  if (!zoneContainer) return;

  zoneContainer.innerHTML = '';

  zones.forEach(zone => {
    const zoneElement = document.createElement('div');
    zoneElement.className = 'zone-status-item';

    const availabilityRate = ((zone.total - zone.occupied) / zone.total) * 100;
    const statusClass = availabilityRate >= 50 ? 'high' :
        availabilityRate >= 20 ? 'medium' : 'low';

    zoneElement.innerHTML = `
      <div class="zone-header">
        <span class="zone-name">${zone.name}</span>
        <span class="zone-availability ${statusClass}">${Math.round(availabilityRate)}%</span>
      </div>
      <div class="zone-details">
        <span class="zone-available">${zone.total - zone.occupied}/${zone.total}</span>
        <div class="zone-progress">
          <div class="zone-progress-bar" style="width: ${availabilityRate}%"></div>
        </div>
      </div>
    `;

    zoneContainer.appendChild(zoneElement);
  });
}

function updatePricingDisplay(data) {
  if (!data) return;

  const priceElements = document.querySelectorAll('.price');

  priceElements.forEach((element, index) => {
    const priceType = ['hourly', 'daily', 'monthly'][index];
    const priceData = data[priceType];

    if (priceData) {
      const span = element.querySelector('span');
      const unit = span ? span.textContent : '';

      // 할인 적용 가격 계산
      let finalPrice = priceData.basePrice;
      if (priceData.discount > 0) {
        finalPrice = priceData.basePrice * (1 - priceData.discount / 100);
      }

      element.innerHTML = `₩${Math.floor(finalPrice).toLocaleString()}<span>${unit}</span>`;

      // 할인 표시
      if (priceData.discount > 0) {
        element.classList.add('discounted');
        element.title = `원가: ₩${priceData.basePrice.toLocaleString()} (${priceData.discount}% 할인)`;
      }

      // 피크 시간 표시
      if (priceData.isPeakTime) {
        element.classList.add('peak-time');
      } else {
        element.classList.remove('peak-time');
      }
    }
  });

  console.log('💰 요금 정보 업데이트:', data);
}

function updateWeatherDisplay(data) {
  if (!data) return;

  const weatherContainer = document.getElementById('weather-info');
  if (!weatherContainer) return;

  weatherContainer.innerHTML = `
    <div class="weather-current">
      <div class="weather-icon">${getWeatherIcon(data.condition)}</div>
      <div class="weather-temp">${data.temperature}°C</div>
      <div class="weather-desc">${data.description}</div>
    </div>
    <div class="weather-details">
      <div class="weather-item">
        <span class="weather-label">습도:</span>
        <span class="weather-value">${data.humidity}%</span>
      </div>
      <div class="weather-item">
        <span class="weather-label">바람:</span>
        <span class="weather-value">${data.windSpeed}m/s</span>
      </div>
      ${data.trafficImpact ? `
        <div class="weather-traffic">
          <span class="traffic-icon">🚗</span>
          <span class="traffic-text">교통 영향: ${data.trafficImpact}</span>
        </div>
      ` : ''}
    </div>
  `;

  // 날씨에 따른 주차 권장사항 표시
  if (data.parkingRecommendation) {
    showWeatherBasedRecommendation(data.parkingRecommendation);
  }

  console.log('🌤️ 날씨 정보 업데이트:', data);
}

function getWeatherIcon(condition) {
  const icons = {
    'clear': '☀️',
    'cloudy': '☁️',
    'rainy': '🌧️',
    'snowy': '❄️',
    'stormy': '⛈️',
    'foggy': '🌫️'
  };
  return icons[condition] || '🌤️';
}

function updateSystemEventsDisplay(events) {
  const eventsContainer = document.getElementById('system-events');
  if (!eventsContainer || !events.length) return;

  eventsContainer.innerHTML = '<h4>📢 알림</h4>';

  events.slice(0, 3).forEach(event => {
    const eventElement = document.createElement('div');
    eventElement.className = `event-item ${event.priority}`;

    eventElement.innerHTML = `
      <div class="event-time">${formatEventTime(event.timestamp)}</div>
      <div class="event-content">
        <div class="event-title">${escapeHtml(event.title)}</div>
        <div class="event-description">${escapeHtml(event.description)}</div>
      </div>
    `;

    eventsContainer.appendChild(eventElement);
  });
}

// ========================================
// 캐싱 시스템
// ========================================
function getCachedData(key) {
  const cached = AppState.cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CONFIG.CACHE_DURATION) {
    AppState.cache.delete(key);
    return null;
  }

  return cached.data;
}

function setCachedData(key, data) {
  AppState.cache.set(key, {
    data: data,
    timestamp: Date.now()
  });
}

async function loadCachedData() {
  try {
    // 로컬 스토리지에서 캐시된 데이터 복원
    const cachedKeys = ['parkingStatus', 'pricing', 'weather'];

    cachedKeys.forEach(key => {
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (Date.now() - data.timestamp < CONFIG.CACHE_DURATION) {
            AppState.cache.set(key, data);
          } else {
            localStorage.removeItem(`cache_${key}`);
          }
        } catch (error) {
          localStorage.removeItem(`cache_${key}`);
        }
      }
    });

    console.log('📦 캐시 데이터 로드 완료');
  } catch (error) {
    console.error('❌ 캐시 데이터 로드 실패:', error);
  }
}

function saveCacheToStorage() {
  try {
    AppState.cache.forEach((value, key) => {
      localStorage.setItem(`cache_${key}`, JSON.stringify(value));
    });
  } catch (error) {
    console.error('❌ 캐시 저장 실패:', error);
  }
}

// ========================================
// API 요청 관리 (고도화)
// ========================================
async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${CONFIG.API_BASE_URL}${endpoint}`;

  // 캐시 확인
  if (options.method === 'GET' || !options.method) {
    const cached = getCachedData(endpoint);
    if (cached) {
      console.log('📦 캐시에서 데이터 반환:', endpoint);
      return cached;
    }
  }

  const config = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    },
    ...options
  };

  // URL 파라미터 추가
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    const separator = url.includes('?') ? '&' : '?';
    const finalUrl = `${url}${separator}${searchParams.toString()}`;
    return await performRequest(finalUrl, config, endpoint);
  }

  return await performRequest(url, config, endpoint);
}

async function performRequest(url, config, cacheKey) {
  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // GET 요청만 캐시
    if (config.method === 'GET' || !config.method) {
      setCachedData(cacheKey, data);
    }

    return data;

  } catch (error) {
    console.error(`❌ API 요청 실패 (${url}):`, error);

    // 오프라인 상황에서 캐시 데이터 반환
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const cached = getCachedData(cacheKey);
      if (cached) {
        console.log('📦 오프라인 - 캐시 데이터 사용:', cacheKey);
        return cached;
      }
    }

    throw error;
  }
}

// ========================================
// 폴백 모드 및 오프라인 지원
// ========================================
function initializeFallbackMode() {
  console.log('🔄 폴백 모드 초기화');

  loadFallbackData();
  initializeBasicFeatures();

  showToast('오프라인 모드로 실행 중입니다.', 'info');
}

function loadFallbackData() {
  // 시뮬레이션된 주차장 데이터
  const fallbackParkingData = {
    totalSlots: 247,
    occupiedSlots: 189,
    availableSlots: 58,
    occupancyRate: 77,
    zones: [
      { name: 'A구역', total: 80, occupied: 65 },
      { name: 'B구역', total: 90, occupied: 72 },
      { name: 'C구역', total: 77, occupied: 52 }
    ]
  };

  // 시뮬레이션된 요금 데이터
  const fallbackPricingData = {
    hourly: { basePrice: 2000, discount: 0, isPeakTime: false },
    daily: { basePrice: 20000, discount: 5, isPeakTime: false },
    monthly: { basePrice: 150000, discount: 10, isPeakTime: false }
  };

  updateParkingStatusDisplay(fallbackParkingData);
  updatePricingDisplay(fallbackPricingData);

  console.log('📊 폴백 데이터 로드 완료');
}

function initializeBasicFeatures() {
  // 기본적인 인터랙션만 활성화
  setupFAQToggle();
  setupMapFunction();
  setupModalHandlers();
  setupScrollAnimations();

  console.log('🔧 기본 기능 초기화 완료');
}

// ========================================
// 실시간 업데이트 관리
// ========================================
function startRealTimeUpdates() {
  if (!CONFIG.FEATURES.realTimeUpdates || isOffline) return;

  updateInterval = setInterval(async () => {
    try {
      await refreshRealTimeData();
    } catch (error) {
      console.error('❌ 실시간 업데이트 실패:', error);
    }
  }, CONFIG.UPDATE_INTERVAL);

  console.log('⏰ 실시간 업데이트 시작');
}

function stopRealTimeUpdates() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log('⏹️ 실시간 업데이트 중지');
  }
}

async function refreshRealTimeData() {
  if (!navigator.onLine) {
    setOfflineMode(true);
    return;
  }

  if (isOffline) {
    setOfflineMode(false);
  }

  try {
    const [parkingData, pricingData] = await Promise.allSettled([
      loadParkingStatus(),
      loadPricingInformation()
    ]);

    if (parkingData.status === 'fulfilled') {
      AppState.realTimeData.parkingStatus = parkingData.value;
      updateParkingStatusDisplay(parkingData.value);
    }

    if (pricingData.status === 'fulfilled') {
      AppState.realTimeData.pricing = pricingData.value;
      updatePricingDisplay(pricingData.value);
    }

  } catch (error) {
    console.error('❌ 데이터 새로고침 실패:', error);
  }
}

function setOfflineMode(offline) {
  isOffline = offline;

  const statusIndicator = document.getElementById('connection-status');
  if (statusIndicator) {
    statusIndicator.textContent = offline ? '오프라인' : '온라인';
    statusIndicator.className = offline ? 'offline' : 'online';
  }

  if (offline) {
    stopRealTimeUpdates();
    showToast('오프라인 모드로 전환되었습니다.', 'warning');
  } else {
    startRealTimeUpdates();
    initializeWebSocket();
    showToast('온라인 상태가 복구되었습니다.', 'success');
  }
}

// ========================================
// 다국어 지원
// ========================================
async function initializeLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const langFromUrl = urlParams.get('lang');
  const langFromStorage = localStorage.getItem('preferred_language');
  const browserLang = navigator.language.substring(0, 2);

  const selectedLang = langFromUrl || langFromStorage || browserLang || 'ko';

  if (CONFIG.SUPPORTED_LANGUAGES.includes(selectedLang)) {
    AppState.language = selectedLang;
    await loadLanguagePack(selectedLang);
  }
}

async function loadLanguagePack(language) {
  try {
    const langData = await apiRequest(`/public/i18n/${language}`);
    if (langData) {
      applyTranslations(langData);
      localStorage.setItem('preferred_language', language);

      console.log(`🌐 언어 팩 로드 완료: ${language}`);
    }
  } catch (error) {
    console.error('❌ 언어 팩 로드 실패:', error);
  }
}

function applyTranslations(translations) {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (translations[key]) {
      element.textContent = translations[key];
    }
  });

  // HTML 속성 번역
  document.querySelectorAll('[data-i18n-attr]').forEach(element => {
    const attrData = element.getAttribute('data-i18n-attr').split(':');
    const [attr, key] = attrData;
    if (translations[key]) {
      element.setAttribute(attr, translations[key]);
    }
  });
}

async function updateLanguage(language) {
  if (CONFIG.SUPPORTED_LANGUAGES.includes(language)) {
    AppState.language = language;
    await loadLanguagePack(language);

    // URL 업데이트
    const url = new URL(window.location);
    url.searchParams.set('lang', language);
    window.history.replaceState({}, '', url);
  }
}

// ========================================
// 테마 및 다크모드 관리
// ========================================
async function initializeTheme() {
  const savedTheme = localStorage.getItem('preferred_theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
  AppState.theme = theme;

  applyTheme(theme);

  // 시스템 테마 변경 감지
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('preferred_theme')) {
      const newTheme = e.matches ? 'dark' : 'light';
      AppState.theme = newTheme;
      applyTheme(newTheme);
    }
  });
}

function applyTheme(theme) {
  document.body.className = document.body.className.replace(/theme-\w+/g, '');
  document.body.classList.add(`theme-${theme}`);

  // 다크모드 특별 처리
  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }

  // 메타 태그 업데이트
  const themeColor = theme === 'dark' ? '#1f2937' : '#3b82f6';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor);

  console.log(`🎨 테마 적용: ${theme}`);
}

function toggleTheme() {
  const newTheme = AppState.theme === 'light' ? 'dark' : 'light';
  AppState.theme = newTheme;
  applyTheme(newTheme);
  localStorage.setItem('preferred_theme', newTheme);

  showToast(`${newTheme === 'dark' ? '다크' : '라이트'} 모드로 변경되었습니다.`, 'info');
}

// ========================================
// 서비스 워커 (PWA 지원)
// ========================================
async function initializeServiceWorker() {
  if (!CONFIG.FEATURES.pwa || !('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('✅ 서비스 워커 등록 완료:', registration);

    // 업데이트 확인
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker?.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          showUpdateAvailableNotification();
        }
      });
    });

  } catch (error) {
    console.error('❌ 서비스 워커 등록 실패:', error);
  }
}

function showUpdateAvailableNotification() {
  if (confirm('새 버전이 사용 가능합니다. 지금 업데이트하시겠습니까?')) {
    window.location.reload();
  }
}

// ========================================
// 성능 모니터링
// ========================================
function initializePerformanceMonitoring() {
  if (!CONFIG.FEATURES.analytics) return;

  // 페이지 로드 성능 측정
  window.addEventListener('load', () => {
    setTimeout(() => {
      measurePagePerformance();
    }, 1000);
  });

  // 메모리 사용량 모니터링
  if ('memory' in performance) {
    setInterval(monitorMemoryUsage, 60000); // 1분마다
  }

  // 사용자 상호작용 추적
  setupInteractionTracking();
}

function measurePagePerformance() {
  if (!performance.getEntriesByType) return;

  const navigation = performance.getEntriesByType('navigation')[0];
  if (navigation) {
    const metrics = {
      loadTime: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
      domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
      firstByte: Math.round(navigation.responseStart - navigation.requestStart),
      connect: Math.round(navigation.connectEnd - navigation.connectStart)
    };

    console.log('📊 페이지 성능 메트릭:', metrics);

    // 성능 데이터 서버 전송 (선택사항)
    if (CONFIG.FEATURES.analytics) {
      sendPerformanceData(metrics);
    }

    // 느린 로딩 경고
    if (metrics.loadTime > 3000) {
      console.warn('⚠️ 페이지 로딩이 느립니다:', metrics.loadTime + 'ms');
    }
  }
}

function monitorMemoryUsage() {
  if ('memory' in performance) {
    const memory = performance.memory;
    const memoryUsage = {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
    };

    console.log('🧠 메모리 사용량:', memoryUsage);

    // 메모리 사용량이 높으면 경고
    if (memoryUsage.used / memoryUsage.limit > 0.8) {
      console.warn('⚠️ 높은 메모리 사용량 감지');
      optimizeMemoryUsage();
    }
  }
}

function optimizeMemoryUsage() {
  // 캐시 정리
  const cacheSize = AppState.cache.size;
  if (cacheSize > 50) {
    const oldestEntries = Array.from(AppState.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, Math.floor(cacheSize / 2));

    oldestEntries.forEach(([key]) => AppState.cache.delete(key));
    console.log(`🧹 캐시 정리: ${oldestEntries.length}개 항목 제거`);
  }

  // 가비지 컬렉션 제안
  if (window.gc) {
    window.gc();
  }
}

function setupInteractionTracking() {
  const events = ['click', 'scroll', 'resize', 'focus'];

  events.forEach(eventType => {
    document.addEventListener(eventType, debounce((e) => {
      trackUserInteraction(eventType, e);
    }, 1000));
  });
}

function trackUserInteraction(type, event) {
  const data = {
    type: type,
    timestamp: Date.now(),
    url: window.location.pathname,
    userAgent: navigator.userAgent.substring(0, 100)
  };

  if (type === 'click' && event.target) {
    data.element = event.target.tagName.toLowerCase();
    data.className = event.target.className;
  }

  // 분석 데이터 큐에 추가 (실제 전송은 배치로)
  if (!window.analyticsQueue) {
    window.analyticsQueue = [];
  }
  window.analyticsQueue.push(data);

  // 큐가 가득 차면 전송
  if (window.analyticsQueue.length >= 10) {
    sendAnalyticsData();
  }
}

async function sendAnalyticsData() {
  if (!window.analyticsQueue?.length || !CONFIG.FEATURES.analytics) return;

  try {
    await apiRequest('/analytics/interactions', {
      method: 'POST',
      body: JSON.stringify({
        events: window.analyticsQueue,
        session: generateSessionId(),
        user: AppState.isLoggedIn ? AppState.currentUser?.id : null
      })
    });

    window.analyticsQueue = [];
  } catch (error) {
    console.error('❌ 분석 데이터 전송 실패:', error);
  }
}

async function sendPerformanceData(metrics) {
  try {
    await apiRequest('/analytics/performance', {
      method: 'POST',
      body: JSON.stringify({
        ...metrics,
        url: window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      })
    });
  } catch (error) {
    console.error('❌ 성능 데이터 전송 실패:', error);
  }
}

// ========================================
// 사용자 인터페이스 초기화
// ========================================
function initializeUserInterface() {
  setupSmoothScroll();
  setupScrollAnimations();
  setupModalHandlers();
  setupKeyboardShortcuts();
  handleHashNavigation();

  // 사용자 상태에 따른 UI 조정
  updateUIForUserState();
}

function updateUIForUserState() {
  const userStateIndicator = document.getElementById('user-state');
  const loginButton = document.getElementById('login-button');
  const userMenu = document.getElementById('user-menu');

  if (AppState.isLoggedIn) {
    if (userStateIndicator) {
      userStateIndicator.innerHTML = `
        <span class="user-welcome">안녕하세요, ${AppState.currentUser?.name}님</span>
        <span class="user-role">${getRoleDisplayName(AppState.userRole)}</span>
      `;
    }

    if (loginButton) loginButton.style.display = 'none';
    if (userMenu) userMenu.style.display = 'block';

  } else {
    if (userStateIndicator) {
      userStateIndicator.innerHTML = '<span class="guest-welcome">환영합니다</span>';
    }

    if (loginButton) loginButton.style.display = 'block';
    if (userMenu) userMenu.style.display = 'none';
  }

  // 역할별 기능 표시/숨김
  updateRoleBasedFeatures();
}

function updateRoleBasedFeatures() {
  const features = document.querySelectorAll('[data-role-required]');

  features.forEach(feature => {
    const requiredRoles = feature.getAttribute('data-role-required').split(',');
    const hasAccess = AppState.isLoggedIn &&
        (requiredRoles.includes(AppState.userRole) || requiredRoles.includes('ANY'));

    feature.style.display = hasAccess ? 'block' : 'none';
  });
}

function getRoleDisplayName(role) {
  const roleNames = {
    'CUSTOMER': '고객',
    'ADMIN': '관리자',
    'MANAGER': '매니저',
    'SUPERVISOR': '수퍼바이저'
  };
  return roleNames[role] || role;
}

// ========================================
// 접근성 개선 (고도화)
// ========================================
function initializeAccessibility() {
  enhanceKeyboardNavigation();
  setupScreenReaderSupport();
  improveColorContrast();
  addAccessibilityShortcuts();

  console.log('♿ 접근성 기능 초기화 완료');
}

function enhanceKeyboardNavigation() {
  // 포커스 관리 개선
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-navigation');
  });

  // 스킵 링크 추가
  const skipLink = document.createElement('a');
  skipLink.href = '#main-content';
  skipLink.className = 'skip-link';
  skipLink.textContent = '메인 콘텐츠로 바로가기';
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 6px;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 10000;
    transition: top 0.3s;
  `;

  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '6px';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px';
  });

  document.body.insertBefore(skipLink, document.body.firstChild);
}

function setupScreenReaderSupport() {
  // ARIA 레이블 동적 업데이트
  const statusNumbers = document.querySelectorAll('.status-number');
  statusNumbers.forEach((element, index) => {
    const labels = ['전체 주차면', '이용중 주차면', '가용 주차면', '이용률'];
    element.setAttribute('aria-label', labels[index]);
  });

  // 라이브 리전 설정
  const liveRegion = document.createElement('div');
  liveRegion.id = 'live-region';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  liveRegion.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;
  document.body.appendChild(liveRegion);
}

function announceToScreenReader(message) {
  const liveRegion = document.getElementById('live-region');
  if (liveRegion) {
    liveRegion.textContent = message;
  }
}

function improveColorContrast() {
  // 높은 대비 모드 감지
  const highContrast = window.matchMedia('(prefers-contrast: high)').matches;

  if (highContrast) {
    document.body.classList.add('high-contrast');
  }

  // 대비 설정 변경 감지
  window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
    if (e.matches) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  });
}

function addAccessibilityShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Alt + 1: 메인 콘텐츠로
    if (e.altKey && e.key === '1') {
      e.preventDefault();
      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.focus();
        announceToScreenReader('메인 콘텐츠로 이동했습니다');
      }
    }

    // Alt + 2: 내비게이션으로
    if (e.altKey && e.key === '2') {
      e.preventDefault();
      const navigation = document.querySelector('nav');
      if (navigation) {
        navigation.focus();
        announceToScreenReader('내비게이션으로 이동했습니다');
      }
    }

    // Alt + T: 테마 토글
    if (e.altKey && e.key === 't') {
      e.preventDefault();
      toggleTheme();
      announceToScreenReader(`${AppState.theme} 모드로 변경되었습니다`);
    }
  });
}

// ========================================
// 기본 상호작용 기능들
// ========================================
function initializeInteractions() {
  setupFAQToggle();
  setupMapFunction();
  setupContactFeatures();
  setupNotificationSystem();
}

function setupFAQToggle() {
  window.toggleFAQ = function(element) {
    const faqItem = element.closest('.faq-item');
    const answer = faqItem.querySelector('.faq-answer');
    const toggle = element.querySelector('.faq-toggle');
    const question = element.querySelector('.faq-question-text');

    if (!answer || !toggle) return;

    const isExpanded = answer.style.display === 'block';

    // 다른 FAQ 닫기
    document.querySelectorAll('.faq-item').forEach(item => {
      if (item !== faqItem) {
        const otherAnswer = item.querySelector('.faq-answer');
        const otherToggle = item.querySelector('.faq-toggle');
        const otherQuestion = item.querySelector('.faq-question');

        if (otherAnswer && otherAnswer.style.display === 'block') {
          otherAnswer.style.display = 'none';
          if (otherToggle) otherToggle.textContent = '+';
          if (otherQuestion) otherQuestion.setAttribute('aria-expanded', 'false');
        }
      }
    });

    // 현재 FAQ 토글
    if (isExpanded) {
      answer.style.display = 'none';
      toggle.textContent = '+';
      element.setAttribute('aria-expanded', 'false');
      announceToScreenReader('FAQ가 닫혔습니다');
    } else {
      answer.style.display = 'block';
      toggle.textContent = '−';
      element.setAttribute('aria-expanded', 'true');
      announceToScreenReader(`FAQ가 열렸습니다: ${question?.textContent}`);
    }

    // 분석 추적
    trackUserInteraction('faq_toggle', {
      target: { tagName: 'FAQ', className: question?.textContent }
    });
  };
}

function setupMapFunction() {
  window.openMap = function() {
    const address = '서울특별시 강남구 테헤란로 123';
    const mapUrl = `https://map.naver.com/v5/search/${encodeURIComponent(address)}`;

    const mapWindow = window.open(mapUrl, '_blank', 'width=800,height=600');

    if (mapWindow) {
      showToast('지도가 새 창에서 열렸습니다.', 'success');
      announceToScreenReader('지도가 새 창에서 열렸습니다');
    } else {
      showToast('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.', 'warning');
    }

    // 분석 추적
    trackUserInteraction('map_open', { target: { tagName: 'MAP' } });
  };
}

function setupContactFeatures() {
  window.makeCall = function() {
    const phoneNumber = '02-1234-5678';

    if (confirm(`${phoneNumber}로 전화를 거시겠습니까?`)) {
      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        window.location.href = `tel:${phoneNumber}`;
      } else {
        copyToClipboard(phoneNumber);
        showToast(`전화번호 ${phoneNumber}가 클립보드에 복사되었습니다.`, 'success');
      }
    }
  };

  window.sendEmail = function() {
    const email = 'support@smartparking.com';
    const subject = '[스마트파킹] 문의사항';
    const body = '안녕하세요. 문의할 내용을 입력해주세요.';

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      window.location.href = mailtoLink;
    } catch (error) {
      copyToClipboard(email);
      showToast(`이메일 주소 ${email}가 클립보드에 복사되었습니다.`, 'success');
    }
  };
}

// ========================================
// 알림 시스템
// ========================================
function setupNotificationSystem() {
  // 브라우저 알림 권한 요청
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      console.log('📱 알림 권한:', permission);
    });
  }
}

function showSystemNotification(event) {
  if (!AppState.preferences.notifications) return;

  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(event.title, {
      body: event.description,
      icon: '/images/logo-icon.png',
      badge: '/images/logo-icon.png',
      tag: event.id,
      timestamp: Date.now()
    });
  }

  // 인앱 알림도 표시
  showToast(`📢 ${event.title}: ${event.description}`, event.priority || 'info');
}

function showMaintenanceNotice(notice) {
  const modal = document.createElement('div');
  modal.className = 'maintenance-modal';
  modal.innerHTML = `
    <div class="maintenance-content">
      <div class="maintenance-icon">🔧</div>
      <h3>시스템 점검 안내</h3>
      <div class="maintenance-details">
        <p><strong>점검 시간:</strong> ${notice.startTime} ~ ${notice.endTime}</p>
        <p><strong>점검 내용:</strong> ${notice.description}</p>
        <p><strong>영향 서비스:</strong> ${notice.affectedServices.join(', ')}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="btn-close-maintenance">
        확인
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  setTimeout(() => {
    modal.remove();
  }, 30000); // 30초 후 자동 제거
}

function showWeatherBasedRecommendation(recommendation) {
  showToast(`🌤️ 날씨 정보: ${recommendation}`, 'info', 5000);
}

// ========================================
// 키보드 단축키 시스템
// ========================================
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // 입력 필드에서는 단축키 비활성화
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
      return;
    }

    handleGlobalShortcuts(event);

    if (AppState.isLoggedIn) {
      handleUserShortcuts(event);
    }
  });
}

function handleGlobalShortcuts(event) {
  // Ctrl + / : 도움말 표시
  if (event.ctrlKey && event.key === '/') {
    event.preventDefault();
    showShortcutHelp();
  }

  // Escape: 모든 모달 닫기
  if (event.key === 'Escape') {
    closeAllModals();
  }

  // F: FAQ 검색 포커스
  if (event.key === 'f' && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    const faqSearch = document.getElementById('faq-search');
    if (faqSearch) {
      faqSearch.focus();
      announceToScreenReader('FAQ 검색으로 이동했습니다');
    }
  }
}

function handleUserShortcuts(event) {
  if (!event.ctrlKey) return;

  const shortcuts = {
    'h': () => window.location.href = '/',
    'd': () => window.location.href = '/customer/dashboard',
    'r': () => window.location.href = '/customer/reservation',
    'p': () => window.location.href = '/customer/payment',
    'l': () => window.location.href = '/customer/records'
  };

  // 관리자 전용 단축키
  if (['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(AppState.userRole)) {
    Object.assign(shortcuts, {
      'a': () => window.location.href = '/admin/approval',
      't': () => window.location.href = '/admin/traffic',
      'c': () => window.location.href = '/admin/cctv',
      'f': () => window.location.href = '/admin/fire-detection'
    });
  }

  if (shortcuts[event.key]) {
    event.preventDefault();
    shortcuts[event.key]();

    const pages = {
      'h': '홈', 'd': '대시보드', 'r': '예약', 'p': '결제', 'l': '이용내역',
      'a': '승인관리', 't': '교통관리', 'c': 'CCTV', 'f': '화재감지'
    };

    showToast(`${pages[event.key]} 페이지로 이동합니다.`, 'info');
    announceToScreenReader(`${pages[event.key]} 페이지로 이동합니다`);
  }
}

function showShortcutHelp() {
  const shortcuts = [
    'Ctrl + H: 홈으로 이동',
    'F: FAQ 검색',
    'Escape: 모달 닫기',
    'Alt + T: 테마 변경',
    'Alt + 1: 메인 콘텐츠로',
    'Alt + 2: 내비게이션으로'
  ];

  if (AppState.isLoggedIn) {
    shortcuts.push(
        'Ctrl + D: 대시보드',
        'Ctrl + R: 예약',
        'Ctrl + P: 결제',
        'Ctrl + L: 이용내역'
    );

    if (['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(AppState.userRole)) {
      shortcuts.push(
          'Ctrl + A: 승인관리',
          'Ctrl + T: 교통관리',
          'Ctrl + C: CCTV',
          'Ctrl + F: 화재감지'
      );
    }
  }

  alert(`키보드 단축키:\n\n${shortcuts.join('\n')}`);
}

// ========================================
// 스크롤 및 애니메이션
// ========================================
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // 포커스 이동 (접근성)
        target.setAttribute('tabindex', '-1');
        target.focus();

        announceToScreenReader(`${target.textContent || target.id} 섹션으로 이동했습니다`);
      }
    });
  });
}

function setupScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');

        // 한 번 애니메이션된 요소는 관찰 중지
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // 애니메이션할 요소들
  const animatedElements = document.querySelectorAll(
      '.pricing-card, .contact-card, .feature-card, .faq-item, .zone-status-item'
  );

  animatedElements.forEach(el => {
    el.classList.add('animate-ready');
    observer.observe(el);
  });

  console.log('🎬 스크롤 애니메이션 설정:', animatedElements.length + '개 요소');
}

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
        section.focus();
        announceToScreenReader(`${targetId} 섹션으로 이동했습니다`);
      }
    }, 1000);
  }
}

// ========================================
// 모달 관리
// ========================================
function setupModalHandlers() {
  // ESC 키로 모든 모달 닫기
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllModals();
    }
  });

  // 모달 외부 클릭으로 닫기
  document.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal-overlay')) {
      closeAllModals();
    }
  });
}

function closeAllModals() {
  const modals = document.querySelectorAll('.modal, .modal-overlay, .maintenance-modal');
  modals.forEach(modal => {
    modal.style.display = 'none';
    modal.remove?.();
  });

  // 포커스 복원
  const lastFocused = document.querySelector('[data-last-focused]');
  if (lastFocused) {
    lastFocused.focus();
    lastFocused.removeAttribute('data-last-focused');
  }

  announceToScreenReader('모달이 닫혔습니다');
}

// ========================================
// 환영 메시지 및 정보 표시
// ========================================
function showWelcomeMessage() {
  setTimeout(() => {
    if (AppState.isLoggedIn) {
      showToast(`안녕하세요, ${AppState.currentUser?.name}님! 스마트파킹을 이용해주셔서 감사합니다.`, 'success');
    } else {
      showToast('스마트파킹에 오신 것을 환영합니다! 🚗', 'info');
    }
  }, 1000);
}

// ========================================
// 토큰 관리
// ========================================
function getStoredToken() {
  try {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  } catch (error) {
    console.error('❌ 토큰 조회 실패:', error);
    return null;
  }
}

function removeStoredToken() {
  try {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    sessionStorage.removeItem('refreshToken');
  } catch (error) {
    console.error('❌ 토큰 제거 실패:', error);
  }
}

// ========================================
// 유틸리티 함수들
// ========================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatEventTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffMinutes < 1) return '방금 전';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}시간 전`;

  return date.toLocaleDateString();
}

function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // 폴백 방법
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
}

// ========================================
// 토스트 및 로딩 시스템
// ========================================
function showToast(message, type = 'info', duration = 3000) {
  // 기존 토스트 제거
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

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
    <div class="toast-content">
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;

  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${colors[type] || colors.info};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-size: 0.95rem;
    max-width: 400px;
    transform: translateX(100%);
    transition: transform 0.3s ease-out;
  `;

  document.body.appendChild(toast);

  // 애니메이션
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 10);

  // 자동 제거
  setTimeout(() => {
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, duration);

  // 접근성
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
}

function showLoading(message = '처리중...') {
  const existing = document.querySelector('.loading-overlay');
  if (existing) existing.remove();

  const loading = document.createElement('div');
  loading.className = 'loading-overlay';
  loading.setAttribute('role', 'status');
  loading.setAttribute('aria-label', message);

  loading.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
    color: white;
    font-size: 1.2rem;
    backdrop-filter: blur(4px);
  `;

  loading.innerHTML = `
    <div class="loading-content" style="text-align: center;">
      <div class="loading-spinner" style="margin-bottom: 1rem; font-size: 2rem; animation: spin 1s linear infinite;">⏳</div>
      <div class="loading-text">${message}</div>
    </div>
  `;

  // 스피너 애니메이션 CSS 추가
  if (!document.getElementById('loading-styles')) {
    const style = document.createElement('style');
    style.id = 'loading-styles';
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(loading);
  announceToScreenReader(message);
}

function hideLoading() {
  const loading = document.querySelector('.loading-overlay');
  if (loading) {
    loading.style.opacity = '0';
    setTimeout(() => loading.remove(), 300);
    announceToScreenReader('로딩이 완료되었습니다');
  }
}

// ========================================
// 이벤트 리스너 설정
// ========================================

// 페이지 가시성 변경 감지
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && CONFIG.FEATURES.realTimeUpdates) {
    refreshRealTimeData();
  }
});

// 온라인/오프라인 상태 감지
window.addEventListener('online', () => setOfflineMode(false));
window.addEventListener('offline', () => setOfflineMode(true));

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  // 캐시 저장
  saveCacheToStorage();

  // WebSocket 연결 정리
  if (wsConnection) {
    wsConnection.close(1000, 'Page unload');
  }

  // 인터벌 정리
  stopRealTimeUpdates();

  // 분석 데이터 전송
  if (window.analyticsQueue?.length) {
    sendAnalyticsData();
  }
});

// 리사이즈 이벤트 (디바운스 적용)
window.addEventListener('resize', debounce(() => {
  // 반응형 레이아웃 조정
  updateResponsiveLayout();
}, 250));

function updateResponsiveLayout() {
  const width = window.innerWidth;

  // 모바일/데스크톱 클래스 토글
  if (width < 768) {
    document.body.classList.add('mobile');
    document.body.classList.remove('desktop');
  } else {
    document.body.classList.add('desktop');
    document.body.classList.remove('mobile');
  }

  // 가로 방향 감지
  const isLandscape = width > window.innerHeight;
  document.body.classList.toggle('landscape', isLandscape);
}

// ========================================
// 초기화 완료 로그
// ========================================
setTimeout(() => {
  console.log('🎉 스마트파킹 고급 공개 버전 완전 로드 완료!');
  console.log('📊 로드된 기능들:');
  console.log('  ✅ 실시간 데이터 업데이트');
  console.log('  ✅ WebSocket 연결');
  console.log('  ✅ 캐싱 시스템');
  console.log('  ✅ 성능 모니터링');
  console.log('  ✅ 접근성 지원');
  console.log('  ✅ 다국어 지원');
  console.log('  ✅ PWA 기능');
  console.log('  ✅ 오프라인 지원');
  console.log('👤 사용자 상태:', AppState.isLoggedIn ? '로그인됨' : '비로그인');

  if (AppState.isLoggedIn) {
    console.log('👤 사용자:', AppState.currentUser?.name);
    console.log('🎭 역할:', AppState.userRole);
  }

  console.log('🎨 테마:', AppState.theme);
  console.log('🌐 언어:', AppState.language);
  console.log('📱 알림:', AppState.preferences.notifications ? '활성화' : '비활성화');
  console.log('🔄 실시간 업데이트:', CONFIG.FEATURES.realTimeUpdates ? '활성화' : '비활성화');

  updateResponsiveLayout();
}, 2000);

// ========================================
// 전역 함수 노출
// ========================================
window.toggleFAQ = window.toggleFAQ || (() => console.warn('FAQ 기능 로딩 중...'));
window.openMap = window.openMap || (() => console.warn('지도 기능 로딩 중...'));
window.makeCall = window.makeCall || (() => console.warn('전화 기능 로딩 중...'));
window.sendEmail = window.sendEmail || (() => console.warn('이메일 기능 로딩 중...'));
window.toggleTheme = toggleTheme;
window.updateLanguage = updateLanguage;
window.AppState = AppState; // 디버깅용