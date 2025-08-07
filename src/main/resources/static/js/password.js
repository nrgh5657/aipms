document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('password-form');
    const currentPassword = document.getElementById('current-password');
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    const submitBtn = document.getElementById('password-submit-btn');
    const alertContainer = document.getElementById('alert-container');

    // 비밀번호 표시/숨김 토글
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);

            if (targetInput.type === 'password') {
                targetInput.type = 'text';
                this.textContent = '🙈';
            } else {
                targetInput.type = 'password';
                this.textContent = '👁️';
            }
        });
    });

    // 비밀번호 강도 검사
    function checkPasswordStrength(password) {
        let score = 0;
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
        };

        // 요구사항 체크 표시 업데이트
        Object.keys(requirements).forEach(req => {
            const element = document.getElementById(req + '-req');
            if (requirements[req]) {
                element.classList.remove('invalid');
                element.classList.add('valid');
                element.querySelector('.check').textContent = '✓';
                score++;
            } else {
                element.classList.remove('valid');
                element.classList.add('invalid');
                element.querySelector('.check').textContent = '✗';
            }
        });

        return { score, requirements };
    }

    // 비밀번호 강도 표시 업데이트
    function updateStrengthIndicator(score) {
        const strengthFill = document.getElementById('strength-fill');
        const strengthText = document.getElementById('strength-text');

        strengthFill.className = 'strength-fill';
        strengthText.className = 'strength-text';

        if (score === 0) {
            strengthText.textContent = '비밀번호를 입력하세요';
        } else if (score <= 2) {
            strengthFill.classList.add('weak');
            strengthText.classList.add('weak');
            strengthText.textContent = '약함';
        } else if (score === 3) {
            strengthFill.classList.add('fair');
            strengthText.classList.add('fair');
            strengthText.textContent = '보통';
        } else if (score === 4) {
            strengthFill.classList.add('good');
            strengthText.classList.add('good');
            strengthText.textContent = '좋음';
        } else if (score === 5) {
            strengthFill.classList.add('strong');
            strengthText.classList.add('strong');
            strengthText.textContent = '강함';
        }
    }

    // 알림 메시지 표시
    function showAlert(message, type) {
        alertContainer.innerHTML = `
                    <div class="alert ${type}">
                        ${message}
                    </div>
                `;
        alertContainer.querySelector('.alert').style.display = 'block';

        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
    }

    // 입력 검증
    function validateForm() {
        let isValid = true;

        // 현재 비밀번호 검증
        if (!currentPassword.value.trim()) {
            showFieldError('current-password', '현재 비밀번호를 입력해주세요.');
            isValid = false;
        } else {
            clearFieldError('current-password');
        }

        // 새 비밀번호 검증
        const { score, requirements } = checkPasswordStrength(newPassword.value);
        updateStrengthIndicator(score);

        if (!newPassword.value.trim()) {
            showFieldError('new-password', '새 비밀번호를 입력해주세요.');
            isValid = false;
        } else if (score < 5) {
            showFieldError('new-password', '모든 비밀번호 요구사항을 충족해주세요.');
            isValid = false;
        } else {
            clearFieldError('new-password');
        }

        // 비밀번호 확인 검증
        if (!confirmPassword.value.trim()) {
            showFieldError('confirm-password', '비밀번호 확인을 입력해주세요.');
            isValid = false;
        } else if (newPassword.value !== confirmPassword.value) {
            showFieldError('confirm-password', '비밀번호가 일치하지 않습니다.');
            isValid = false;
        } else if (newPassword.value === confirmPassword.value && newPassword.value.trim()) {
            showFieldSuccess('confirm-password', '비밀번호가 일치합니다.');
        }

        // 현재 비밀번호와 새 비밀번호 동일성 검사
        if (currentPassword.value && newPassword.value && currentPassword.value === newPassword.value) {
            showFieldError('new-password', '현재 비밀번호와 다른 비밀번호를 입력해주세요.');
            isValid = false;
        }

        submitBtn.disabled = !isValid;
        return isValid;
    }

    function showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + '-error');
        const successElement = document.getElementById(fieldId + '-success');

        field.classList.add('error');
        field.classList.remove('success');
        errorElement.textContent = message;
        errorElement.style.display = 'block';

        if (successElement) {
            successElement.style.display = 'none';
        }
    }

    function showFieldSuccess(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + '-error');
        const successElement = document.getElementById(fieldId + '-success');

        field.classList.remove('error');
        field.classList.add('success');
        errorElement.style.display = 'none';

        if (successElement) {
            successElement.textContent = message;
            successElement.style.display = 'block';
        }
    }

    function clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + '-error');

        field.classList.remove('error');
        errorElement.style.display = 'none';
    }

    // 실시간 검증
    [currentPassword, newPassword, confirmPassword].forEach(input => {
        input.addEventListener('input', validateForm);
        input.addEventListener('blur', validateForm);
    });

    // 폼 제출 처리
    form.addEventListener('submit', function(e) {


        if (!validateForm()) {
            showAlert('입력 정보를 확인해주세요.', 'error');
            return;
        }

        // 실제 서버 요청 시뮬레이션
        submitBtn.disabled = true;
        submitBtn.textContent = '변경 중...';

        setTimeout(() => {
            // 성공적으로 변경됨을 가정
            showAlert('비밀번호가 성공적으로 변경되었습니다.', 'success');
            form.reset();

            // 비밀번호 강도 표시기 초기화
            updateStrengthIndicator(0);

            // 요구사항 체크리스트 초기화
            document.querySelectorAll('.requirement-item').forEach(item => {
                item.classList.remove('valid');
                item.classList.add('invalid');
                item.querySelector('.check').textContent = '✗';
            });

            submitBtn.textContent = '비밀번호 변경';
            submitBtn.disabled = true;
        }, 2000);
    });

    // 초기 검증 실행
    validateForm();
});