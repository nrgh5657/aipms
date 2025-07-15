// 전역 변수
let signupData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  carNumber: '',
  agreeToTerms: false,
  agreeToPrivacy: false,
  agreeToMarketing: false
};

// 서버 API 설정
const API_CONFIG = {
  baseURL: 'http://localhost:8080/api/members', // 서버 URL에 맞게 수정하세요
  endpoints: {
    signup: '/register',
    checkEmail: '/check-email'
  }
};

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {

  initializeSignupPage();
  setupFormValidation();
});

// 페이지 초기화
function initializeSignupPage() {
  // 페이지 로드 애니메이션
  const elements = document.querySelectorAll('.signup-card, .service-preview, .benefits-section');
  elements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = index === 0 ? 'translateX(-30px)' : index === 1 ? 'translateX(30px)' : 'translateY(30px)';
    
    setTimeout(() => {
      el.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      el.style.opacity = '1';
      el.style.transform = 'translate(0)';
    }, 100 + (index * 150));
  });
  
  // 이름 입력 필드에 포커스
  setTimeout(() => {
    const nameInput = document.getElementById('customer-name');
    if (nameInput) nameInput.focus();
  }, 500);
}

// 폼 유효성 검사 설정
function setupFormValidation() {
  const form = document.getElementById('signup-form');
  const inputs = ['customer-name', 'customer-email', 'customer-phone', 'customer-password', 'customer-password-confirm'];
  
  inputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener('input', function() {
        validateField(this);
      });
      
      input.addEventListener('blur', function() {
        validateField(this);
        
        // 이메일 중복 체크
        if (inputId === 'customer-email' && this.value && !this.dataset.checking) {
          checkEmailDuplicate(this.value);
        }
      });
    }
  });

  // 전화번호 포맷팅
  const phoneInput = document.getElementById('customer-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      formatPhoneNumber(this);
    });
  }

  // 비밀번호 강도 체크
  const passwordInput = document.getElementById('customer-password');
  if (passwordInput) {
    passwordInput.addEventListener('input', function() {
      checkPasswordStrength(this.value);
    });
  }

  // 폼 제출 이벤트
  form.addEventListener('submit', handleSignupSubmit);
}

// 이메일 중복 체크
async function checkEmailDuplicate(email) {
  const emailInput = document.getElementById('customer-email');
  
  if (!isValidEmail(email)) return;
  
  emailInput.dataset.checking = 'true';
  
  try {
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.checkEmail}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      if (data.exists) {
        setFieldError(emailInput, '이미 사용중인 이메일입니다.');
      } else {
        setFieldSuccess(emailInput);
      }
    }
  } catch (error) {
    console.error('이메일 중복 체크 실패:', error);
    // 네트워크 오류 시에는 에러 표시하지 않음
  } finally {
    delete emailInput.dataset.checking;
  }
}

// 이메일 유효성 검사 함수
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 필드 유효성 검사
function validateField(input) {
  const value = input.value.trim();
  const fieldType = input.id.split('-')[1];
  
  clearFieldError(input);
  
  if (!value) {
    if (input.required) {
      setFieldError(input, '필수 입력 항목입니다.');
      return false;
    }
    return true;
  }
  
  switch (fieldType) {
    case 'name':
      if (value.length < 2) {
        setFieldError(input, '이름은 2자 이상이어야 합니다.');
        return false;
      }
      if (!/^[가-힣a-zA-Z\s]+$/.test(value)) {
        setFieldError(input, '이름은 한글 또는 영문만 입력 가능합니다.');
        return false;
      }
      break;
      
    case 'email':
      if (!isValidEmail(value)) {
        setFieldError(input, '올바른 이메일 주소를 입력해주세요.');
        return false;
      }
      break;
      
    case 'phone':
      const phoneRegex = /^010-\d{4}-\d{4}$/;
      if (!phoneRegex.test(value)) {
        setFieldError(input, '올바른 휴대폰 번호를 입력해주세요.');
        return false;
      }
      break;
      
    case 'password':
      if (value.length < 8) {
        setFieldError(input, '비밀번호는 8자 이상이어야 합니다.');
        return false;
      }
      if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(value)) {
        setFieldError(input, '영문자와 숫자를 모두 포함해야 합니다.');
        return false;
      }
      
      // 비밀번호 확인 필드도 함께 검사
      const confirmInput = document.getElementById('customer-password-confirm');
      if (confirmInput && confirmInput.value && value !== confirmInput.value) {
        setFieldError(confirmInput, '비밀번호가 일치하지 않습니다.');
      }
      break;
      
    case 'confirm':
      const passwordInput = document.getElementById('customer-password');
      if (passwordInput && value !== passwordInput.value) {
        setFieldError(input, '비밀번호가 일치하지 않습니다.');
        return false;
      }
      break;
  }
  
  setFieldSuccess(input);
  return true;
}

// 전화번호 포맷팅
function formatPhoneNumber(input) {
  let value = input.value.replace(/[^0-9]/g, '');
  
  if (value.length >= 3 && value.length <= 7) {
    value = value.replace(/(\d{3})(\d{1,4})/, '$1-$2');
  } else if (value.length >= 8) {
    value = value.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
  }
  
  input.value = value;
}

// 비밀번호 강도 체크
function checkPasswordStrength(password) {
  const strengthIndicator = document.getElementById('customer-password-strength');
  if (!strengthIndicator) return;
  
  if (!password) {
    strengthIndicator.classList.remove('show');
    return;
  }
  
  let strength = 0;
  let feedback = [];
  
  if (password.length >= 8) strength++;
  else feedback.push('8자 이상');
  
  if (/[A-Z]/.test(password)) strength++;
  else feedback.push('대문자');
  
  if (/[a-z]/.test(password)) strength++;
  else feedback.push('소문자');
  
  if (/[0-9]/.test(password)) strength++;
  else feedback.push('숫자');
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  else feedback.push('특수문자');
  
  strengthIndicator.classList.remove('weak', 'medium', 'strong');
  strengthIndicator.classList.add('show');
  
  if (strength <= 2) {
    strengthIndicator.classList.add('weak');
    strengthIndicator.textContent = `약함 - 개선사항: ${feedback.join(', ')}`;
  } else if (strength <= 4) {
    strengthIndicator.classList.add('medium');
    strengthIndicator.textContent = `보통 - 추가 권장: ${feedback.join(', ')}`;
  } else {
    strengthIndicator.classList.add('strong');
    strengthIndicator.textContent = '강함 - 안전한 비밀번호입니다!';
  }
}

// 필드 에러 설정
function setFieldError(input, message) {
  input.style.borderColor = '#e53e3e';
  input.style.boxShadow = '0 0 0 3px rgba(229, 62, 62, 0.1)';
  
  // 기존 에러 메시지 제거
  const existingError = input.parentNode.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  input.parentNode.appendChild(errorDiv);
}

// 필드 성공 설정
function setFieldSuccess(input) {
  input.style.borderColor = '#48bb78';
  input.style.boxShadow = '0 0 0 3px rgba(72, 187, 120, 0.1)';
}

// 필드 에러 제거
function clearFieldError(input) {
  input.style.borderColor = '#e2e8f0';
  input.style.boxShadow = 'none';
  
  const errorDiv = input.parentNode.querySelector('.field-error');
  if (errorDiv) {
    errorDiv.remove();
  }
}

// 비밀번호 표시/숨김 토글
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const button = input.nextElementSibling;
  
  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '🙈';
  } else {
    input.type = 'password';
    button.textContent = '👁️';
  }
}

// 회원가입 제출 처리 (서버 통신)
async function handleSignupSubmit(event) {
  event.preventDefault();
  
  // 폼 데이터 수집
  const formData = new FormData(event.target);
  const data = Object.fromEntries(formData);
  
  // 체크박스 확인
  const termsService = document.getElementById('terms-service').checked;
  const termsPrivacy = document.getElementById('terms-privacy').checked;
  const termsMarketing = document.getElementById('terms-marketing').checked;
  
  // 필수 약관 동의 확인
  if (!termsService || !termsPrivacy) {
    showToast('필수 약관에 동의해주세요.', 'error');
    return;
  }
  
  // 유효성 검사
  const inputs = ['customer-name', 'customer-email', 'customer-phone', 'customer-password', 'customer-password-confirm'];
  let isValid = true;
  
  inputs.forEach(inputId => {
    const input = document.getElementById(inputId);
    if (!validateField(input)) {
      isValid = false;
    }
  });
  
  if (!isValid) {
    showToast('입력 정보를 확인해주세요.', 'error');
    return;
  }
  
  // 로딩 상태 표시
  showLoading(true);
  
  // 서버로 전송할 데이터 구성
  const signupData = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: data.password,
    carNumber: data.carNumber || null,
    agreeToTerms: termsService,
    agreeToPrivacy: termsPrivacy,
    agreeToMarketing: termsMarketing,
    registrationDate: new Date().toISOString()
  };
  
  try {
    // 서버에 회원가입 요청
    const response = await fetch(`${API_CONFIG.baseURL}${API_CONFIG.endpoints.signup}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(signupData)
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      // 성공 처리
      showLoading(false);
      showSuccessModal();
      
      // 성공 시 로컬 스토리지에도 저장 (선택사항)
      const memberData = {
        ...signupData,
        id: responseData.userId || signupData.email.split('@')[0]
      };
      
      const members = JSON.parse(localStorage.getItem('members') || '[]');
      members.push(memberData);
      localStorage.setItem('members', JSON.stringify(members));
      
      showToast('회원가입이 완료되었습니다!', 'success');
      
    } else {
      // 서버 에러 처리
      showLoading(false);
      
      if (response.status === 409) {
        // 이메일 중복
        showToast('이미 사용중인 이메일입니다.', 'error');
        const emailInput = document.getElementById('customer-email');
        setFieldError(emailInput, '이미 사용중인 이메일입니다.');
      } else if (response.status === 422) {
        // 유효성 검사 오류
        showToast(responseData.message || '입력 정보를 확인해주세요.', 'error');
        
        // 서버에서 반환한 필드별 에러 처리
        if (responseData.errors) {
          Object.entries(responseData.errors).forEach(([field, message]) => {
            const input = document.getElementById(`customer-${field}`);
            if (input) {
              setFieldError(input, message);
            }
          });
        }
      } else {
        // 기타 서버 에러
        showToast(responseData.message || '회원가입 중 오류가 발생했습니다.', 'error');
      }
    }
    
  } catch (error) {
    // 네트워크 에러 처리
    showLoading(false);
    console.error('회원가입 요청 실패:', error);
    
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      showToast('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.', 'error');
    } else {
      showToast('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
  }
}

// 로딩 상태 표시
function showLoading(show) {
  const overlay = document.getElementById('loading-overlay');
  const button = document.querySelector('.signup-btn');
  const btnText = button.querySelector('.btn-text');
  const btnLoading = button.querySelector('.btn-loading');
  
  if (show) {
    overlay.style.display = 'flex';
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    button.disabled = true;
    
    // 로딩 텍스트 업데이트
    const loadingText = document.getElementById('loading-text');
    if (loadingText) {
      loadingText.textContent = '서버에 요청 중...';
    }
  } else {
    overlay.style.display = 'none';
    btnText.style.display = 'block';
    btnLoading.style.display = 'none';
    button.disabled = false;
  }
}

// 성공 모달 표시
function showSuccessModal() {
  const modal = document.getElementById('success-modal');
  modal.style.display = 'flex';
  
  // 성공 사운드 효과
  playSuccessSound();
}

// 토스트 메시지 표시
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };
  
  toast.innerHTML = `
    <span>${icons[type] || icons.info}</span>
    ${message}
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// 성공 사운드 효과
function playSuccessSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('사운드 재생 실패:', e);
  }
}

// 약관 모달 표시
function showTermsModal() {
  showModal('서비스 이용약관', `
    <div style="max-height: 300px; overflow-y: auto; text-align: left; line-height: 1.6;">
      <h4>제1조 (목적)</h4>
      <p>본 약관은 스마트파킹 서비스 이용에 관한 조건 및 절차를 규정합니다.</p>
      
      <h4>제2조 (서비스 이용)</h4>
      <p>회원은 서비스를 선량한 관리자의 주의로 이용해야 합니다.</p>
      
      <h4>제3조 (개인정보보호)</h4>
      <p>회사는 관련 법령에 따라 회원의 개인정보를 보호합니다.</p>
      
      <h4>제4조 (서비스 제한)</h4>
      <p>회사는 필요시 서비스 이용을 제한할 수 있습니다.</p>
    </div>
  `);
}

function showPrivacyModal() {
  showModal('개인정보 처리방침', `
    <div style="max-height: 300px; overflow-y: auto; text-align: left; line-height: 1.6;">
      <h4>1. 개인정보의 처리목적</h4>
      <p>회원가입, 서비스 제공, 고객상담을 위해 개인정보를 처리합니다.</p>
      
      <h4>2. 처리하는 개인정보 항목</h4>
      <p>필수: 이름, 이메일, 휴대폰번호<br>선택: 차량번호</p>
      
      <h4>3. 개인정보의 처리 및 보유기간</h4>
      <p>회원탈퇴 시까지 또는 법령에서 정한 기간까지 보유합니다.</p>
      
      <h4>4. 개인정보의 제3자 제공</h4>
      <p>원칙적으로 개인정보를 제3자에게 제공하지 않습니다.</p>
    </div>
  `);
}

function showMarketingModal() {
  showModal('마케팅 정보 수신 동의', `
    <div style="max-height: 300px; overflow-y: auto; text-align: left; line-height: 1.6;">
      <h4>마케팅 정보 수신 동의 (선택)</h4>
      <p>스마트파킹의 다양한 혜택과 이벤트 정보를 받아보실 수 있습니다.</p>
      
      <h4>수신 내용</h4>
      <ul>
        <li>할인 쿠폰 및 이벤트 정보</li>
        <li>신규 서비스 안내</li>
        <li>맞춤형 추천 정보</li>
      </ul>
      
      <h4>수신 방법</h4>
      <p>이메일, SMS, 앱 푸시 알림</p>
      
      <p><strong>※ 마케팅 정보 수신에 동의하지 않아도 서비스 이용에는 제한이 없습니다.</strong></p>
    </div>
  `);
}

// 범용 모달 표시
function showModal(title, content) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${title}</h3>
      ${content}
      <div class="success-actions">
        <button type="button" class="modal-btn" onclick="this.closest('.modal').remove()">확인</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // 모달 외부 클릭으로 닫기
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// 페이지 이동 함수들
function goToMainPage() {
  showToast('메인 페이지로 이동합니다.', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

function goToLoginPage() {
  showToast('로그인 페이지로 이동합니다.', 'info');
  setTimeout(() => {
    window.location.href = '/member/login';
  }, 1000);
}

function goToLogin() {
  document.getElementById('success-modal').style.display = 'none';
  goToLoginPage();
}