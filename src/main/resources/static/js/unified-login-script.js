// ========================================
// 스마트파킹 로그인 시스템 - 완전 재작성
// ========================================

console.log('🚀 스마트파킹 로그인 시스템 시작');

// 전역 변수
let currentUserType = null;
let pendingAdminLogin = false;

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
        const idInput = document.getElementById('unified-id');
        if (idInput) {
            idInput.focus();
            console.log('🎯 아이디 필드에 포커스 설정');
        }
    }, 500);
    
    console.log('✅ 초기화 완료');
});

// ========================================
// 2. 이벤트 리스너 설정
// ========================================
function setupEventListeners() {
    console.log('🔗 이벤트 리스너 설정 중...');
    
    // 로그인 폼 이벤트
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
        console.log('📝 로그인 폼 이벤트 연결');
    }
    
    // 아이디 입력 이벤트
    const idInput = document.getElementById('unified-id');
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
    
    // 소셜 로그인 버튼들
    const kakaoBtn = document.getElementById('kakao-btn');
    const naverBtn = document.getElementById('naver-btn');
    
    if (kakaoBtn) {
        kakaoBtn.addEventListener('click', () => socialLogin('kakao'));
        console.log('💛 카카오 버튼 이벤트 연결');
    }
    
    if (naverBtn) {
        naverBtn.addEventListener('click', () => socialLogin('naver'));
        console.log('🟢 네이버 버튼 이벤트 연결');
    }
    
    // 키보드 단축키
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F1') {
            e.preventDefault();
            showHelp();
        } else if (e.key === 'F12') {
            e.preventDefault();
            showDebugInfo();
        } else if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            const loginBtn = document.getElementById('login-btn');
            if (loginBtn) loginBtn.click();
        }
    });
    
    console.log('⌨️ 키보드 단축키 연결');
}

// ========================================
// 3. 사용자 타입 감지
// ========================================
function detectUserType(userId) {
    console.log('🔍 사용자 타입 감지:', userId);
    
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
// 4. 로그인 처리
// ========================================
function handleLogin(event) {
    event.preventDefault();
    console.log('🔐 로그인 처리 시작');
    
    const id = document.getElementById('unified-id').value.trim();
    const password = document.getElementById('unified-password').value;
    const remember = document.getElementById('remember-login').checked;
    
    console.log('📝 입력 정보:', { id, password: '***', remember, userType: currentUserType });
    
    // 입력 검증
    if (!id) {
        console.log('❌ 아이디 없음');
        showMessage('아이디를 입력해주세요.', 'error');
        return;
    }
    
    if (!password) {
        console.log('❌ 비밀번호 없음');
        showMessage('비밀번호를 입력해주세요.', 'error');
        return;
    }
    
    // 관리자 로그인 시 경고
    if (currentUserType === 'admin') {
        console.log('🛡️ 관리자 로그인 감지 - 경고 모달 준비');
        
        // 데이터 안전하게 저장
        pendingAdminLogin = {
            id: id,
            password: password,
            remember: remember
        };
        
        console.log('💾 pendingAdminLogin 저장됨:', { 
            id: pendingAdminLogin.id, 
            password: '***', 
            remember: pendingAdminLogin.remember 
        });
        
        // 전역 변수에도 백업 저장
        window.adminLoginBackup = {
            id: id,
            password: password,
            remember: remember
        };
        
        console.log('🔒 전역 백업도 저장됨');
        
        showAdminWarning();
        return;
    }
    
    // 일반 로그인 처리
    console.log('👤 고객 로그인 처리');
    processLogin(id, password, remember, currentUserType || 'customer');
}

function processLogin(id, password, remember, userType) {
    console.log('⚙️ 로그인 처리 실행:', { id, userType });
    console.log('🔍 입력된 비밀번호 길이:', password.length);
    
    // 로딩 상태
    setLoadingState(true);
    
    setTimeout(() => {
        console.log('🧪 자격증명 검증 시작...');
        const isValid = validateCredentials(id, password, userType);
        console.log('✅ 로그인 검증 결과:', isValid);
        
        if (isValid) {
            console.log('🎉 로그인 성공! 성공 처리 시작...');
            const userData = { id, name: getUserName(id, userType), role: userType };
            console.log('👤 사용자 데이터:', userData);
            handleLoginSuccess(userType, userData, remember);
        } else {
            console.log('❌ 로그인 실패! 실패 처리 시작...');
            handleLoginFailure('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
        
        setLoadingState(false);
    }, 1500);
}

// ========================================
// 5. 로그인 검증
// ========================================
function validateCredentials(id, password, userType) {
    console.log('🔍 자격증명 검증:', { id, userType });
    
    const accounts = {
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
    
    const validAccounts = accounts[userType] || accounts.customer;
    const result = validAccounts.some(account => 
        account.id.toLowerCase() === id.toLowerCase() && account.password === password
    );
    
    console.log('📋 유효한 계정들:', validAccounts);
    console.log('🔑 검증 결과:', result);
    
    return result;
}

// ========================================
// 6. 로그인 성공/실패 처리
// ========================================
function handleLoginSuccess(userType, userData, remember) {
    console.log('🎊 로그인 성공 처리 시작:', { userType, userData });
    
    try {
        // 성공 모달 표시
        console.log('📱 성공 모달 표시 시도...');
        showSuccessModal(userType);
        console.log('✅ 성공 모달 표시 완료');
        
        // 로그인 정보 저장
        const loginData = {
            user: userData,
            role: userType,
            loginTime: new Date().toISOString(),
            remember: remember
        };
        
        console.log('💾 로그인 정보 저장 중:', loginData);
        
        if (remember) {
            localStorage.setItem('smartParkingLogin', JSON.stringify(loginData));
            console.log('✅ localStorage에 저장 완료');
        } else {
            sessionStorage.setItem('smartParkingLogin', JSON.stringify(loginData));
            console.log('✅ sessionStorage에 저장 완료');
        }
        
        // 페이지 이동 (2초 후)
        console.log('⏰ 2초 후 페이지 이동 예약됨');
        setTimeout(() => {
            console.log('🚀 페이지 이동 타임아웃 실행!');
            redirectToPage(userType);
        }, 2000);
        
        console.log('🎯 로그인 성공 처리 완료');
        
    } catch (error) {
        console.error('💥 로그인 성공 처리 중 오류:', error);
        alert(`로그인 성공 처리 중 오류가 발생했습니다: ${error.message}`);
    }
}

function handleLoginFailure(message) {
    console.log('💥 로그인 실패:', message);
    
    showMessage(message, 'error');
    
    // 비밀번호 필드 초기화
    const passwordField = document.getElementById('unified-password');
    if (passwordField) {
        passwordField.value = '';
        passwordField.focus();
    }
    
    // 폼 흔들기 효과
    const form = document.querySelector('.login-form');
    if (form) {
        form.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            form.style.animation = '';
        }, 500);
    }
}

// ========================================
// 7. 페이지 이동
// ========================================
function redirectToPage(userType) {
    console.log('🚀 페이지 이동 함수 시작:', userType);
    console.log('📍 현재 위치:', window.location.href);
    
    let targetPage;
    if (userType === 'admin') {
        targetPage = '/admin-dashboard';
        console.log('🛡️ 관리자 페이지로 이동 결정');
    } else {
        targetPage = '/my-records';
        console.log('👤 고객 페이지로 이동 결정');
    }
    
    console.log('🎯 목표 페이지:', targetPage);
    
    try {
        console.log('📤 첫 번째 이동 시도: window.location.href');
        window.location.href = targetPage;
        console.log('✅ window.location.href 명령 실행됨');
        
        // 백업 방법들
        setTimeout(() => {
            console.log('🔄 백업 방법 1: window.location.assign');
            try {
                window.location.assign(targetPage);
                console.log('✅ window.location.assign 실행됨');
            } catch (e) {
                console.error('❌ window.location.assign 실패:', e);
            }
        }, 1000);
        
        setTimeout(() => {
            console.log('🔄 백업 방법 2: window.location.replace');
            try {
                window.location.replace(targetPage);
                console.log('✅ window.location.replace 실행됨');
            } catch (e) {
                console.error('❌ window.location.replace 실패:', e);
            }
        }, 2000);
        
        // 3초 후에도 페이지가 이동하지 않았다면 알림
        setTimeout(() => {
            console.error('❌ 모든 페이지 이동 방법 실패');
            console.log('🔍 파일 존재 여부 확인 중...');
            
            // 파일 존재 여부 확인
            fetch(targetPage, { method: 'HEAD' })
                .then(response => {
                    console.log('📄 파일 응답 코드:', response.status);
                    if (response.ok) {
                        console.log('✅ 파일 존재 확인됨');
                        alert(`파일은 존재하지만 페이지 이동에 실패했습니다.\n\n목표: ${targetPage}\n\n브라우저 보안 정책이나 로컬 파일 접근 제한 때문일 수 있습니다.\n\n수동으로 ${targetPage}를 열어보세요.`);
                    } else {
                        console.error('❌ 파일이 존재하지 않음');
                        alert(`파일을 찾을 수 없습니다!\n\n찾는 파일: ${targetPage}\n현재 위치: ${window.location.href}\n\n${targetPage} 파일을 같은 폴더에 생성해주세요.`);
                    }
                })
                .catch(error => {
                    console.error('❌ 파일 확인 실패:', error);
                    alert(`페이지 이동에 실패했습니다.\n\n목표: ${targetPage}\n오류: ${error.message}\n\n수동으로 해당 파일을 확인해주세요.`);
                });
        }, 3000);
        
    } catch (error) {
        console.error('💥 페이지 이동 중 치명적 오류:', error);
        alert(`페이지 이동 중 오류가 발생했습니다:\n${error.message}\n\n수동으로 ${targetPage}에 접근해주세요.`);
    }
}

// ========================================
// 8. UI 헬퍼 함수들
// ========================================
function showSuccessModal(userType) {
    const modal = document.getElementById('success-modal');
    const icon = document.getElementById('success-icon');
    const title = document.getElementById('success-title');
    const message = document.getElementById('success-message');
    
    if (!modal || !icon || !title || !message) {
        console.warn('⚠️ 성공 모달 요소를 찾을 수 없음');
        return;
    }
    
    if (userType === 'admin') {
        icon.textContent = '🛡️';
        title.textContent = '관리자 인증 완료!';
        message.textContent = '관리자 대시보드로 이동합니다...';
    } else {
        icon.textContent = '✅';
        title.textContent = '로그인 성공!';
        message.textContent = '마이페이지로 이동합니다...';
    }
    
    modal.style.display = 'flex';
    console.log('📱 성공 모달 표시됨');
}

function showAdminWarning() {
    console.log('⚠️ 관리자 경고 모달 표시 함수 호출됨');
    const modal = document.getElementById('admin-warning-modal');
    
    if (modal) {
        console.log('✅ 관리자 경고 모달 요소 찾음');
        modal.style.display = 'flex';
        console.log('📱 관리자 경고 모달 표시 완료');
        
        // 모달 내부 버튼들 확인
        const continueBtn = modal.querySelector('.continue-btn');
        const cancelBtn = modal.querySelector('.cancel-btn');
        console.log('🔘 계속 진행 버튼:', continueBtn);
        console.log('🔘 취소 버튼:', cancelBtn);
    } else {
        console.error('❌ 관리자 경고 모달 요소를 찾을 수 없음!');
        // 모달이 없으면 바로 로그인 진행
        console.log('🔄 모달 없음 - 바로 관리자 로그인 진행');
        if (pendingAdminLogin) {
            const { id, password, remember } = pendingAdminLogin;
            processLogin(id, password, remember, 'admin');
            pendingAdminLogin = false;
        }
    }
}

function continueAdminLogin() {
    console.log('🔓 관리자 로그인 계속 진행 버튼 클릭됨');
    console.log('📋 pendingAdminLogin 상태:', pendingAdminLogin);
    console.log('🔒 전역 백업 상태:', window.adminLoginBackup);
    
    closeAdminWarning();
    
    let loginData = null;
    
    // 1차: pendingAdminLogin 확인
    if (pendingAdminLogin && pendingAdminLogin.id && pendingAdminLogin.password) {
        console.log('✅ pendingAdminLogin 사용');
        loginData = pendingAdminLogin;
    }
    // 2차: 전역 백업 확인  
    else if (window.adminLoginBackup && window.adminLoginBackup.id && window.adminLoginBackup.password) {
        console.log('🔒 전역 백업 사용');
        loginData = window.adminLoginBackup;
    }
    // 3차: 입력 필드에서 직접 가져오기
    else {
        console.log('🔄 입력 필드에서 직접 가져오기');
        const id = document.getElementById('unified-id').value.trim();
        const password = document.getElementById('unified-password').value;
        const remember = document.getElementById('remember-login').checked;
        
        if (id && password) {
            loginData = { id, password, remember };
            console.log('📝 입력 필드 데이터 사용');
        }
    }
    
    if (loginData && loginData.id && loginData.password) {
        console.log('🛡️ 관리자 로그인 진행:', { 
            id: loginData.id, 
            password: '***', 
            remember: loginData.remember 
        });
        
        processLogin(loginData.id, loginData.password, loginData.remember, 'admin');
        
        // 사용된 데이터 정리
        pendingAdminLogin = false;
        window.adminLoginBackup = null;
    } else {
        console.error('❌ 모든 방법으로 로그인 데이터를 찾을 수 없음');
        alert('로그인 정보를 다시 입력하고 시도해주세요.');
        
        // 입력 필드 초기화하고 포커스
        const idInput = document.getElementById('unified-id');
        const passwordInput = document.getElementById('unified-password');
        
        if (idInput) {
            idInput.value = '';
            idInput.focus();
        }
        if (passwordInput) {
            passwordInput.value = '';
        }
    }
}

function closeAdminWarning() {
    const modal = document.getElementById('admin-warning-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    pendingAdminLogin = false;
}

function setLoadingState(isLoading) {
    const btn = document.getElementById('login-btn');
    const btnText = btn?.querySelector('.btn-text');
    const btnLoading = btn?.querySelector('.btn-loading');
    
    if (!btn || !btnText || !btnLoading) return;
    
    if (isLoading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
        btn.disabled = true;
        console.log('⏳ 로딩 상태 활성화');
    } else {
        btnText.style.display = 'block';
        btnLoading.style.display = 'none';
        btn.disabled = false;
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
    `;
    
    // 애니메이션 스타일 추가
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
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
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
}

// ========================================
// 9. 기타 기능들
// ========================================
function togglePassword() {
    const input = document.getElementById('unified-password');
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

function socialLogin(provider) {
    console.log(`🔗 ${provider} 소셜 로그인 시작`);
    showMessage(`${provider === 'kakao' ? '카카오' : '네이버'} 로그인 중...`, 'info');
    
    setTimeout(() => {
        console.log(`✅ ${provider} 로그인 성공`);
        showMessage(`${provider === 'kakao' ? '카카오' : '네이버'} 로그인 성공!`, 'success');
        
        setTimeout(() => {
            window.location.href = 'my-records.html';
        }, 1000);
    }, 2000);
}

function getUserName(id, userType) {
    const names = {
        customer: { customer: '김고객', test: '테스트', demo: '데모', user: '사용자', guest: '게스트' },
        admin: { admin: '시스템관리자', manager: '주차관리팀', supervisor: '관리감독자', security: '보안관리팀', system: '시스템운영자', operator: '운영담당자' }
    };
    
    return names[userType]?.[id] || (userType === 'admin' ? '관리자님' : '고객님');
}

function animatePageLoad() {
    const elements = document.querySelectorAll('.login-card, .service-preview, .demo-notice');
    elements.forEach((el, index) => {
        if (el) {
            el.style.opacity = '0';
            el.style.transform = index === 0 ? 'translateX(-30px)' : index === 1 ? 'translateX(30px)' : 'translateY(30px)';
            
            setTimeout(() => {
                el.style.transition = 'all 0.6s ease';
                el.style.opacity = '1';
                el.style.transform = 'translate(0)';
            }, 100 + (index * 150));
        }
    });
}

// ========================================
// 10. 디버그 및 도움말
// ========================================
function showDebugInfo() {
    const debugInfo = `
        <div style="font-family: monospace; background: #f5f5f5; padding: 1rem; border-radius: 8px; text-align: left;">
            <h3>🔍 디버그 정보</h3>
            <p><strong>현재 사용자 타입:</strong> ${currentUserType || '감지되지 않음'}</p>
            <p><strong>현재 URL:</strong> ${window.location.href}</p>
            
            <h4>🧪 빠른 테스트</h4>
            <button onclick="quickAdminTest()" style="margin: 0.25rem; padding: 0.5rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">관리자 로그인 테스트</button>
            <button onclick="quickCustomerTest()" style="margin: 0.25rem; padding: 0.5rem; background: #10b981; color: white; border: none; border-radius: 4px; cursor: pointer;">고객 로그인 테스트</button>
            <button onclick="testPageRedirect()" style="margin: 0.25rem; padding: 0.5rem; background: #8b5cf6; color: white; border: none; border-radius: 4px; cursor: pointer;">페이지 이동 테스트</button>
            
            <h4>📋 테스트 계정</h4>
            <p><strong>관리자:</strong> admin/admin, manager/1234, supervisor/super</p>
            <p><strong>고객:</strong> customer/1234, test/test, demo/demo</p>
        </div>
    `;
    
    showModal('디버그 정보', debugInfo);
}

function quickAdminTest() {
    closeModal();
    document.getElementById('unified-id').value = 'admin';
    document.getElementById('unified-password').value = 'admin';
    detectUserType('admin');
    setTimeout(() => document.querySelector('.login-btn').click(), 500);
}

function quickCustomerTest() {
    closeModal();
    document.getElementById('unified-id').value = 'customer';
    document.getElementById('unified-password').value = '1234';
    detectUserType('customer');
    setTimeout(() => document.querySelector('.login-btn').click(), 500);
}

function testPageRedirect() {
    closeModal();
    const choice = confirm('관리자 페이지로 이동하시겠습니까?\n(취소하면 고객 페이지로 이동)');
    redirectToPage(choice ? 'admin' : 'customer');
}

function showHelp() {
    const helpContent = `
        <div style="max-width: 600px;">
            <h2 style="color: #374151; margin-bottom: 1rem;">🔑 로그인 도움말</h2>
            
            <h3 style="color: #10b981;">👤 고객 계정</h3>
            <ul>
                <li>customer / 1234</li>
                <li>test / test</li>
                <li>demo / demo</li>
            </ul>
            
            <h3 style="color: #ef4444;">🛡️ 관리자 계정</h3>
            <ul>
                <li>admin / admin</li>
                <li>manager / 1234</li>
                <li>supervisor / super</li>
            </ul>
            
            <h3 style="color: #3b82f6;">⌨️ 단축키</h3>
            <ul>
                <li>F1: 도움말</li>
                <li>F12: 디버그 정보</li>
                <li>Ctrl+Enter: 로그인</li>
            </ul>
        </div>
    `;
    
    showModal('도움말', helpContent);
}

function showModal(title, content) {
    // 기존 모달 제거
    const existingModal = document.getElementById('debug-modal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'debug-modal';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 10000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 90%; max-height: 90%; overflow: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 style="margin: 0; color: #374151;">${title}</h2>
                <button onclick="closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">✕</button>
            </div>
            ${content}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // 외부 클릭으로 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function closeModal() {
    const modal = document.getElementById('debug-modal');
    if (modal) modal.remove();
}

// ========================================
// 전역 함수들 (HTML에서 호출용)
// ========================================
window.handleUnifiedLogin = handleLogin;
window.detectUserType = detectUserType;
window.continueAdminLogin = continueAdminLogin;
window.closeAdminWarning = closeAdminWarning;
window.togglePassword = function(inputId) {
    console.log('👁️ 비밀번호 토글:', inputId);
    togglePassword();
};
window.showFindAccount = function() {
    console.log('🔍 계정 찾기 요청');
    alert('계정 찾기 서비스\n\n📧 support@smartparking.com\n📞 1588-1234');
};
window.showAdminSignupInfo = function() {
    console.log('👮 관리자 신청 정보 요청');
    alert('관리자 계정 신청\n\n📞 02-1234-5678\n📧 admin@smartparking.com');
};
window.quickAdminTest = quickAdminTest;
window.quickCustomerTest = quickCustomerTest;
window.testPageRedirect = testPageRedirect;
window.closeModal = closeModal;

window.testAdminFlow = function() {
    console.log('🧪 관리자 로그인 전체 플로우 테스트');
    console.log('1️⃣ 아이디/비밀번호 입력');
    document.getElementById('unified-id').value = 'admin';
    document.getElementById('unified-password').value = 'admin';
    
    console.log('2️⃣ 사용자 타입 감지');
    detectUserType('admin');
    
    setTimeout(() => {
        console.log('3️⃣ 로그인 버튼 클릭');
        document.querySelector('.login-btn').click();
    }, 500);
};

window.quickAdminLogin = function() {
    console.log('🚀 빠른 관리자 로그인 (모달 자동 처리)');
    
    // 1단계: 입력
    document.getElementById('unified-id').value = 'admin';
    document.getElementById('unified-password').value = 'admin';
    detectUserType('admin');
    
    // 2단계: 로그인 버튼 클릭
    setTimeout(() => {
        document.querySelector('.login-btn').click();
        
        // 3단계: 모달이 뜨면 자동으로 "계속 진행" 클릭
        setTimeout(() => {
            const continueBtn = document.querySelector('.continue-btn');
            if (continueBtn) {
                console.log('🔘 자동으로 "계속 진행" 버튼 클릭');
                continueBtn.click();
            } else {
                console.log('⚠️ 계속 진행 버튼을 찾을 수 없음');
                // 함수 직접 호출
                continueAdminLogin();
            }
        }, 1000);
    }, 500);
};

window.debugAdminData = function() {
    console.log('🔍 관리자 로그인 데이터 상태 확인:');
    console.log('📋 pendingAdminLogin:', pendingAdminLogin);
    console.log('🔒 window.adminLoginBackup:', window.adminLoginBackup);
    console.log('📝 입력 필드 상태:');
    console.log('  - ID:', document.getElementById('unified-id').value);
    console.log('  - Password:', document.getElementById('unified-password').value ? '***' : '(비어있음)');
    console.log('  - Remember:', document.getElementById('remember-login').checked);
    console.log('🎭 현재 사용자 타입:', currentUserType);
};

window.testAdminModal = function() {
    console.log('🧪 관리자 모달 직접 테스트');
    pendingAdminLogin = { id: 'admin', password: 'admin', remember: false };
    window.adminLoginBackup = { id: 'admin', password: 'admin', remember: false };
    showAdminWarning();
};

window.testContinueAdmin = function() {
    console.log('🧪 관리자 계속 진행 직접 테스트');
    pendingAdminLogin = { id: 'admin', password: 'admin', remember: false };
    window.adminLoginBackup = { id: 'admin', password: 'admin', remember: false };
    continueAdminLogin();
};

window.checkAdminElements = function() {
    console.log('🔍 관리자 관련 요소들 확인:');
    const modal = document.getElementById('admin-warning-modal');
    const continueBtn = document.querySelector('.continue-btn');
    const cancelBtn = document.querySelector('.cancel-btn');
    
    console.log('관리자 경고 모달:', modal);
    console.log('계속 진행 버튼:', continueBtn);
    console.log('취소 버튼:', cancelBtn);
    
    if (modal) {
        console.log('모달 표시 상태:', modal.style.display);
        console.log('모달 HTML:', modal.innerHTML.substring(0, 200) + '...');
    }
    
    if (continueBtn) {
        console.log('계속 진행 버튼 onclick:', continueBtn.getAttribute('onclick'));
    }
};

window.forceAdminLogin = function() {
    console.log('🧪 강제 관리자 로그인 (모달 우회)');
    processLogin('admin', 'admin', false, 'admin');
};

// 기존 디버그 함수들 유지...
window.testLogin = function() {
    console.log('🧪 수동 로그인 테스트');
    const id = prompt('아이디를 입력하세요:', 'customer');
    const password = prompt('비밀번호를 입력하세요:', '1234');
    
    if (id && password) {
        console.log('📝 테스트 로그인 시도:', { id, password: '***' });
        document.getElementById('unified-id').value = id;
        document.getElementById('unified-password').value = password;
        detectUserType(id);
        
        setTimeout(() => {
            console.log('🔘 로그인 버튼 클릭 시뮬레이션');
            document.querySelector('.login-btn').click();
        }, 500);
    }
};

window.testCustomerLogin = function() {
    console.log('🧪 고객 로그인 직접 테스트');
    document.getElementById('unified-id').value = 'customer';
    document.getElementById('unified-password').value = '1234';
    detectUserType('customer');
    
    setTimeout(() => {
        console.log('🔘 고객 로그인 버튼 클릭');
        document.querySelector('.login-btn').click();
    }, 500);
};

window.testWrongPassword = function() {
    console.log('🧪 틀린 비밀번호 테스트');
    document.getElementById('unified-id').value = 'customer';
    document.getElementById('unified-password').value = 'wrong';
    detectUserType('customer');
    
    setTimeout(() => {
        console.log('🔘 틀린 비밀번호로 로그인 시도');
        document.querySelector('.login-btn').click();
    }, 500);
};

window.checkValidation = function() {
    console.log('🔍 검증 함수 직접 테스트');
    console.log('customer/1234 검증:', validateCredentials('customer', '1234', 'customer'));
    console.log('customer/wrong 검증:', validateCredentials('customer', 'wrong', 'customer'));
    console.log('admin/admin 검증:', validateCredentials('admin', 'admin', 'admin'));
    console.log('admin/wrong 검증:', validateCredentials('admin', 'wrong', 'admin'));
};

window.checkElements = function() {
    console.log('🔍 페이지 요소들 확인:');
    console.log('로그인 폼:', document.querySelector('.login-form'));
    console.log('아이디 입력:', document.getElementById('unified-id'));
    console.log('비밀번호 입력:', document.getElementById('unified-password'));
    console.log('로그인 버튼:', document.getElementById('login-btn'));
    console.log('관리자 경고 모달:', document.getElementById('admin-warning-modal'));
    console.log('성공 모달:', document.getElementById('success-modal'));
};

console.log('🎯 스마트파킹 로그인 시스템 로드 완료!');
console.log('🔧 디버그 명령어:');
console.log('  🧪 일반 테스트:');
console.log('    - checkElements() : 페이지 요소 확인');
console.log('    - testLogin() : 수동 로그인 테스트');
console.log('    - testCustomerLogin() : 고객 로그인 테스트');
console.log('    - testWrongPassword() : 틀린 비밀번호 테스트');
console.log('    - checkValidation() : 검증 함수 테스트');
console.log('  🛡️ 관리자 전용 테스트:');
console.log('    - quickAdminLogin() : 원클릭 관리자 로그인');
console.log('    - testAdminFlow() : 관리자 전체 플로우');
console.log('    - debugAdminData() : 관리자 데이터 상태 확인');
console.log('    - testAdminModal() : 관리자 모달 테스트');
console.log('    - testContinueAdmin() : 계속 진행 테스트');
console.log('    - checkAdminElements() : 관리자 요소 확인');
console.log('    - forceAdminLogin() : 강제 관리자 로그인');