class ConfirmUpdateManager {
    constructor(formId, submitBtnId) {
        this.form = document.getElementById(formId);
        this.submitBtn = document.getElementById(submitBtnId);
        this.confirmModal = document.getElementById('confirmUpdateModal');
        this.confirmYesBtn = document.getElementById('confirmYes');
        this.confirmCancelBtn = document.getElementById('confirmCancel');
        this.init();
    }

    init() {
        if (!this.form || !this.submitBtn || !this.confirmModal) {
            console.error('폼 또는 버튼 또는 모달을 찾을 수 없습니다.');
            return;
        }

        this.submitBtn.disabled = false;

        this.submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.showConfirmModal();
        });

        this.confirmYesBtn.addEventListener('click', () => {
            this.hideConfirmModal();
            this.form.submit();
        });

        this.confirmCancelBtn.addEventListener('click', () => {
            this.hideConfirmModal();
        });

        this.confirmModal.addEventListener('click', (e) => {
            if (e.target === this.confirmModal) {
                this.hideConfirmModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideConfirmModal();
            }
        });
    }

    showConfirmModal() {
        this.confirmModal.style.display = 'flex';
        this.confirmModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideConfirmModal() {
        this.confirmModal.style.display = 'none';
        this.confirmModal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// 성공 모달 닫기 (선택)
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    document.body.style.overflow = '';
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    new ConfirmUpdateManager('profile-form', 'profile-submit-btn');
});
