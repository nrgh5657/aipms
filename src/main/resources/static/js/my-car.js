// 전역 등록으로 수정된 부분
window.openVehicleModal = function(title = '차량 정보 등록') {
    document.getElementById('vehicle-modal').style.display = 'block';
    document.getElementById('vehicle-modal-title').textContent = title;
    document.getElementById('vehicle-form').reset();
    document.querySelectorAll('.form-group').forEach(el => el.classList.remove('error', 'success'));
    if (window.vehicleManager) window.vehicleManager.currentEditId = null;
};

function closeVehicleModal() {
    document.getElementById('vehicle-modal').style.display = 'none';
}

class VehicleManager {
    constructor() {
        this.vehicles = [];
        this.currentEditId = null;
        this.isComposing = false; // 🔸 한글 조합 상태 변수 추가
        this.init();
    }

    init() {
        this.loadVehicles();

        const carNumberInput = document.getElementById('car-number');
        if (carNumberInput) {
            carNumberInput.addEventListener('input', (e) => this.formatCarNumber(e.target));
            carNumberInput.addEventListener('compositionstart', () => this.isComposing = true); // 🔸 조합 시작
            carNumberInput.addEventListener('compositionend', () => {
                this.isComposing = false; // 🔸 조합 종료 후
                this.formatCarNumber(carNumberInput); // 🔸 다시 포맷
            });
        }

        document.getElementById('vehicle-form')
            .addEventListener('submit', (e) => this.handleFormSubmit(e));

        this.setupFormValidation();
    }

    loadVehicles() {
        fetch('/api/cars/my', {
            method: 'GET',
            credentials: 'include'
        })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(data => {
                // 차량 번호(carNumber) 기준 중복 제거
                const uniqueMap = new Map();
                data.forEach(car => {
                    if (!uniqueMap.has(car.carNumber)) {
                        uniqueMap.set(car.carNumber, car);
                    }
                });
                this.vehicles = Array.from(uniqueMap.values());
                this.renderVehicleList();
            })
            .catch(() => {
                this.vehicles = [];
                this.renderVehicleList();
                this.showToast('차량 정보를 불러오지 못했습니다', 'error');
            });
    }


    renderVehicleList() {
        const list = document.getElementById('vehicle-list');
        if (this.vehicles.length === 0) {
            list.innerHTML = `
                <div style="text-align:center;padding:2rem;">
                    <div style="font-size:2rem;">🚗</div>
                    <h4 style="margin:1rem 0 0.5rem;">등록된 차량이 없습니다</h4>
                    <p style="color:#718096;">아래 버튼을 눌러 차량을 등록해보세요.</p>
                    <button class="add-btn" onclick="openVehicleModal()" style="margin-top:1rem;">
                        🚘 첫 차량 등록하기
                    </button>
                </div>
            `;
        } else {
            list.innerHTML = this.vehicles.map(v => this.getVehicleItemHTML(v)).join('');
        }
    }

    getVehicleItemHTML(vehicle) {
        const primary = vehicle.isPrimary ? 'primary' : '';
        const canSetPrimary = !vehicle.isPrimary && this.vehicles.length > 1;
        return `
            <div class="vehicle-item ${primary}">
                <div class="vehicle-info">
                    <div class="vehicle-icon">🚙</div>
                    <div class="vehicle-details">
                        <h4>
                            <span class="vehicle-number">${vehicle.carNumber}</span>
                           
                        </h4>
                        <div class="vehicle-specs">
                         <span>${vehicle.carType || '승용차'}</span>
                        </div>

                        <p>등록일: ${this.formatDate(vehicle.regDate)}</p>
                    </div>
                </div>
                <div class="vehicle-actions">
                    ${canSetPrimary ? `<button onclick="vehicleManager.setPrimaryVehicle(${vehicle.carId})">주 차량 설정</button>` : ''}
                    
                    <button onclick="vehicleManager.confirmDeleteVehicle(${vehicle.carId})">삭제</button>
                </div>
            </div>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    formatCarNumber(input) {
        if (this.isComposing) return; // 🔸 한글 조합 중일 땐 처리 안 함

        const cursor = input.selectionStart;
        let value = input.value.replace(/[^0-9가-힣]/g, '');

        if (value.length <= 8) {
            input.value = value;
            input.setSelectionRange(cursor, cursor);
        }

        this.validateCarNumber(input);
    }

    validateCarNumber(input) {
        const value = input.value;
        const formGroup = input.closest('.form-group');
        const pattern = /^[0-9]{2,3}[가-힣][0-9]{4}$/;

        if (!formGroup.querySelector('.error-message')) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            formGroup.appendChild(errorDiv);
        }

        if (!pattern.test(value)) {
            this.setFieldError(formGroup, '올바른 차량번호 형식이 아닙니다 (예: 12가3456)');
        } else if (this.isDuplicateCarNumber(value)) {
            this.setFieldError(formGroup, '이미 등록된 차량번호입니다');
        } else {
            this.setFieldSuccess(formGroup);
        }
    }

    isDuplicateCarNumber(carNumber) {
        return this.vehicles.some(v => v.carNumber === carNumber && v.carId !== this.currentEditId);
    }

    setupFormValidation() {
        ['car-number', 'car-type'].forEach(id => {
            const field = document.getElementById(id);
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => this.clearFieldError(field));
        });
    }


    validateField(field) {
        const formGroup = field.closest('.form-group');
        if (!field.value.trim()) {
            this.setFieldError(formGroup, '필수 입력 항목입니다');
            return false;
        }
        if (field.id === 'car-number') {
            this.validateCarNumber(field);
            return !formGroup.classList.contains('error');
        }
        this.setFieldSuccess(formGroup);
        return true;
    }

    setFieldError(formGroup, message) {
        formGroup.classList.add('error');
        formGroup.querySelector('.error-message').textContent = message;
    }

    setFieldSuccess(formGroup) {
        formGroup.classList.remove('error');
        formGroup.classList.add('success');
    }

    clearFieldError(field) {
        const group = field.closest('.form-group');
        if (field.value.trim()) group.classList.remove('error');
    }

    handleFormSubmit(e) {
        e.preventDefault();
        if (!this.validateForm()) return this.showToast('입력 정보를 확인해주세요', 'error');

        const data = this.getFormData();
        const btn = e.target.querySelector('.save-btn');
        btn.classList.add('loading');
        btn.textContent = '저장 중...';

        const action = this.currentEditId ? this.updateVehicle(data) : this.addVehicle(data);

        action.finally(() => {
            btn.classList.remove('loading');
            btn.textContent = '저장';
            this.closeVehicleModal();
        });
    }

    validateForm() {
        return ['car-number', 'car-type'] // 필요한 필드만 체크
            .map(id => this.validateField(document.getElementById(id)))
            .every(valid => valid);
    }


    getFormData() {
        return {
            carId: this.currentEditId || null,
            carNumber: document.getElementById('car-number').value.trim(),
            carType: document.getElementById('car-type').value.trim()
                };
    }




    addVehicle(data) {
        return fetch('/api/cars/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(newVehicle => {
                this.vehicles.push(newVehicle);
                this.renderVehicleList();
                this.showToast('차량이 등록되었습니다', 'success');
            })
            .catch(() => this.showToast('차량 등록 실패', 'error'));
    }


    editVehicle(id) {
        const v = this.vehicles.find(v => v.carId === id);
        if (!v) return;

        this.currentEditId = id;

        document.getElementById('vehicle-id').value = v.carId;
        document.getElementById('car-number').value = v.carNumber;
        document.getElementById('car-type').value = v.type;

        openVehicleModal('차량 정보 수정');
    }

    updateVehicle(data) {
        return fetch(`/api/vehicles/${data.carId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(updated => {
                const idx = this.vehicles.findIndex(v => v.carId === updated.carId);
                updated.isPrimary = this.vehicles[idx].isPrimary;
                this.vehicles[idx] = updated;
                this.renderVehicleList();
                this.showToast('차량 정보가 수정되었습니다', 'success');
            })
            .catch(() => this.showToast('수정 실패', 'error'));
    }

    setPrimaryVehicle(id) {
        fetch(`/api/vehicles/${id}/primary`, {
            method: 'PATCH',
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                this.vehicles = data;
                this.renderVehicleList();
                this.showToast('주 차량이 설정되었습니다', 'success');
            })
            .catch(() => this.showToast('주 차량 설정 실패', 'error'));
    }

    confirmDeleteVehicle(id) {
        const v = this.vehicles.find(v => v.carId === id);
        if (!v) return;
        const msg = `"${v.carNumber}" 차량을 삭제하시겠습니까?` +
            (v.isPrimary ? '\n\n주 차량 삭제 시 다른 차량이 자동 지정됩니다.' : '') +
            (this.vehicles.length === 1 ? '\n\n마지막 차량을 삭제하면 다시 등록이 필요합니다.' : '');
        if (confirm(msg)) this.deleteVehicle(id);
    }

    deleteVehicle(id) {
        fetch(`/api/cars/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        })
            .then(() => {
                this.vehicles = this.vehicles.filter(v => v.carId !== id);
                this.renderVehicleList();
                this.showToast('차량이 삭제되었습니다', 'success');
            })
            .catch(() => this.showToast('삭제 실패', 'error'));
    }

    closeVehicleModal() {
        document.getElementById('vehicle-modal').style.display = 'none';
        this.currentEditId = null;
        document.getElementById('vehicle-form').reset();
        document.querySelectorAll('.form-group').forEach(el => el.classList.remove('error', 'success'));
    }

    showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = `${msg}`;
        toast.style.background = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        }[type] || '#3b82f6';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = 0;
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }
}

// 전역 등록
window.vehicleManager = new VehicleManager();
