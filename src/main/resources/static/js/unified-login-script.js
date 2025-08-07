// ========================================
// 스마트파킹 로그인 시스템 - Spring Security 연동 버전
// ========================================

console.log('🚀 스마트파킹 로그인 시스템 시작 (Spring Security 연동)');

// 전역 변수
let currentUserType = null;
let isSubmitting = false;

// ========================================
// 1. DOM 로드 및 초기화
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM 로드 완료');

    // 페이지 애니메이션
    animatePageLoad();

    // 이벤트 리스너 설정
    setupEventListeners();

    // 아이디 입력 필드에 포커스
    setTimeout(() => {
        const idInput = document.getElementById('username');
        if (idInput) {
            idInput.focus();
            console.log('🎯 아이디 필드에 포커스 설정');
        }
    }, 500);

    // URL 파라미터 체크 (로그인 실패/성공 처리)
    checkUrlParams();

    console.log('✅ 초기화 완료');
});

// ========================================
// 2. 이벤트 리스너 설정
// ========================================
function setupEventListeners() {
    console.log('🔗 이벤트 리스너 설정 중...');

    // 로그인 폼 이벤트 - Spring Security 처리
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleSpringSecurityLogin);
        console.log('📝 로그인 폼 이벤트 연결 (Spring Security)');
    }

    // 아이디 입력 이벤트
    const idInput = document.getElementById('username');
    if (idInput) {
        idInput.addEventListener('input', function() {
            detectUserType(this.value);
        });
        console.log('👤 아이디 입력 이벤트 연결');
    }

    // 비밀번호 토글 이벤트
    const passwordToggle = document.querySelector('.password-toggle');
    if (passwordToggle) {
        passwordToggle.addEventListener('click', togglePassword);
        console.log('👁️ 비밀번호 토글 이벤트 연결');
    }

    // 소셜 로그인 처리
    setupSocialLogin();

    // 아이디/비밀번호 찾기 링크
    const forgotLink = document.getElementById('forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            showFindAccount();
        });
        console.log('🔍 아이디/비밀번호 찾기 이벤트 연결');
    }

    // 관리자 회원가입 문의 버튼
    const adminSignupBtn = document.getElementById('admin-signup-btn');
    if (adminSignupBtn) {
        adminSignupBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAdminSignupInfo();
        });
        console.log('🛡️ 관리자 회원가입 문의 이벤트 연결');
    }

    // 키보드 단축키
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F1') {
            e.preventDefault();
            showHelp();
        } else if (e.key === 'F12') {
            e.preventDefault();
            showDebugInfo();
        }
    });

    console.log('⌨️ 키보드 단축키 연결');
}

// ========================================
// 3. AJAX 로그인 처리 (페이지 새로고침 없음)
// ========================================
function handleSpringSecurityLogin(event) {
    event.preventDefault(); // 폼 기본 제출 막기
    console.log('🔐 AJAX 로그인 처리 시작');

    // 중복 제출 방지
    if (isSubmitting) {
        console.log('⚠️ 이미 제출 중입니다');
        return false;
    }

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    console.log('📝 입력 정보:', { username, password: '***', userType: currentUserType });

    // 클라이언트 사이드 기본 검증
    if (!username) {
        showMessage('아이디를 입력해주세요.', 'error');
        document.getElementById('username').focus();
        return false;
    }

    if (!password) {
        showMessage('비밀번호를 입력해주세요.', 'error');
        document.getElementById('password').focus();
        return false;
    }

    // 관리자 로그인 시 확인
    if (currentUserType === 'admin') {
        const confirmAdmin = confirm(
            '🛡️ 관리자 계정으로 로그인하시겠습니까?\n\n' +
            '관리자 권한으로 접근됩니다.'
        );

        if (!confirmAdmin) {
            console.log('❌ 관리자 로그인 취소됨');
            return false;
        }
    }

    // 로딩 상태 설정
    setLoadingState(true);
    isSubmitting = true;

    // AJAX 로그인 요청
    performAjaxLogin(username, password);

    return false;
}

// AJAX 로그인 함수
function performAjaxLogin(username, password) {
    // FormData 생성
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    // Remember-me 체크박스 값
    const rememberMe = document.getElementById('remember-me').checked;
    if (rememberMe) {
        formData.append('remember-me', 'on');
    }

    // 사용자 타입 추가
    formData.append('userType', currentUserType || 'customer');

    console.log('📤 AJAX 로그인 요청 전송');

    fetch('/login', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    })
        .then(response => {
            console.log('📥 서버 응답 수신:', response.status);

            if (response.ok) {
                // 로그인 성공
                showLoginSuccess();

                // 성공 시 리다이렉트 URL 확인
                const redirectUrl = response.url;
                if (redirectUrl && !redirectUrl.includes('/login')) {
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 1500);
                } else {
                    // 기본 대시보드로 이동
                    setTimeout(() => {
                        window.location.href = currentUserType === 'admin' ? '/admin/dashboard' : '/dashboard';
                    }, 1500);
                }
            } else if (response.status === 401) {
                // 로그인 실패
                showLoginError();
            } else {
                // 기타 오류
                showMessage('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
            }
        })
        .catch(error => {
            console.error('❌ AJAX 로그인 오류:', error);
            showLoginError();
        })
        .finally(() => {
            setLoadingState(false);
            isSubmitting = false;
        });
}

// 로그인 성공 처리
function showLoginSuccess() {
    console.log('✅ 로그인 성공');

    // 성공 메시지 표시
    const successMessage = document.getElementById('logout-message');
    if (successMessage) {
        successMessage.textContent = '로그인 성공! 대시보드로 이동합니다...';
        successMessage.className = 'success-message';
        successMessage.style.display = 'block';
    }

    // 토스트 메시지
    showMessage('로그인 성공! 대시보드로 이동합니다...', 'success');

    // 에러 메시지 숨김
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.style.display = 'none';
    }
}

// 로그인 실패 처리
function showLoginError() {
    console.log('❌ 로그인 실패');

    // 에러 메시지 표시
    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
        errorMessage.style.display = 'block';
        // 5초 후 자동 숨김
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }

    // 토스트 메시지
    showMessage('로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.', 'error');

    // 성공 메시지 숨김
    const successMessage = document.getElementById('logout-message');
    if (successMessage) {
        successMessage.style.display = 'none';
    }

    // 비밀번호 필드 초기화 및 포커스
    const passwordField = document.getElementById('password');
    if (passwordField) {
        passwordField.value = '';
        passwordField.focus();
    }
}

// ========================================
// 4. 사용자 타입 감지
// ========================================
function detectUserType(userId) {
    console.log('🔍 사용자 타입 감지:', userId);

    const indicator = document.getElementById('user-type-indicator');
    const loginCard = document.getElementById('login-card');
    const servicePreview = document.getElementById('service-preview');
    const loginBtn = document.getElementById('login-btn');
    const customerPreview = document.getElementById('customer-preview');
    const adminPreview = document.getElementById('admin-preview');
    const idInput = document.getElementById('username');

    // 초기화
    if (indicator) indicator.classList.remove('show', 'customer', 'admin');
    if (loginCard) loginCard.classList.remove('customer-mode', 'admin-mode');
    if (servicePreview) servicePreview.classList.remove('customer-mode', 'admin-mode');
    if (loginBtn) loginBtn.classList.remove('customer-mode', 'admin-mode');
    if (idInput) idInput.classList.remove('customer-mode', 'admin-mode');

    currentUserType = null;

    if (!userId || !userId.trim()) {
        if (customerPreview) customerPreview.style.display = 'block';
        if (adminPreview) adminPreview.style.display = 'none';
        return;
    }

    // 관리자 계정 체크
    const adminAccounts = ['admin', 'manager', 'supervisor', 'security', 'system', 'operator'];
    const isAdmin = adminAccounts.includes(userId.toLowerCase());

    console.log('🎭 사용자 타입 결정:', isAdmin ? 'admin' : 'customer');

    if (isAdmin) {
        currentUserType = 'admin';
        if (indicator) {
            indicator.textContent = '🛡️ 관리자 계정으로 감지되었습니다';
            indicator.classList.add('show', 'admin');
        }

        // 스타일 적용
        if (loginCard) loginCard.classList.add('admin-mode');
        if (servicePreview) servicePreview.classList.add('admin-mode');
        if (loginBtn) loginBtn.classList.add('admin-mode');
        if (idInput) idInput.classList.add('admin-mode');

        // 미리보기 전환
        if (customerPreview) customerPreview.style.display = 'none';
        if (adminPreview) adminPreview.style.display = 'block';

    } else {
        currentUserType = 'customer';
        if (indicator) {
            indicator.textContent = '👤 고객 계정으로 감지되었습니다';
            indicator.classList.add('show', 'customer');
        }

        // 스타일 적용
        if (loginCard) loginCard.classList.add('customer-mode');
        if (servicePreview) servicePreview.classList.add('customer-mode');
        if (loginBtn) loginBtn.classList.add('customer-mode');
        if (idInput) idInput.classList.add('customer-mode');

        // 미리보기 전환
        if (customerPreview) customerPreview.style.display = 'block';
        if (adminPreview) adminPreview.style.display = 'none';
    }
}

// ========================================
// 5. 소셜 로그인 처리
// ========================================
function setupSocialLogin() {
    const kakaoBtn = document.getElementById('kakao-btn');
    const naverBtn = document.getElementById('naver-btn');

    if (kakaoBtn) {
        kakaoBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showMessage('카카오 로그인으로 이동 중...', 'info');
            setTimeout(() => {
                window.location.href = '/oauth2/authorization/kakao';
            }, 500);
        });
        console.log('💛 카카오 버튼 이벤트 연결');
    }

    if (naverBtn) {
        naverBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showMessage('네이버 로그인으로 이동 중...', 'info');
            setTimeout(() => {
                window.location.href = '/oauth2/authorization/naver';
            }, 500);
        });
        console.log('🟢 네이버 버튼 이벤트 연결');
    }
}

// ========================================
// 6. UI 헬퍼 함수들
// ========================================
function setLoadingState(isLoading) {
    const btn = document.getElementById('login-btn');
    const btnText = btn?.querySelector('.btn-text');
    const btnLoading = btn?.querySelector('.btn-loading');

    if (!btn) return;

    if (isLoading) {
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'flex';
        btn.disabled = true;
        btn.style.opacity = '0.7';
        console.log('⏳ 로딩 상태 활성화');
    } else {
        if (btnText) btnText.style.display = 'block';
        if (btnLoading) btnLoading.style.display = 'none';
        btn.disabled = false;
        btn.style.opacity = '1';
        console.log('✅ 로딩 상태 비활성화');
    }
}

function showMessage(text, type = 'info') {
    console.log(`📢 메시지 표시 (${type}):`, text);

    // 기존 토스트 제거
    const existingToasts = document.querySelectorAll('.toast-message');
    existingToasts.forEach(toast => toast.remove());

    const toast = document.createElement('div');
    toast.className = 'toast-message';

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
        ${text}
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
        display: flex;
        align-items: center;
    `;

    document.body.appendChild(toast);

    // 3초 후 제거
    setTimeout(() => {
        toast.style.animation = 'slideOutToRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function togglePassword() {
    const input = document.getElementById('password');
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

function animatePageLoad() {
    const elements = document.querySelectorAll('.login-card, .service-preview');
    elements.forEach((el, index) => {
        if (el) {
            el.style.opacity = '0';
            el.style.transform = index === 0 ? 'translateX(-30px)' : 'translateX(30px)';

            setTimeout(() => {
                el.style.transition = 'all 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translate(0)';
            }, 100 + (index * 150));
        }
    });
}

// ========================================
// 7. URL 파라미터 체크 (호환성용 - 기존 Spring Security 방식)
// ========================================
function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.has('error')) {
        console.log('❌ URL에서 로그인 실패 감지 (기존 Spring Security 방식)');
        showLoginError();
        // URL 파라미터 정리
        if (window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    if (urlParams.has('logout')) {
        console.log('✅ URL에서 로그아웃 성공 감지');
        const logoutMessage = document.getElementById('logout-message');
        if (logoutMessage) {
            logoutMessage.style.display = 'block';
            setTimeout(() => {
                logoutMessage.style.display = 'none';
            }, 3000);
        }
        showMessage('성공적으로 로그아웃되었습니다.', 'success');
        // URL 파라미터 정리
        if (window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
}

// ========================================
// 8. 아이디/비밀번호 찾기 및 관리자 가입
// ========================================
function showFindAccount() {
    console.log('🔍 아이디/비밀번호 찾기 요청');
    showMessage('아이디/비밀번호 찾기 기능을 준비 중입니다.', 'info');

    setTimeout(() => {
        const confirm = window.confirm('고객센터로 연결하시겠습니까?\n📞 1588-1234');
        if (confirm) {
            window.open('tel:1588-1234');
        }
    }, 1000);
}

function showAdminSignupInfo() {
    console.log('🛡️ 관리자 회원가입 문의');
    showMessage('관리자 계정은 시스템 관리자에게 문의해주세요.', 'info');

    setTimeout(() => {
        const confirm = window.confirm(
            '관리자 계정 신청 안내\n\n' +
            '• 관리자 계정은 별도 승인이 필요합니다\n' +
            '• 시스템 관리자에게 문의해주세요\n\n' +
            '고객센터로 연결하시겠습니까?'
        );
        if (confirm) {
            window.open('tel:1588-1234');
        }
    }, 1000);
}

// ========================================
// 9. 디버그 및 도움말
// ========================================
function showDebugInfo() {
    console.log('🔍 현재 상태:');
    console.log('  - 사용자 타입:', currentUserType);
    console.log('  - 제출 중 여부:', isSubmitting);
    console.log('  - 폼 액션:', document.querySelector('.login-form')?.action);
    console.log('  - userType 필드:', document.getElementById('userType')?.value);
    console.log('  - username 값:', document.getElementById('username')?.value);
}

function showHelp() {
    alert(`🔑 AJAX 로그인 도움말

👤 고객 로그인: 일반 사용자 계정
🛡️ 관리자 로그인: admin, manager, supervisor 등

⌨️ 단축키:
• F1: 도움말
• F12: 디버그 정보

🔧 AJAX 로그인:
• 페이지 새로고침 없이 로그인 처리
• 실패 시 즉시 메시지 표시
• 성공 시 자동으로 대시보드 이동

💡 테스트 계정:
• test / test
• admin / admin  
• customer / customer
• manager / manager

🧪 테스트 명령어:
• testLogin() - 기본 로그인 테스트
• testAdminLogin() - 관리자 로그인 테스트
• testFailedLogin() - 실패 로그인 테스트`);
}

// ========================================
// 10. 전역 함수들 및 테스트 함수들
// ========================================
window.detectUserType = detectUserType;
window.togglePassword = togglePassword;
window.showMessage = showMessage;
window.showFindAccount = showFindAccount;
window.showAdminSignupInfo = showAdminSignupInfo;

// 디버그용 함수들
window.debugSpringLogin = function() {
    console.log('🔍 AJAX 로그인 상태:');
    console.log('현재 사용자 타입:', currentUserType);
    console.log('제출 중 여부:', isSubmitting);
    console.log('테스트 모드:', isTestMode());
    console.log('username 값:', document.getElementById('username')?.value);
    console.log('remember-me 체크:', document.getElementById('remember-me')?.checked);

    const form = document.querySelector('.login-form');
    if (form) {
        console.log('폼 데이터:');
        const formData = new FormData(form);
        for (let [key, value] of formData.entries()) {
            console.log(`  ${key}: ${key === 'password' ? '***' : value}`);
        }
    }
};

// 테스트용 메시지 표시 함수들
window.testErrorMessage = function() {
    showLoginError();
    console.log('🧪 에러 메시지 테스트');
};

window.testSuccessMessage = function() {
    showLoginSuccess();
    console.log('🧪 성공 메시지 테스트');
};

window.testLogin = function(username = 'test', password = 'test') {
    console.log('🧪 테스트 로그인 시작');
    document.getElementById('username').value = username;
    document.getElementById('password').value = password;
    detectUserType(username);

    setTimeout(() => {
        document.querySelector('.login-form').dispatchEvent(new Event('submit'));
    }, 500);
};

window.testAdminLogin = function() {
    console.log('🧪 관리자 로그인 테스트');
    testLogin('admin', 'admin');
};

window.testFailedLogin = function() {
    console.log('🧪 실패 로그인 테스트');
    testLogin('wrong', 'wrong');
};

console.log('🎯 AJAX 로그인 시스템 로드 완료!');
console.log('🔧 디버그 명령어:');
console.log('  - debugSpringLogin() : 로그인 상태 확인');
console.log('  - testLogin() : 기본 테스트 로그인 (test/test)');
console.log('  - testAdminLogin() : 관리자 테스트 로그인 (admin/admin)');
console.log('  - testFailedLogin() : 실패 테스트 로그인');
console.log('  - testErrorMessage() : 에러 메시지 테스트');
console.log('  - testSuccessMessage() : 성공 메시지 테스트');
console.log('  - showDebugInfo() : 디버그 정보');
console.log('  - showHelp() : 도움말');
console.log('');
console.log('💡 테스트 계정: test/test, admin/admin, customer/customer, manager/manager');