// 전역 변수
let currentUserType = null; // 'customer' or 'admin'
let pendingAdminLogin = false;
let currentPage = 'login'; // 'login' or 'signup'

// 회원가입 폼 데이터
let signupData = {
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  userType: 'customer',
  agreeToTerms: false
};

// DOM 로드 완료 시 초기화
document.addEventListener('DOMContentLoaded', function() {
  initializeLoginPage();
  checkAutoLogin();
  setupFormValidation();
  setupKeyboardShortcuts();
  setupSignupValidation();
});

// 페이지 초기화
function initializeLoginPage() {
  // 페이지 로드 애니메이션
  const elements = document.querySelectorAll('.login-card, .service-preview, .demo-notice');
  elements.forEach((el, index) => {
    el.style.opacity = '0';
    el.style.transform = index === 0 ? 'translateX(-30px)' : index === 1 ? 'translateX(30px)' : 'translateY(30px)';
    
    setTimeout(() => {
      el.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      el.style.opacity = '1';
      el.style.transform = 'translate(0)';
    }, 100 + (index * 150));
  });
  
  // 포커스를 아이디 입력 필드로
  setTimeout(() => {
    const idInput = document.getElementById('unified-id') || document.getElementById('signup-name');
    if (idInput) idInput.focus();
  }, 500);
}

// === 페이지 전환 함수들 ===
function showSignupPage() {
  console.log('회원가입 페이지로 전환');
  currentPage = 'signup';
  
  // 로그인 폼 숨기기
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.style.display = 'none';
  }
  
  // 회원가입 폼 보이기  
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.style.display = 'block';
  }
  
  // 페이지 전환 애니메이션
  animatePageTransition('signup');
  
  // 첫 번째 입력 필드에 포커스
  setTimeout(() => {
    const nameInput = document.getElementById('signup-name');
    if (nameInput) nameInput.focus();
  }, 300);
}

function showLoginPage() {
  console.log('로그인 페이지로 전환');
  currentPage = 'login';
  
  // 회원가입 폼 숨기기
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.style.display = 'none';
  }
  
  // 로그인 폼 보이기
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.style.display = 'block';
  }
  
  // 페이지 전환 애니메이션
  animatePageTransition('login');
  
  // 아이디 입력 필드에 포커스
  setTimeout(() => {
    const idInput = document.getElementById('unified-id');
    if (idInput) idInput.focus();
  }, 300);
}

function animatePageTransition(targetPage) {
  const container = document.querySelector('.container') || document.body;
  
  // 페이드 아웃
  container.style.opacity = '0.7';
  container.style.transform = 'scale(0.98)';
  
  setTimeout(() => {
    // 페이드 인
    container.style.transition = 'all 0.4s ease-out';
    container.style.opacity = '1';
    container.style.transform = 'scale(1)';
  }, 200);
}

// === 회원가입 폼 처리 ===
function handleSignupFormChange(field, value) {
  signupData[field] = value;
  
  // 실시간 유효성 검사
  validateSignupField(field, value);
  
  // 사용자 타입 감지 (이메일 기반)
  if (field === 'email') {
    detectSignupUserType(value);
  }
}

function validateSignupField(field, value) {
  const input = document.getElementById(`signup-${field}`);
  if (!input) return;
  
  let isValid = true;
  let errorMessage = '';
  
  switch (field) {
    case 'name':
      if (value.length < 2) {
        isValid = false;
        errorMessage = '이름은 2자 이상이어야 합니다.';
      } else if (!/^[가-힣a-zA-Z\s]+$/.test(value)) {
        isValid = false;
        errorMessage = '이름은 한글 또는 영문만 입력 가능합니다.';
      }
      break;
      
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = '올바른 이메일 주소를 입력해주세요.';
      } else if (isEmailExists(value)) {
        isValid = false;
        errorMessage = '이미 등록된 이메일입니다.';
      }
      break;
      
    case 'phone':
      const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
      if (!phoneRegex.test(value.replace(/[^0-9]/g, ''))) {
        isValid = false;
        errorMessage = '올바른 휴대폰 번호를 입력해주세요.';
      }
      break;
      
    case 'password':
      if (value.length < 6) {
        isValid = false;
        errorMessage = '비밀번호는 6자 이상이어야 합니다.';
      } else if (!/(?=.*[a-zA-Z])(?=.*[0-9])/.test(value)) {
        isValid = false;
        errorMessage = '영문자와 숫자를 모두 포함해야 합니다.';
      }
      
      // 비밀번호 확인 필드도 함께 검사
      if (signupData.confirmPassword && value !== signupData.confirmPassword) {
        const confirmInput = document.getElementById('signup-confirmPassword');
        if (confirmInput) {
          setFieldError(confirmInput, '비밀번호가 일치하지 않습니다.');
        }
      }
      break;
      
    case 'confirmPassword':
      if (value !== signupData.password) {
        isValid = false;
        errorMessage = '비밀번호가 일치하지 않습니다.';
      }
      break;
  }
  
  if (isValid) {
    setFieldSuccess(input);
  } else {
    setFieldError(input, errorMessage);
  }
  
  return isValid;
}

function detectSignupUserType(email) {
  const adminDomains = ['admin.com', 'manager.com', 'company.com'];
  const adminKeywords = ['admin', 'manager', 'supervisor', 'operator'];
  
  const isAdminEmail = adminDomains.some(domain => email.includes(domain)) ||
                      adminKeywords.some(keyword => email.toLowerCase().includes(keyword));
  
  signupData.userType = isAdminEmail ? 'admin' : 'customer';
  
  // UI 업데이트
  updateSignupUserTypeIndicator(signupData.userType);
}

function updateSignupUserTypeIndicator(userType) {
  const indicator = document.getElementById('signup-user-type-indicator');
  if (!indicator) return;
  
  indicator.classList.remove('show', 'customer', 'admin');
  
  if (userType === 'admin') {
    indicator.textContent = '🛡️ 관리자 계정으로 등록됩니다';
    indicator.classList.add('show', 'admin');
  } else {
    indicator.textContent = '👤 고객 계정으로 등록됩니다';
    indicator.classList.add('show', 'customer');
  }
}

function isEmailExists(email) {
  // 기존 계정 목록에서 이메일 중복 확인
  const existingAccounts = [
    'customer@test.com',
    'admin@test.com',
    'manager@company.com',
    'test@test.com'
  ];
  
  return existingAccounts.includes(email.toLowerCase());
}

function isSignupFormValid() {
  const requiredFields = ['name', 'email', 'phone', 'password', 'confirmPassword'];
  
  // 모든 필드 유효성 검사
  let allValid = true;
  requiredFields.forEach(field => {
    if (!validateSignupField(field, signupData[field])) {
      allValid = false;
    }
  });
  
  // 이용약관 동의 확인
  if (!signupData.agreeToTerms) {
    showToast('이용약관에 동의해주세요.', 'error');
    allValid = false;
  }
  
  return allValid;
}

// === 간단한 회원가입 처리 (바로 로그인 페이지 이동) ===
function handleSignupSubmit(event) {
  // 폼 제출 기본 동작 완전 차단
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  console.log('회원가입 버튼 클릭됨');
  
  // 간단한 유효성 검사
  const name = document.getElementById('signup-name')?.value.trim() || '';
  const email = document.getElementById('signup-email')?.value.trim() || '';
  const phone = document.getElementById('signup-phone')?.value.trim() || '';
  const password = document.getElementById('signup-password')?.value || '';
  const confirmPassword = document.getElementById('signup-confirmPassword')?.value || '';
  const agreeToTerms = document.getElementById('signup-agree')?.checked || false;
  
  // 필수 필드 체크
  if (!name) {
    showToast('이름을 입력해주세요.', 'error');
    return false;
  }
  
  if (!email) {
    showToast('이메일을 입력해주세요.', 'error');
    return false;
  }
  
  if (!phone) {
    showToast('전화번호를 입력해주세요.', 'error');
    return false;
  }
  
  if (!password) {
    showToast('비밀번호를 입력해주세요.', 'error');
    return false;
  }
  
  if (password !== confirmPassword) {
    showToast('비밀번호가 일치하지 않습니다.', 'error');
    return false;
  }
  
  if (!agreeToTerms) {
    showToast('이용약관에 동의해주세요.', 'error');
    return false;
  }
  
  // 회원가입 데이터 저장
  const newAccount = {
    id: email.split('@')[0], // 이메일의 @ 앞부분을 ID로 사용
    email: email,
    name: name,
    phone: phone,
    password: password,
    userType: email.toLowerCase().includes('admin') || email.toLowerCase().includes('manager') ? 'admin' : 'customer',
    registrationDate: new Date().toISOString(),
    isActive: true
  };
  
  // 기존 계정 목록 가져오기
  const existingAccounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
  
  // 새 계정 추가
  existingAccounts.push(newAccount);
  
  // 로컬 스토리지에 저장
  localStorage.setItem('registeredAccounts', JSON.stringify(existingAccounts));
  
  // 성공 메시지
  showToast(`환영합니다, ${name}님! 회원가입이 완료되었습니다.`, 'success');
  
  // 1초 후 로그인 페이지로 이동
  setTimeout(() => {
    moveToLoginPageAfterSignup(newAccount);
  }, 1000);
  
  return false;
}

// 회원가입 후 로그인 페이지로 이동
function moveToLoginPageAfterSignup(accountData) {
  // 회원가입 폼 숨기기
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.style.display = 'none';
  }
  
  // 로그인 폼 보이기
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.style.display = 'block';
  }
  
  // 현재 페이지 상태 변경
  currentPage = 'login';
  
  // 가입한 아이디를 로그인 폼에 미리 입력
  const idInput = document.getElementById('unified-id');
  if (idInput && accountData.id) {
    idInput.value = accountData.id;
    
    // 사용자 타입 감지
    detectUserType(accountData.id);
  }
  
  // 안내 메시지
  showToast('등록된 계정으로 로그인해주세요.', 'info');
  
  // 비밀번호 필드에 포커스
  setTimeout(() => {
    const passwordInput = document.getElementById('unified-password');
    if (passwordInput) {
      passwordInput.focus();
    }
  }, 500);
}

function processSignup() {
  try {
    // 실제로는 서버에 회원가입 요청을 보내는 부분
    
    // 새 계정을 로컬 스토리지에 저장 (데모용)
    const newAccount = {
      id: signupData.email.split('@')[0], // 이메일의 @ 앞부분을 ID로 사용
      email: signupData.email,
      name: signupData.name,
      phone: signupData.phone,
      password: signupData.password,
      userType: signupData.userType,
      registrationDate: new Date().toISOString(),
      isActive: true
    };
    
    // 기존 계정 목록 가져오기
    const existingAccounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
    
    // 새 계정 추가
    existingAccounts.push(newAccount);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('registeredAccounts', JSON.stringify(existingAccounts));
    
    return true;
  } catch (error) {
    console.error('회원가입 처리 중 오류:', error);
    return false;
  }
}

function handleSignupSuccess() {
  // 성공 모달 표시
  const successModal = showSignupSuccessModal();
  
  // 성공 사운드 효과
  playSuccessSound();
  
  // 3초 후 로그인 페이지로 이동
  setTimeout(() => {
    closeSignupSuccessModal();
    moveToLoginAfterSignup();
  }, 3000);
}

function showSignupSuccessModal() {
  const modal = document.createElement('div');
  modal.id = 'signup-success-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease-out;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white;
    padding: 3rem;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    max-width: 400px;
    animation: slideUp 0.4s ease-out;
  `;
  
  content.innerHTML = `
    <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
    <h2 style="color: #48bb78; margin-bottom: 1rem;">회원가입 완료!</h2>
    <p style="color: #666; margin-bottom: 2rem;">
      환영합니다, ${signupData.name}님!<br>
      잠시 후 로그인 페이지로 이동합니다.
    </p>
    <div style="width: 100%; height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden;">
      <div style="width: 0%; height: 100%; background: #48bb78; border-radius: 2px; animation: progressBar 3s linear;"></div>
    </div>
  `;
  
  // 애니메이션 추가
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(30px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes progressBar {
      from { width: 0%; }
      to { width: 100%; }
    }
  `;
  document.head.appendChild(style);
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  return modal;
}

function closeSignupSuccessModal() {
  const modal = document.getElementById('signup-success-modal');
  if (modal) {
    modal.remove();
  }
}

function moveToLoginAfterSignup() {
  // 회원가입 폼 초기화
  resetSignupForm();
  
  // 로그인 페이지로 전환
  showLoginPage();
  
  // 가입한 이메일을 로그인 폼에 미리 입력
  const idInput = document.getElementById('unified-id');
  if (idInput && signupData.email) {
    const userId = signupData.email.split('@')[0];
    idInput.value = userId;
    
    // 사용자 타입 감지
    detectUserType(userId);
  }
  
  // 성공 메시지 표시
  showToast('회원가입이 완료되었습니다. 로그인해주세요.', 'success');
  
  // 비밀번호 필드에 포커스
  setTimeout(() => {
    const passwordInput = document.getElementById('unified-password');
    if (passwordInput) {
      passwordInput.focus();
    }
  }, 500);
}

function handleSignupFailure(message) {
  showToast(message, 'error');
  
  // 폼 흔들기 애니메이션
  const form = document.getElementById('signup-form');
  if (form) {
    form.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
      form.style.animation = '';
    }, 500);
  }
}

function resetSignupForm() {
  // 폼 데이터 초기화
  signupData = {
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    userType: 'customer',
    agreeToTerms: false
  };
  
  // 입력 필드 초기화
  const fields = ['name', 'email', 'phone', 'password', 'confirmPassword'];
  fields.forEach(field => {
    const input = document.getElementById(`signup-${field}`);
    if (input) {
      input.value = '';
      clearFieldStatus(input);
    }
  });
  
  // 체크박스 초기화
  const agreeCheckbox = document.getElementById('signup-agree');
  if (agreeCheckbox) {
    agreeCheckbox.checked = false;
  }
  
  // 사용자 타입 인디케이터 숨기기
  const indicator = document.getElementById('signup-user-type-indicator');
  if (indicator) {
    indicator.classList.remove('show', 'customer', 'admin');
  }
}

function setSignupLoadingState(isLoading) {
  const btn = document.getElementById('signup-btn');
  if (!btn) return;
  
  const btnText = btn.querySelector('.btn-text') || btn;
  const btnLoading = btn.querySelector('.btn-loading');
  
  if (isLoading) {
    if (btnText !== btn) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'flex';
    btn.disabled = true;
    btn.style.cursor = 'not-allowed';
    
    // 폼 비활성화
    const inputs = document.querySelectorAll('#signup-form input');
    inputs.forEach(input => input.disabled = true);
  } else {
    if (btnText !== btn) btnText.style.display = 'block';
    if (btnLoading) btnLoading.style.display = 'none';
    btn.disabled = false;
    btn.style.cursor = 'pointer';
    
    // 폼 활성화
    const inputs = document.querySelectorAll('#signup-form input');
    inputs.forEach(input => input.disabled = false);
  }
}

// === 회원가입 폼 유효성 검사 설정 ===
function setupSignupValidation() {
  const signupFields = ['name', 'email', 'phone', 'password', 'confirmPassword'];
  
  signupFields.forEach(field => {
    const input = document.getElementById(`signup-${field}`);
    if (!input) return;
    
    input.addEventListener('input', function() {
      const value = this.value;
      handleSignupFormChange(field, value);
    });
    
    input.addEventListener('blur', function() {
      validateSignupField(field, this.value);
    });
    
    // Enter 키 처리
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const nextInput = getNextSignupInput(field);
        if (nextInput) {
          nextInput.focus();
        } else {
          // 마지막 필드에서 Enter 시 회원가입 버튼 클릭
          const signupBtn = document.getElementById('signup-btn');
          if (signupBtn && !signupBtn.disabled) {
            handleSignupSubmit();
          }
        }
      }
    });
  });
  
  // 약관 동의 체크박스
  const agreeCheckbox = document.getElementById('signup-agree');
  if (agreeCheckbox) {
    agreeCheckbox.addEventListener('change', function() {
      signupData.agreeToTerms = this.checked;
    });
  }
  
  // 회원가입 폼 이벤트 리스너 추가
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignupSubmit);
  }
  
  // 회원가입 버튼 직접 클릭 이벤트
  const signupBtn = document.getElementById('signup-btn');
  if (signupBtn) {
    signupBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      handleSignupSubmit(e);
    });
  }
}

function getNextSignupInput(currentField) {
  const fieldOrder = ['name', 'email', 'phone', 'password', 'confirmPassword'];
  const currentIndex = fieldOrder.indexOf(currentField);
  
  if (currentIndex < fieldOrder.length - 1) {
    const nextField = fieldOrder[currentIndex + 1];
    return document.getElementById(`signup-${nextField}`);
  }
  
  return null;
}

// === 비밀번호 토글 (회원가입용) ===
function toggleSignupPassword(field) {
  const input = document.getElementById(`signup-${field}`);
  const icon = document.getElementById(`${field}-icon`);
  
  if (!input || !icon) return;
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = '🙈';
  } else {
    input.type = 'password';
    icon.textContent = '👁️';
  }
}

// === 기존 로그인 코드에 회원가입 계정 검증 추가 ===
function validateCredentials(id, password, userType) {
  // 기본 계정들
  const defaultAccounts = {
    customer: [
      { id: 'customer', password: '1234' },
      { id: 'test', password: 'test' },
      { id: 'demo', password: 'demo' },
      { id: 'user', password: 'user' },
      { id: 'guest', password: 'guest' }
    ],
    admin: [
      { id: 'admin', password: 'admin' },
      { id: 'manager', password: '1234' },
      { id: 'supervisor', password: 'super' },
      { id: 'security', password: 'security' },
      { id: 'system', password: 'system' },
      { id: 'operator', password: 'operator' }
    ]
  };
  
  // 회원가입으로 등록된 계정들
  const registeredAccounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
  
  // 기본 계정 확인
  const defaultValid = defaultAccounts[userType]?.some(account => 
    account.id === id && account.password === password
  );
  
  if (defaultValid) return true;
  
  // 등록된 계정 확인
  const registeredValid = registeredAccounts.some(account => 
    (account.id === id || account.email.split('@')[0] === id) && 
    account.password === password &&
    account.userType === userType &&
    account.isActive
  );
  
  return registeredValid;
}

// === 사용자 타입 감지 (기존 함수 수정) ===
function detectUserType(userId) {
  const indicator = document.getElementById('user-type-indicator');
  const loginCard = document.getElementById('login-card');
  const servicePreview = document.getElementById('service-preview');
  const loginBtn = document.getElementById('login-btn');
  const customerPreview = document.getElementById('customer-preview');
  const adminPreview = document.getElementById('admin-preview');
  const idInput = document.getElementById('unified-id');
  
  // 초기화
  if (indicator) indicator.classList.remove('show', 'customer', 'admin');
  if (loginCard) loginCard.classList.remove('customer-mode', 'admin-mode');
  if (servicePreview) servicePreview.classList.remove('customer-mode', 'admin-mode');
  if (loginBtn) loginBtn.classList.remove('customer-mode', 'admin-mode');
  if (idInput) idInput.classList.remove('customer-mode', 'admin-mode');
  currentUserType = null;
  
  if (!userId.trim()) {
    if (customerPreview) customerPreview.style.display = 'block';
    if (adminPreview) adminPreview.style.display = 'none';
    return;
  }
  
  // 등록된 계정에서 사용자 타입 확인
  const registeredAccounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
  const registeredAccount = registeredAccounts.find(account => 
    account.id === userId || account.email.split('@')[0] === userId
  );
  
  let isAdmin = false;
  
  if (registeredAccount) {
    isAdmin = registeredAccount.userType === 'admin';
  } else {
    // 기본 관리자 계정 패턴 감지
    const adminPatterns = [
      'admin', 'manager', 'supervisor', 'operator',
      'security', 'system', 'root', 'master'
    ];
    
    isAdmin = adminPatterns.some(pattern => 
      userId.toLowerCase().includes(pattern)
    );
  }
  
  if (isAdmin) {
    // 관리자 모드
    currentUserType = 'admin';
    if (indicator) {
      indicator.textContent = '🛡️ 관리자 계정으로 감지되었습니다';
      indicator.classList.add('show', 'admin');
    }
    if (loginCard) loginCard.classList.add('admin-mode');
    if (servicePreview) servicePreview.classList.add('admin-mode');
    if (loginBtn) loginBtn.classList.add('admin-mode');
    if (idInput) idInput.classList.add('admin-mode');
    
    // 미리보기 전환
    if (customerPreview) customerPreview.style.display = 'none';
    if (adminPreview) adminPreview.style.display = 'block';
    
  } else {
    // 고객 모드
    currentUserType = 'customer';
    if (indicator) {
      indicator.textContent = '👤 고객 계정으로 감지되었습니다';
      indicator.classList.add('show', 'customer');
    }
    if (loginCard) loginCard.classList.add('customer-mode');
    if (servicePreview) servicePreview.classList.add('customer-mode');
    if (loginBtn) loginBtn.classList.add('customer-mode');
    if (idInput) idInput.classList.add('customer-mode');
    
    // 미리보기 전환
    if (customerPreview) customerPreview.style.display = 'block';
    if (adminPreview) adminPreview.style.display = 'none';
  }
}

// === 통합 로그인 처리 ===
function handleUnifiedLogin(event) {
  event.preventDefault();
  
  const id = document.getElementById('unified-id').value.trim();
  const password = document.getElementById('unified-password').value;
  const remember = document.getElementById('remember-login')?.checked || false;
  
  if (!validateInputs(id, password)) {
    return;
  }
  
  // 관리자 로그인 시 경고 모달
  if (currentUserType === 'admin') {
    pendingAdminLogin = { id, password, remember };
    showAdminWarning();
    return;
  }
  
  // 일반 로그인 처리
  processLogin(id, password, remember, currentUserType || 'customer');
}

function continueAdminLogin() {
  closeAdminWarning();
  const { id, password, remember } = pendingAdminLogin;
  processLogin(id, password, remember, 'admin');
  pendingAdminLogin = false;
}

function processLogin(id, password, remember, userType) {
  // 로딩 상태로 변경
  setLoadingState(true);
  
  // 로그인 시뮬레이션 (사용자 타입에 따라 다른 시간)
  const loadingTime = userType === 'admin' ? 2500 : 1500;
  
  setTimeout(() => {
    if (validateCredentials(id, password, userType)) {
      handleLoginSuccess(userType, { 
        id, 
        name: getUserName(id, userType),
        role: userType
      }, remember);
    } else {
      handleLoginFailure('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
    setLoadingState(false);
  }, loadingTime);
}

// === 로그인 검증 ===
function validateInputs(id, password) {
  if (!id) {
    showToast('아이디를 입력해주세요.', 'error');
    return false;
  }
  
  if (!password) {
    showToast('비밀번호를 입력해주세요.', 'error');
    return false;
  }
  
  if (id.length < 3) {
    showToast('아이디는 3자 이상이어야 합니다.', 'error');
    return false;
  }
  
  if (password.length < 4) {
    showToast('비밀번호는 4자 이상이어야 합니다.', 'error');
    return false;
  }
  
  return true;
}

// === 로그인 성공/실패 처리 ===
function handleLoginSuccess(userType, userData, remember) {
  // 로그인 정보 저장
  const loginData = {
    user: userData,
    role: userType,
    loginTime: new Date().toISOString(),
    remember: remember
  };
  
  if (remember) {
    localStorage.setItem('loginData', JSON.stringify(loginData));
  } else {
    sessionStorage.setItem('loginData', JSON.stringify(loginData));
  }
  
  // 성공 모달 설정
  const successContent = document.getElementById('success-content');
  const successIcon = document.getElementById('success-icon');
  const successTitle = document.getElementById('success-title');
  const successMessage = document.getElementById('success-message');
  
  if (userType === 'admin') {
    if (successContent) successContent.style.borderTopColor = '#e53e3e';
    if (successIcon) successIcon.textContent = '🛡️';
    if (successTitle) successTitle.textContent = '로그인 성공!';
    if (successMessage) successMessage.textContent = '고객 대시보드로 이동합니다...';
  }
  
  // 성공 모달 표시
  const successModal = document.getElementById('success-modal');
  if (successModal) successModal.style.display = 'flex';
  
  // 성공 사운드 효과
  playSuccessSound();
  
  // 3초 후 리다이렉트
  setTimeout(() => {
    redirectToAppropriatePage(userType);
  }, 3000);
}

function handleLoginFailure(message) {
  showToast(message, 'error');
  
  // 비밀번호 필드 클리어 및 포커스
  const passwordField = document.getElementById('unified-password');
  if (passwordField) {
    passwordField.value = '';
    passwordField.focus();
  }
  
  // 폼 흔들기 애니메이션
  const form = document.querySelector('.login-form');
  if (form) {
    form.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
      form.style.animation = '';
    }, 500);
  }
}

function redirectToAppropriatePage(userType) {
  if (userType === 'customer') {
    window.location.href = 'customer-dashboard.html';
  } else {
    window.location.href = 'admin-dashboard.html';
  }
}

// === UI 상태 관리 ===
function setLoadingState(isLoading) {
  const btn = document.getElementById('login-btn');
  if (!btn) return;
  
  const btnText = btn.querySelector('.btn-text');
  const btnLoading = btn.querySelector('.btn-loading');
  
  if (isLoading) {
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'flex';
    btn.disabled = true;
    btn.style.cursor = 'not-allowed';
    
    // 폼 비활성화
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => input.disabled = true);
  } else {
    if (btnText) btnText.style.display = 'block';
    if (btnLoading) btnLoading.style.display = 'none';
    btn.disabled = false;
    btn.style.cursor = 'pointer';
    
    // 폼 활성화
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => input.disabled = false);
  }
}

// === 관리자 경고 모달 ===
function showAdminWarning() {
  const modal = document.getElementById('admin-warning-modal');
  if (modal) modal.style.display = 'flex';
}

function closeAdminWarning() {
  const modal = document.getElementById('admin-warning-modal');
  if (modal) modal.style.display = 'none';
  pendingAdminLogin = false;
}

// === 비밀번호 토글 ===
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById('password-icon');
  
  if (!input || !icon) return;
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = '🙈';
  } else {
    input.type = 'password';
    icon.textContent = '👁️';
  }
}

// === 소셜 로그인 ===
function socialLogin(provider) {
  showToast(`${provider} 로그인을 준비중입니다...`, 'info');
  
  setTimeout(() => {
    const userData = {
      id: `${provider}_user`,
      name: `${provider === 'kakao' ? '카카오' : '네이버'} 사용자`,
      role: 'customer'
    };
    
    handleLoginSuccess('customer', userData, false);
  }, 2000);
}

// === 계정 찾기 ===
function showFindAccount() {
  showToast('계정 찾기 페이지로 이동합니다...', 'info');
  
  setTimeout(() => {
    alert(`계정 찾기 서비스

📧 이메일: support@smartparking.com
📞 고객센터: 1588-1234
🕐 운영시간: 09:00-18:00

본인 확인 후 임시 비밀번호를 발송해드립니다.`);
  }, 1000);
}

function showAdminSignupInfo() {
  alert(`관리자 계정 신청 안내

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

// === 자동 로그인 확인 ===
function checkAutoLogin() {
  const savedLogin = localStorage.getItem('loginData') || sessionStorage.getItem('loginData');
  
  if (savedLogin) {
    try {
      const loginData = JSON.parse(savedLogin);
      const loginTime = new Date(loginData.loginTime);
      const now = new Date();
      const hoursPassed = (now - loginTime) / (1000 * 60 * 60);
      
      // 8시간 이내면 자동 로그인
      if (hoursPassed < 8) {
        showToast('자동 로그인 중...', 'info');
        
        setTimeout(() => {
          redirectToAppropriatePage(loginData.role);
        }, 1500);
        
        return true;
      } else {
        // 만료된 로그인 정보 삭제
        localStorage.removeItem('loginData');
        sessionStorage.removeItem('loginData');
      }
    } catch (e) {
      console.error('자동 로그인 확인 중 오류:', e);
    }
  }
  
  return false;
}

// === 폼 유효성 검사 ===
function setupFormValidation() {
  const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"]');
  
  inputs.forEach(input => {
    input.addEventListener('input', function() {
      validateFieldRealTime(this);
    });
    
    input.addEventListener('blur', function() {
      validateFieldOnBlur(this);
    });
    
    // Enter 키 처리
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const form = this.closest('form');
        const submitBtn = form?.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.click();
      }
    });
  });
}

function validateFieldRealTime(input) {
  const value = input.value;
  
  // 아이디 검증
  if (input.type === 'text' && input.id.includes('id')) {
    if (value.length > 0 && value.length < 3) {
      setFieldError(input, '아이디는 3자 이상이어야 합니다.');
    } else if (value.length >= 3) {
      setFieldSuccess(input);
    } else {
      clearFieldStatus(input);
    }
  }
  
  // 비밀번호 검증
  if (input.type === 'password') {
    if (value.length > 0 && value.length < 4) {
      setFieldError(input, '비밀번호는 4자 이상이어야 합니다.');
    } else if (value.length >= 4) {
      setFieldSuccess(input);
    } else {
      clearFieldStatus(input);
    }
  }
}

function validateFieldOnBlur(input) {
  const value = input.value.trim();
  
  if (value === '') {
    setFieldError(input, '필수 입력 항목입니다.');
  }
}

function setFieldError(input, message) {
  input.style.borderColor = '#e53e3e';
  input.style.boxShadow = '0 0 0 3px rgba(229, 62, 62, 0.1)';
  
  removeFieldMessage(input);
  const errorMsg = document.createElement('div');
  errorMsg.className = 'field-error';
  errorMsg.textContent = message;
  errorMsg.style.cssText = `
    color: #e53e3e;
    font-size: 0.8rem;
    margin-top: 0.5rem;
    padding-left: 0.5rem;
  `;
  input.parentNode.appendChild(errorMsg);
}

function setFieldSuccess(input) {
  if (currentUserType === 'customer') {
    input.style.borderColor = '#48bb78';
    input.style.boxShadow = '0 0 0 3px rgba(72, 187, 120, 0.1)';
  } else if (currentUserType === 'admin') {
    input.style.borderColor = '#e53e3e';
    input.style.boxShadow = '0 0 0 3px rgba(229, 62, 62, 0.1)';
  } else {
    input.style.borderColor = '#4299e1';
    input.style.boxShadow = '0 0 0 3px rgba(66, 153, 225, 0.1)';
  }
  removeFieldMessage(input);
}

function clearFieldStatus(input) {
  input.style.borderColor = '#e2e8f0';
  input.style.boxShadow = 'none';
  removeFieldMessage(input);
}

function removeFieldMessage(input) {
  const existingMsg = input.parentNode.querySelector('.field-error');
  if (existingMsg) {
    existingMsg.remove();
  }
}

// === 키보드 단축키 ===
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', function(e) {
    // Ctrl + Enter: 로그인 버튼 클릭
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      const loginBtn = document.getElementById('login-btn');
      const signupBtn = document.getElementById('signup-btn');
      
      if (currentPage === 'login' && loginBtn && !loginBtn.disabled) {
        loginBtn.click();
      } else if (currentPage === 'signup' && signupBtn && !signupBtn.disabled) {
        signupBtn.click();
      }
    }
    
    // ESC: 모달 닫기
    if (e.key === 'Escape') {
      closeAdminWarning();
      closeSignupSuccessModal();
      const successModal = document.getElementById('success-modal');
      if (successModal) successModal.style.display = 'none';
      const genericModal = document.getElementById('generic-modal');
      if (genericModal) genericModal.remove();
    }
    
    // F1: 도움말
    if (e.key === 'F1') {
      e.preventDefault();
      showHelp();
    }
    
    // Ctrl + Shift + S: 회원가입 페이지로 전환
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
      e.preventDefault();
      if (currentPage === 'login') {
        showSignupPage();
      }
    }
    
    // Ctrl + Shift + L: 로그인 페이지로 전환
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      if (currentPage === 'signup') {
        showLoginPage();
      }
    }
  });
}

// === 유틸리티 함수들 ===
function getUserName(id, userType) {
  // 등록된 계정에서 이름 찾기
  const registeredAccounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
  const registeredAccount = registeredAccounts.find(account => 
    account.id === id || account.email.split('@')[0] === id
  );
  
  if (registeredAccount) {
    return registeredAccount.name;
  }
  
  // 기본 계정 이름들
  const customerNames = {
    'customer': '김고객',
    'test': '테스트',
    'demo': '데모',
    'user': '사용자',
    'guest': '게스트'
  };
  
  const adminNames = {
    'admin': '시스템 관리자',
    'manager': '주차관리팀',
    'supervisor': '관리 감독자',
    'security': '보안관리팀',
    'system': '시스템 운영자',
    'operator': '운영 담당자'
  };
  
  if (userType === 'admin') {
    return adminNames[id] || '관리자님';
  } else {
    return customerNames[id] || '고객님';
  }
}

// showToast 함수
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  const styles = {
    success: { background: '#48bb78', icon: '✓' },
    error: { background: '#e53e3e', icon: '✕' },
    warning: { background: '#ed8936', icon: '⚠' },
    info: { background: '#4299e1', icon: 'ℹ' }
  };
  
  const style = styles[type] || styles.info;
  
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${style.background};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.95rem;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
  `;
  
  // 아이콘 추가
  const icon = document.createElement('span');
  icon.textContent = style.icon;
  icon.style.fontSize = '1.2rem';
  toast.prepend(icon);
  
  // 애니메이션 추가
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
      20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
  `;
  document.head.appendChild(styleSheet);
  
  document.body.appendChild(toast);
  
  // 3초 후 자동 제거
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// === 사운드 효과 ===
function playSuccessSound() {
  // Web Audio API를 사용한 간단한 성공 사운드
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('사운드 재생 실패:', e);
  }
}

// === 도움말 ===
function showHelp() {
  const helpContent = `
    <div style="max-width: 600px; max-height: 80vh; overflow-y: auto;">
      <h2 style="margin-bottom: 1rem; color: #2d3748;">🔑 로그인/회원가입 도움말</h2>
      
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: #4299e1; margin-bottom: 0.5rem;">고객 계정</h3>
        <ul style="list-style: none; padding: 0;">
          <li>📧 아이디: customer / 비밀번호: 1234</li>
          <li>📧 아이디: test / 비밀번호: test</li>
          <li>📧 아이디: demo / 비밀번호: demo</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: #e53e3e; margin-bottom: 0.5rem;">관리자 계정</h3>
        <ul style="list-style: none; padding: 0;">
          <li>🛡️ 아이디: admin / 비밀번호: admin</li>
          <li>🛡️ 아이디: manager / 비밀번호: 1234</li>
          <li>🛡️ 아이디: supervisor / 비밀번호: super</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: #48bb78; margin-bottom: 0.5rem;">회원가입 안내</h3>
        <ul style="list-style: none; padding: 0;">
          <li>✅ 이메일에 'admin', 'manager' 등이 포함되면 관리자 계정으로 등록</li>
          <li>✅ 비밀번호는 영문자와 숫자를 모두 포함해야 함</li>
          <li>✅ 회원가입 완료 후 자동으로 로그인 페이지로 이동</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 1.5rem;">
        <h3 style="color: #48bb78; margin-bottom: 0.5rem;">키보드 단축키</h3>
        <ul style="list-style: none; padding: 0;">
          <li>⌨️ Ctrl + Enter: 로그인/회원가입</li>
          <li>⌨️ Ctrl + Shift + S: 회원가입 페이지로 전환</li>
          <li>⌨️ Ctrl + Shift + L: 로그인 페이지로 전환</li>
          <li>⌨️ ESC: 모달 닫기</li>
          <li>⌨️ F1: 이 도움말 보기</li>
        </ul>
      </div>
      
      <div style="margin-bottom: 1rem;">
        <h3 style="color: #ed8936; margin-bottom: 0.5rem;">문의처</h3>
        <ul style="list-style: none; padding: 0;">
          <li>📞 고객센터: 1588-1234</li>
          <li>📧 이메일: support@smartparking.com</li>
          <li>🕐 운영시간: 평일 09:00-18:00</li>
        </ul>
      </div>
    </div>
  `;
  
  showModal('도움말', helpContent);
}

// === 범용 모달 ===
function showModal(title, content, buttons = []) {
  // 기존 모달 제거
  const existingModal = document.getElementById('generic-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  const modal = document.createElement('div');
  modal.id = 'generic-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    animation: fadeIn 0.3s ease-out;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    max-width: 90%;
    max-height: 90vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s ease-out;
  `;
  
  const modalHeader = document.createElement('div');
  modalHeader.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  `;
  
  const modalTitle = document.createElement('h2');
  modalTitle.textContent = title;
  modalTitle.style.cssText = `
    margin: 0;
    color: #2d3748;
    font-size: 1.5rem;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #718096;
    padding: 0.5rem;
    border-radius: 4px;
    transition: all 0.2s;
  `;
  closeBtn.onmouseover = () => closeBtn.style.background = '#f7fafc';
  closeBtn.onmouseout = () => closeBtn.style.background = 'none';
  closeBtn.onclick = () => modal.remove();
  
  modalHeader.appendChild(modalTitle);
  modalHeader.appendChild(closeBtn);
  
  const modalBody = document.createElement('div');
  modalBody.innerHTML = content;
  modalBody.style.cssText = `
    flex: 1;
    overflow-y: auto;
    margin-bottom: 1rem;
  `;
  
  modalContent.appendChild(modalHeader);
  modalContent.appendChild(modalBody);
  
  // 버튼 추가
  if (buttons.length > 0) {
    const modalFooter = document.createElement('div');
    modalFooter.style.cssText = `
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e2e8f0;
    `;
    
    buttons.forEach(btn => {
      const button = document.createElement('button');
      button.textContent = btn.text;
      button.style.cssText = `
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        border: none;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        ${btn.primary ? 
          'background: #4299e1; color: white;' : 
          'background: #e2e8f0; color: #2d3748;'}
      `;
      button.onclick = () => {
        if (btn.onClick) btn.onClick();
        modal.remove();
      };
      modalFooter.appendChild(button);
    });
    
    modalContent.appendChild(modalFooter);
  }
  
  // 애니메이션 스타일 추가
  const animationStyle = document.createElement('style');
  animationStyle.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(animationStyle);
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // ESC 키로 닫기
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      modal.remove();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
  
  // 모달 외부 클릭으로 닫기
  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  };
}

// === 세션 관리 ===
function startSessionTimer() {
  let sessionTime = 0;
  const maxSessionTime = 30 * 60; // 30분
  
  const sessionTimer = setInterval(() => {
    sessionTime++;
    
    // 25분 경과 시 경고
    if (sessionTime === 25 * 60) {
      showToast('세션이 5분 후 만료됩니다. 활동을 계속하세요.', 'warning');
    }
    
    // 30분 경과 시 자동 로그아웃
    if (sessionTime >= maxSessionTime) {
      clearInterval(sessionTimer);
      handleSessionTimeout();
    }
  }, 1000);
  
  // 사용자 활동 감지
  ['click', 'keypress', 'mousemove'].forEach(event => {
    document.addEventListener(event, () => {
      sessionTime = 0; // 활동 시 타이머 리셋
    });
  });
}

function handleSessionTimeout() {
  showModal(
    '세션 만료',
    '<p>보안을 위해 30분간 활동이 없어 자동으로 로그아웃됩니다.</p>',
    [
      {
        text: '다시 로그인',
        primary: true,
        onClick: () => {
          window.location.reload();
        }
      }
    ]
  );
  
  // 로그인 정보 제거
  localStorage.removeItem('loginData');
  sessionStorage.removeItem('loginData');
}

// === 브라우저 호환성 체크 ===
function checkBrowserCompatibility() {
  const isIE = /MSIE|Trident/.test(navigator.userAgent);
  
  if (isIE) {
    showToast('Internet Explorer는 지원하지 않습니다. Chrome, Firefox, Edge 등을 사용해주세요.', 'error');
    return false;
  }
  
  // 필수 기능 체크
  const requiredFeatures = [
    'localStorage' in window,
    'sessionStorage' in window,
    'addEventListener' in window,
    'querySelector' in document
  ];
  
  if (!requiredFeatures.every(f => f)) {
    showToast('브라우저가 너무 오래되었습니다. 최신 브라우저를 사용해주세요.', 'error');
    return false;
  }
  
  return true;
}

// === 디버그 모드 ===
const DEBUG_MODE = false;

function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log('[DEBUG]', ...args);
  }
}

// === 초기화 시 브라우저 체크 추가 ===
document.addEventListener('DOMContentLoaded', function() {
  if (checkBrowserCompatibility()) {
    initializeLoginPage();
    
    // 자동 로그인이 되지 않은 경우에만 세션 타이머 시작
    if (!checkAutoLogin()) {
      startSessionTimer();
    }
    
    setupFormValidation();
    setupSignupValidation(); // 회원가입 폼 검증 설정 추가
    setupKeyboardShortcuts();
  }
});

// === 성능 최적화를 위한 디바운스 함수 ===
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

// 사용자 타입 감지에 디바운스 적용
const debouncedDetectUserType = debounce(detectUserType, 300);

// 아이디 입력 필드에 디바운스된 이벤트 적용
document.addEventListener('DOMContentLoaded', function() {
  const idInput = document.getElementById('unified-id');
  if (idInput) {
    idInput.addEventListener('input', function() {
      debouncedDetectUserType(this.value);
    });
  }
});

// === 추가된 회원가입 관련 유틸리티 함수들 ===

// 이용약관 보기
function showTermsOfService() {
  const termsContent = `
    <div style="max-height: 400px; overflow-y: auto; line-height: 1.6;">
      <h3 style="color: #2d3748; margin-bottom: 1rem;">스마트파킹 서비스 이용약관</h3>
      
      <h4 style="color: #4299e1; margin: 1rem 0 0.5rem 0;">제1조 (목적)</h4>
      <p>본 약관은 스마트파킹 서비스 이용에 관한 조건 및 절차, 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.</p>
      
      <h4 style="color: #4299e1; margin: 1rem 0 0.5rem 0;">제2조 (정의)</h4>
      <p>1. "서비스"란 회사가 제공하는 스마트파킹 관련 모든 서비스를 의미합니다.<br>
      2. "회원"이란 본 약관에 동의하고 회사와 서비스 이용계약을 체결한 개인 또는 법인을 의미합니다.</p>
      
      <h4 style="color: #4299e1; margin: 1rem 0 0.5rem 0;">제3조 (약관의 효력 및 변경)</h4>
      <p>본 약관은 회원가입 시 동의함으로써 효력이 발생하며, 회사는 필요시 약관을 변경할 수 있습니다.</p>
      
      <h4 style="color: #4299e1; margin: 1rem 0 0.5rem 0;">제4조 (개인정보보호)</h4>
      <p>회사는 관련 법령에 따라 회원의 개인정보를 보호하며, 개인정보 처리방침에 따라 안전하게 관리합니다.</p>
      
      <h4 style="color: #4299e1; margin: 1rem 0 0.5rem 0;">제5조 (서비스 이용)</h4>
      <p>회원은 서비스를 선량한 관리자의 주의로 이용해야 하며, 다음 행위를 하여서는 안 됩니다:<br>
      - 타인의 정보 도용<br>
      - 서비스 운영 방해<br>
      - 기타 불법적이거나 부당한 행위</p>
      
      <p style="margin-top: 2rem; padding: 1rem; background: #f7fafc; border-radius: 8px; color: #2d3748;">
      <strong>문의처:</strong><br>
      📧 이메일: support@smartparking.com<br>
      📞 전화: 1588-1234<br>
      🕐 운영시간: 평일 09:00-18:00
      </p>
    </div>
  `;
  
  showModal('서비스 이용약관', termsContent, [
    {
      text: '동의',
      primary: true,
      onClick: () => {
        const agreeCheckbox = document.getElementById('signup-agree');
        if (agreeCheckbox) {
          agreeCheckbox.checked = true;
          signupData.agreeToTerms = true;
        }
      }
    },
    {
      text: '닫기',
      primary: false
    }
  ]);
}

// 개인정보 처리방침 보기
function showPrivacyPolicy() {
  const privacyContent = `
    <div style="max-height: 400px; overflow-y: auto; line-height: 1.6;">
      <h3 style="color: #2d3748; margin-bottom: 1rem;">개인정보 처리방침</h3>
      
      <h4 style="color: #48bb78; margin: 1rem 0 0.5rem 0;">1. 개인정보의 처리목적</h4>
      <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다:<br>
      - 회원가입 및 관리<br>
      - 서비스 제공 및 계약이행<br>
      - 고객상담 및 불만처리<br>
      - 마케팅 및 광고에의 활용</p>
      
      <h4 style="color: #48bb78; margin: 1rem 0 0.5rem 0;">2. 개인정보의 처리 및 보유기간</h4>
      <p>회사는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집시 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
      
      <h4 style="color: #48bb78; margin: 1rem 0 0.5rem 0;">3. 처리하는 개인정보 항목</h4>
      <p>회사는 다음의 개인정보 항목을 처리하고 있습니다:<br>
      - 필수항목: 이름, 이메일주소, 휴대전화번호<br>
      - 선택항목: 주소, 생년월일</p>
      
      <h4 style="color: #48bb78; margin: 1rem 0 0.5rem 0;">4. 개인정보의 제3자 제공</h4>
      <p>회사는 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 처리하며, 정보주체의 사전 동의 없이는 본래의 목적 범위를 초과하여 처리하거나 제3자에게 제공하지 않습니다.</p>
      
      <h4 style="color: #48bb78; margin: 1rem 0 0.5rem 0;">5. 정보주체의 권리·의무</h4>
      <p>정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:<br>
      - 개인정보 처리현황 통지요구<br>
      - 개인정보 처리정지 요구<br>
      - 개인정보 수정·삭제 요구<br>
      - 손해배상 청구</p>
      
      <p style="margin-top: 2rem; padding: 1rem; background: #f0fff4; border-radius: 8px; color: #2d3748;">
      <strong>개인정보보호책임자:</strong><br>
      📧 이메일: privacy@smartparking.com<br>
      📞 전화: 02-1234-5678<br>
      🕐 운영시간: 평일 09:00-18:00
      </p>
    </div>
  `;
  
  showModal('개인정보 처리방침', privacyContent);
}

// 회원가입 폼 필드 포맷팅
function formatPhoneNumber(input) {
  let value = input.value.replace(/[^0-9]/g, '');
  
  if (value.length >= 3 && value.length <= 7) {
    value = value.replace(/(\d{3})(\d{1,4})/, '$1-$2');
  } else if (value.length >= 8) {
    value = value.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
  }
  
  input.value = value;
  signupData.phone = value;
}

// 이메일 도메인 자동완성
function setupEmailAutocomplete() {
  const emailInput = document.getElementById('signup-email');
  if (!emailInput) return;
  
  const commonDomains = [
    'gmail.com', 'naver.com', 'daum.net', 'yahoo.com', 
    'hotmail.com', 'outlook.com', 'company.com', 'admin.com'
  ];
  
  emailInput.addEventListener('input', function() {
    const value = this.value;
    const atIndex = value.indexOf('@');
    
    if (atIndex > 0 && atIndex === value.length - 1) {
      // @ 입력 직후 도메인 제안
      showEmailDomainSuggestions(this, commonDomains);
    }
  });
}

function showEmailDomainSuggestions(input, domains) {
  // 기존 제안 목록 제거
  const existingSuggestions = document.getElementById('email-suggestions');
  if (existingSuggestions) {
    existingSuggestions.remove();
  }
  
  const suggestions = document.createElement('div');
  suggestions.id = 'email-suggestions';
  suggestions.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-height: 200px;
    overflow-y: auto;
  `;
  
  const userPart = input.value.split('@')[0];
  
  domains.forEach(domain => {
    const suggestion = document.createElement('div');
    suggestion.style.cssText = `
      padding: 0.75rem 1rem;
      cursor: pointer;
      transition: background-color 0.2s;
      border-bottom: 1px solid #f7fafc;
    `;
    suggestion.textContent = `${userPart}@${domain}`;
    
    suggestion.addEventListener('mouseenter', function() {
      this.style.backgroundColor = '#f7fafc';
    });
    
    suggestion.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'white';
    });
    
    suggestion.addEventListener('click', function() {
      input.value = `${userPart}@${domain}`;
      signupData.email = input.value;
      suggestions.remove();
      
      // 이메일 변경 시 사용자 타입 재감지
      detectSignupUserType(input.value);
      validateSignupField('email', input.value);
    });
    
    suggestions.appendChild(suggestion);
  });
  
  // 입력 필드의 부모에 상대 위치 설정
  const inputContainer = input.parentNode;
  inputContainer.style.position = 'relative';
  inputContainer.appendChild(suggestions);
  
  // 외부 클릭 시 제안 목록 숨기기
  setTimeout(() => {
    document.addEventListener('click', function hideEmailSuggestions(e) {
      if (!inputContainer.contains(e.target)) {
        suggestions.remove();
        document.removeEventListener('click', hideEmailSuggestions);
      }
    });
  }, 100);
}

// 비밀번호 강도 체크
function checkPasswordStrength(password) {
  let strength = 0;
  let feedback = [];
  
  // 길이 체크
  if (password.length >= 8) {
    strength += 1;
  } else {
    feedback.push('8자 이상');
  }
  
  // 대문자 체크
  if (/[A-Z]/.test(password)) {
    strength += 1;
  } else {
    feedback.push('대문자 포함');
  }
  
  // 소문자 체크
  if (/[a-z]/.test(password)) {
    strength += 1;
  } else {
    feedback.push('소문자 포함');
  }
  
  // 숫자 체크
  if (/[0-9]/.test(password)) {
    strength += 1;
  } else {
    feedback.push('숫자 포함');
  }
  
  // 특수문자 체크
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    strength += 1;
  } else {
    feedback.push('특수문자 포함');
  }
  
  return { strength, feedback };
}

function showPasswordStrength(password, targetElement) {
  const { strength, feedback } = checkPasswordStrength(password);
  
  // 기존 강도 표시기 제거
  const existingMeter = document.getElementById('password-strength-meter');
  if (existingMeter) {
    existingMeter.remove();
  }
  
  if (!password) return;
  
  const strengthMeter = document.createElement('div');
  strengthMeter.id = 'password-strength-meter';
  strengthMeter.style.cssText = `
    margin-top: 0.5rem;
    padding: 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
  `;
  
  const strengthLevels = [
    { color: '#e53e3e', text: '매우 약함', bg: '#fed7d7' },
    { color: '#ed8936', text: '약함', bg: '#feebc8' },
    { color: '#ecc94b', text: '보통', bg: '#fefcbf' },
    { color: '#48bb78', text: '강함', bg: '#c6f6d5' },
    { color: '#38a169', text: '매우 강함', bg: '#9ae6b4' }
  ];
  
  const level = strengthLevels[strength] || strengthLevels[0];
  
  strengthMeter.style.backgroundColor = level.bg;
  strengthMeter.style.color = level.color;
  
  const strengthText = document.createElement('div');
  strengthText.style.fontWeight = 'bold';
  strengthText.textContent = `비밀번호 강도: ${level.text}`;
  
  const feedbackText = document.createElement('div');
  feedbackText.style.marginTop = '0.25rem';
  if (feedback.length > 0) {
    feedbackText.textContent = `개선사항: ${feedback.join(', ')}`;
  } else {
    feedbackText.textContent = '안전한 비밀번호입니다!';
  }
  
  strengthMeter.appendChild(strengthText);
  strengthMeter.appendChild(feedbackText);
  
  targetElement.parentNode.appendChild(strengthMeter);
}

// 계정 중복 확인 (실시간)
function checkAccountDuplicate(field, value) {
  if (!value) return;
  
  const registeredAccounts = JSON.parse(localStorage.getItem('registeredAccounts') || '[]');
  
  let isDuplicate = false;
  
  if (field === 'email') {
    isDuplicate = registeredAccounts.some(account => account.email === value);
  } else if (field === 'phone') {
    isDuplicate = registeredAccounts.some(account => account.phone === value);
  }
  
  if (isDuplicate) {
    const input = document.getElementById(`signup-${field}`);
    setFieldError(input, `이미 등록된 ${field === 'email' ? '이메일' : '전화번호'}입니다.`);
    return false;
  }
  
  return true;
}

// 회원가입 폼 초기화 시 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', function() {
  // 전화번호 포맷팅
  const phoneInput = document.getElementById('signup-phone');
  if (phoneInput) {
    phoneInput.addEventListener('input', function() {
      formatPhoneNumber(this);
    });
  }
  
  // 이메일 자동완성
  setupEmailAutocomplete();
  
  // 비밀번호 강도 체크
  const passwordInput = document.getElementById('signup-password');
  if (passwordInput) {
    passwordInput.addEventListener('input', function() {
      showPasswordStrength(this.value, this);
    });
  }
  
  // 계정 중복 확인
  const emailInput = document.getElementById('signup-email');
  if (emailInput) {
    emailInput.addEventListener('blur', function() {
      checkAccountDuplicate('email', this.value);
    });
  }
  
  if (phoneInput) {
    phoneInput.addEventListener('blur', function() {
      checkAccountDuplicate('phone', this.value.replace(/[^0-9]/g, ''));
    });
  }
});

// === 회원가입 성공 후 추가 기능들 ===

// 환영 이메일 발송 시뮬레이션
function sendWelcomeEmail(userData) {
  console.log(`환영 이메일 발송: ${userData.email}`);
  
  // 실제로는 서버에서 이메일 발송 처리
  setTimeout(() => {
    showToast(`환영 이메일이 ${userData.email}로 발송되었습니다.`, 'info');
  }, 1000);
}

// 회원가입 통계 업데이트
function updateSignupStats(userType) {
  const stats = JSON.parse(localStorage.getItem('signupStats') || '{}');
  
  const today = new Date().toISOString().split('T')[0];
  
  if (!stats[today]) {
    stats[today] = { customer: 0, admin: 0, total: 0 };
  }
  
  stats[today][userType]++;
  stats[today].total++;
  
  localStorage.setItem('signupStats', JSON.stringify(stats));
}

// 추천인 코드 처리 (확장 기능)
function processReferralCode(code) {
  if (!code) return;
  
  const referralCodes = JSON.parse(localStorage.getItem('referralCodes') || '{}');
  
  if (referralCodes[code]) {
    referralCodes[code].usedCount = (referralCodes[code].usedCount || 0) + 1;
    localStorage.setItem('referralCodes', JSON.stringify(referralCodes));
    
    showToast('추천인 코드가 적용되었습니다!', 'success');
    return true;
  }
  
  return false;
}

// 마케팅 동의 처리
function handleMarketingConsent(agreed) {
  if (agreed) {
    showToast('마케팅 정보 수신에 동의하셨습니다.', 'info');
  }
}

// 회원가입 프로세스 완료 시 호출되는 함수들을 processSignup에 추가
const originalProcessSignup = processSignup;
processSignup = function() {
  const result = originalProcessSignup();
  
  if (result) {
    // 추가 처리들
    updateSignupStats(signupData.userType);
    sendWelcomeEmail(signupData);
    
    // 추천인 코드가 있다면 처리
    const referralInput = document.getElementById('signup-referral');
    if (referralInput && referralInput.value) {
      processReferralCode(referralInput.value);
    }
    
    // 마케팅 동의 처리
    const marketingConsent = document.getElementById('signup-marketing');
    if (marketingConsent) {
      handleMarketingConsent(marketingConsent.checked);
    }
  }
  
  return result;
}; '관리자 인증 완료!';
    if (successMessage) successMessage.textContent = '관리자 대시보드로 이동합니다...';
  } else {
    if (successContent) successContent.style.borderTopColor = '#48bb78';
    if (successIcon) successIcon.textContent = '✅';
    if (successTitle) successTitle.textContent =