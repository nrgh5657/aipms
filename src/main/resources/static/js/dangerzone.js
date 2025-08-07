class DangerZoneManager {
    constructor() {
        this.form = document.getElementById('deleteForm');
        this.deleteBtn = document.getElementById('deleteBtn');
        this.modal = document.getElementById('confirmModal');
        this.confirmBtn = document.getElementById('confirmBtn');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.dangerItem = document.querySelector('.danger-item');
        this.currentStep = 0;

        this.init();
    }

    init() {
        if (!this.form || !this.deleteBtn || !this.modal || !this.confirmBtn || !this.cancelBtn) {
            console.warn('[DangerZoneManager] 필수 DOM 요소가 누락되어 초기화를 건너뜁니다.');
            return;
        }

        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.showFirstConfirmation();
        });

        this.confirmBtn.addEventListener('click', () => this.handleConfirm());
        this.cancelBtn.addEventListener('click', () => {
            this.hideModal();
            this.resetState();
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
                this.resetState();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                this.hideModal();
                this.resetState();
            }
        });

        this.deleteBtn.addEventListener('mouseenter', () => this.addWarningEffect());
    }

    showFirstConfirmation() {
        this.currentStep = 1;
        this.updateModalContent({
            icon: '⚠️',
            title: '계정 삭제 확인',
            message: '정말로 계정을 삭제하시겠습니까?<br><strong style="color:red;">이 작업은 되돌릴 수 없습니다.</strong>',
            confirmText: '예, 삭제합니다',
            confirmClass: 'confirm-first'
        });
        this.showModal();
    }

    showFinalConfirmation() {
        this.currentStep = 2;
        this.updateModalContent({
            icon: '🚨',
            title: '최종 확인',
            message: '정말로 삭제하시겠습니까?<br><strong style="color:#dc2626;">복구할 수 없습니다!</strong>',
            confirmText: '최종 삭제',
            confirmClass: 'confirm-final'
        });

        if (this.dangerItem) {
            this.dangerItem.classList.add('shake');
            setTimeout(() => this.dangerItem.classList.remove('shake'), 600);
        }
    }

    handleConfirm() {
        if (this.currentStep === 1) {
            this.showFinalConfirmation();
        } else if (this.currentStep === 2) {
            this.executeDelete();
        }
    }

    updateModalContent({ icon, title, message, confirmText, confirmClass }) {
        this.modal.querySelector('.modal-icon').textContent = icon;
        this.modal.querySelector('.modal-title').textContent = title;
        this.modal.querySelector('.modal-message').innerHTML = message;

        this.confirmBtn.textContent = confirmText;
        this.confirmBtn.className = `modal-btn confirm ${confirmClass}`;
    }

    showModal() {
        this.modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        setTimeout(() => this.cancelBtn.focus(), 300);
    }

    hideModal() {
        this.modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    resetState() {
        this.currentStep = 0;
        this.confirmBtn.removeAttribute('style');
    }

    executeDelete() {
        this.hideModal();
        this.deleteBtn.classList.add('loading');
        this.deleteBtn.textContent = '삭제 중...';
        this.deleteBtn.disabled = true;

        this.showToast('🔄 계정 삭제를 처리하고 있습니다...', 'info');

        setTimeout(() => {
            fetch('/member/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('input[name="_csrf"]')?.value || ''
                },
                body: JSON.stringify({ confirm: true })
            })
                .then(response => {
                    if (response.ok) {
                        this.showSuccessMessage();
                    } else {
                        return response.json().then(data => {
                            this.showErrorMessage(data.message || '삭제 실패');
                        });
                    }
                })
                .catch(() => this.showErrorMessage('서버 오류가 발생했습니다.'));
        }, 2000);
    }

    showSuccessMessage() {
        this.deleteBtn.classList.remove('loading');
        this.deleteBtn.textContent = '삭제 완료';
        this.deleteBtn.style.background = '#10b981';

        this.showToast('✅ 계정이 성공적으로 삭제되었습니다', 'success');

        setTimeout(() => {
            window.location.href = '/login';
        }, 3000);
    }

    showErrorMessage(msg = '❌ 삭제 중 오류가 발생했습니다.') {
        this.deleteBtn.classList.remove('loading');
        this.deleteBtn.textContent = '회원 탈퇴';
        this.deleteBtn.disabled = false;
        this.showToast(msg, 'error');
    }

    showToast(message, type = 'warning') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
            background: #333;
            color: #fff;
            padding: 1rem 2rem;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            font-size: 0.9rem;
        `;

        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 4000);
    }

    addWarningEffect() {
        if (this.currentStep > 0) return;

        const existing = this.deleteBtn.querySelector('.warning-tooltip');
        if (existing) existing.remove();

        const tooltip = document.createElement('div');
        tooltip.className = 'warning-tooltip';
        tooltip.textContent = '⚠️ 신중히 삭제를 진행하세요!';
        tooltip.style.cssText = `
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: #f59e0b;
            color: #fff;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.8rem;
            white-space: nowrap;
            z-index: 100;
        `;

        this.deleteBtn.style.position = 'relative';
        this.deleteBtn.appendChild(tooltip);

        const remove = () => tooltip.remove();
        this.deleteBtn.addEventListener('mouseleave', remove, { once: true });
        setTimeout(remove, 3000);
    }
}

// 안전한 DOM 로드 이후 실행
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('deleteForm');
    if (form) {
        new DangerZoneManager();
    }
});
