// ========================================
// 유틸리티 함수들 (common/utils.js)
// ========================================

// ========================================
// 날짜/시간 관련 유틸리티
// ========================================

/**
 * 날짜를 한국어 형식으로 포맷팅
 * @param {string|Date} date - 날짜
 * @param {string} format - 포맷 ('YYYY-MM-DD', 'YYYY.MM.DD', 'MM/DD')
 * @returns {string} 포맷된 날짜
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '-';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  switch (format) {
    case 'YYYY.MM.DD':
      return `${year}.${month}.${day}`;
    case 'MM/DD':
      return `${month}/${day}`;
    case 'YYYY년 MM월 DD일':
      return `${year}년 ${month}월 ${day}일`;
    default:
      return `${year}-${month}-${day}`;
  }
}

/**
 * 날짜와 시간을 한국어 형식으로 포맷팅
 * @param {string|Date} datetime - 날짜시간
 * @returns {string} 포맷된 날짜시간
 */
function formatDateTime(datetime) {
  if (!datetime) return '-';

  const d = new Date(datetime);
  if (isNaN(d.getTime())) return '-';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 상대 시간 표시 (예: 3분 전, 2시간 전)
 * @param {string|Date} date - 날짜
 * @returns {string} 상대 시간
 */
function getRelativeTime(date) {
  if (!date) return '-';

  const d = new Date(date);
  const now = new Date();
  const diff = now - d;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}일 전`;
  if (hours > 0) return `${hours}시간 전`;
  if (minutes > 0) return `${minutes}분 전`;
  return '방금 전';
}

// ========================================
// 숫자/통화 관련 유틸리티
// ========================================

/**
 * 숫자를 한국 통화 형식으로 포맷팅
 * @param {number} amount - 금액
 * @param {boolean} showCurrency - 원화 기호 표시 여부
 * @returns {string} 포맷된 금액
 */
function formatCurrency(amount, showCurrency = true) {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';

  const formatted = new Intl.NumberFormat('ko-KR').format(amount);
  return showCurrency ? `₩${formatted}` : formatted;
}

/**
 * 숫자를 천 단위로 구분하여 포맷팅
 * @param {number} number - 숫자
 * @returns {string} 포맷된 숫자
 */
function formatNumber(number) {
  if (number === null || number === undefined || isNaN(number)) return '-';
  return new Intl.NumberFormat('ko-KR').format(number);
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 포맷팅
 * @param {number} bytes - 바이트 크기
 * @returns {string} 포맷된 크기
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

// ========================================
// 문자열 관련 유틸리티
// ========================================

/**
 * 문자열 자르기 (말줄임표 추가)
 * @param {string} str - 문자열
 * @param {number} length - 최대 길이
 * @returns {string} 자른 문자열
 */
function truncateString(str, length = 20) {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
}

/**
 * 전화번호 포맷팅
 * @param {string} phone - 전화번호
 * @returns {string} 포맷된 전화번호
 */
function formatPhoneNumber(phone) {
  if (!phone) return '';

  // 숫자만 추출
  const numbers = phone.replace(/\D/g, '');

  // 010-1234-5678 형식으로 포맷팅
  if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }

  return phone;
}

/**
 * 차량번호 포맷팅
 * @param {string} carNumber - 차량번호
 * @returns {string} 포맷된 차량번호
 */
function formatCarNumber(carNumber) {
  if (!carNumber) return '';

  // 기본적으로 입력된 값 그대로 반환 (유효성 검사는 별도)
  return carNumber.replace(/\s/g, '');
}

/**
 * 이름 마스킹 (개인정보 보호)
 * @param {string} name - 이름
 * @returns {string} 마스킹된 이름
 */
function maskName(name) {
  if (!name || name.length < 2) return name;

  if (name.length === 2) {
    return name.charAt(0) + '*';
  }

  return name.charAt(0) + '*'.repeat(name.length - 2) + name.charAt(name.length - 1);
}

/**
 * 이메일 마스킹
 * @param {string} email - 이메일
 * @returns {string} 마스킹된 이메일
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return email;

  const [local, domain] = email.split('@');
  const maskedLocal = local.length > 2
      ? local.charAt(0) + '*'.repeat(local.length - 2) + local.charAt(local.length - 1)
      : local.charAt(0) + '*';

  return `${maskedLocal}@${domain}`;
}

// ========================================
// 유효성 검사 유틸리티
// ========================================

/**
 * 이메일 유효성 검사
 * @param {string} email - 이메일
 * @returns {boolean} 유효성
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * 전화번호 유효성 검사
 * @param {string} phone - 전화번호
 * @returns {boolean} 유효성
 */
function validatePhone(phone) {
  const re = /^01[0-9]-\d{4}-\d{4}$/;
  return re.test(phone);
}

/**
 * 차량번호 유효성 검사
 * @param {string} carNumber - 차량번호
 * @returns {boolean} 유효성
 */
function validateCarNumber(carNumber) {
  const re = /^\d{2,3}[가-힣]\d{4}$/;
  return re.test(carNumber);
}

/**
 * 비밀번호 강도 검사
 * @param {string} password - 비밀번호
 * @returns {object} 검사 결과
 */
function validatePassword(password) {
  const result = {
    isValid: false,
    score: 0,
    message: '',
    requirements: {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    }
  };

  // 점수 계산
  Object.values(result.requirements).forEach(req => {
    if (req) result.score++;
  });

  // 메시지 생성
  if (result.score < 3) {
    result.message = '약함';
  } else if (result.score < 4) {
    result.message = '보통';
  } else if (result.score < 5) {
    result.message = '강함';
  } else {
    result.message = '매우 강함';
  }

  result.isValid = result.requirements.length &&
      result.requirements.lowercase &&
      result.requirements.number &&
      result.requirements.special;

  return result;
}

// ========================================
// DOM 관련 유틸리티
// ========================================

/**
 * 요소의 값 업데이트
 * @param {string} id - 요소 ID
 * @param {string} value - 값
 */
function updateElement(id, value) {
  const element = document.getElementById(id);
  if (!element) return;

  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    element.value = value || '';
  } else {
    element.textContent = value || '';
  }
}

/**
 * 요소의 값 가져오기
 * @param {string} id - 요소 ID
 * @returns {string} 값
 */
function getElementValue(id) {
  const element = document.getElementById(id);
  if (!element) return '';

  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    return element.value.trim();
  }

  return element.textContent.trim();
}

/**
 * 여러 요소에 같은 값 설정
 * @param {string[]} ids - 요소 ID 배열
 * @param {string} value - 값
 */
function updateElements(ids, value) {
  ids.forEach(id => updateElement(id, value));
}

/**
 * 폼 데이터를 객체로 변환
 * @param {HTMLFormElement} form - 폼 요소
 * @returns {object} 폼 데이터 객체
 */
function formToObject(form) {
  const formData = new FormData(form);
  const object = {};

  for (let [key, value] of formData.entries()) {
    object[key] = value;
  }

  return object;
}

/**
 * 객체를 폼에 채우기
 * @param {HTMLFormElement} form - 폼 요소
 * @param {object} data - 데이터 객체
 */
function objectToForm(form, data) {
  Object.keys(data).forEach(key => {
    const element = form.querySelector(`[name="${key}"]`);
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = !!data[key];
      } else {
        element.value = data[key] || '';
      }
    }
  });
}

// ========================================
// 배열/객체 관련 유틸리티
// ========================================

/**
 * 배열에서 중복 제거
 * @param {Array} array - 배열
 * @returns {Array} 중복 제거된 배열
 */
function uniqueArray(array) {
  return [...new Set(array)];
}

/**
 * 객체 깊은 복사
 * @param {object} obj - 객체
 * @returns {object} 복사된 객체
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));

  const cloned = {};
  Object.keys(obj).forEach(key => {
    cloned[key] = deepClone(obj[key]);
  });

  return cloned;
}

/**
 * 객체가 비어있는지 확인
 * @param {object} obj - 객체
 * @returns {boolean} 비어있는지 여부
 */
function isEmpty(obj) {
  if (obj === null || obj === undefined) return true;
  if (typeof obj === 'string') return obj.trim() === '';
  if (Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
}

// ========================================
// 기타 유틸리티
// ========================================

/**
 * 딜레이 함수
 * @param {number} ms - 밀리초
 * @returns {Promise} 프로미스
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 디바운스 함수
 * @param {Function} func - 실행할 함수
 * @param {number} wait - 대기 시간 (밀리초)
 * @returns {Function} 디바운스된 함수
 */
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

/**
 * 스로틀 함수
 * @param {Function} func - 실행할 함수
 * @param {number} limit - 제한 시간 (밀리초)
 * @returns {Function} 스로틀된 함수
 */
function throttle(func, limit) {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 랜덤 ID 생성
 * @param {number} length - 길이
 * @returns {string} 랜덤 ID
 */
function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * URL 파라미터 파싱
 * @returns {object} 파라미터 객체
 */
function getUrlParams() {
  const params = {};
  const urlSearchParams = new URLSearchParams(window.location.search);
  for (const [key, value] of urlSearchParams) {
    params[key] = value;
  }
  return params;
}

//로그아웃
function logout() {
  const logoutForm = document.getElementById('logoutForm');
  if (logoutForm) {
    logoutForm.submit();
  } else {
    console.error('로그아웃 폼이 존재하지 않습니다.');
  }
}

/**
 * 클립보드에 텍스트 복사
 * @param {string} text - 복사할 텍스트
 * @returns {Promise} 프로미스
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // 폴백: 임시 textarea 사용
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  }
}

// ========================================
// 전역 함수 노출
// ========================================
window.utils = {
  // 날짜/시간
  formatDate,
  formatDateTime,
  getRelativeTime,

  // 숫자/통화
  formatCurrency,
  formatNumber,
  formatFileSize,

  // 문자열
  truncateString,
  formatPhoneNumber,
  formatCarNumber,
  maskName,
  maskEmail,

  // 유효성 검사
  validateEmail,
  validatePhone,
  validateCarNumber,
  validatePassword,

  // DOM
  updateElement,
  getElementValue,
  updateElements,
  formToObject,
  objectToForm,

  // 배열/객체
  uniqueArray,
  deepClone,
  isEmpty,

  // 기타
  delay,
  debounce,
  throttle,
  generateId,
  getUrlParams,
  copyToClipboard
};