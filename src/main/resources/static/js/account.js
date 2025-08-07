// ========================================
// 내 계정 및 차량 관리 (account.js)
// ========================================

// ========================================
// 초기화
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('⚙️ 계정관리 모듈 로드됨');

  // 공통 라이브러리 초기화
  if (!initializeCommon()) {
    return;
  }

  // 계정 페이지 초기화
  initializeAccountPage();

  console.log('✅ 계정 페이지 초기화 완료');
});

function initializeAccountPage() {
  // 사용자 정보 로드
  loadUserProfile();

  // 등록된 차량 정보 로드
  loadUserCars();

  // 멤버십 정보 로드
  loadMembershipInfo();

  // 계정 정보 로드
  loadAccountInfo();

  // 폼 이벤트 리스너 설정
  setupFormEvents();
}

// ========================================
// 사용자 프로필 정보 로드
// ========================================
async function loadUserProfile() {
  console.log('👤 사용자 프로필 로드 중...');

  const data = await apiRequest('/api/user/profile');
  if (!data) return false;

  try {
    // 기본 정보 업데이트
    updateElement('user-name', data.name);
    updateElement('user-email', data.email);
    updateElement('user-phone', data.phone);
    updateElement('user-birth', data.birthDate);
    updateElement('join-date', data.joinDate);

    // 프로필 폼에도 업데이트
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.querySelector('#profile-name').value = data.name || '';
      profileForm.querySelector('#profile-email').value = data.email || '';
      profileForm.querySelector('#profile-phone').value = data.phone || '';
      profileForm.querySelector('#profile-birth').value = data.birthDate || '';
    }

    console.log('✅ 사용자 프로필 로드 완료');
    return true;
  } catch (error) {
    console.error('❌ 사용자 프로필 로드 실패:', error);
    return false;
  }
}

// ========================================
// 등록된 차량 정보 로드 (PDF 명세서 기준)
// ========================================
async function loadUserCars() {
  console.log('🚙 등록된 차량 로드 중...');

  const data = await apiRequest('/api/user/cars');
  if (!data || !data.cars) return false;

  try {
    const carsContainer = document.querySelector('.cars-list, .vehicle-list');
    if (!carsContainer) return false;

    // 기존 차량 목록 클리어
    const existingCars = carsContainer.querySelectorAll('.car-item, .vehicle-item');
    existingCars.forEach(item => item.remove());

    if (data.cars.length > 0) {
      // 새 차량 목록 추가
      data.cars.forEach(car => {
        const item = createCarItem(car);
        carsContainer.appendChild(item);
      });
    } else {
      // 빈 목록 메시지
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #64748b;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🚗</div>
          <p>등록된 차량이 없습니다.</p>
          <button onclick="addVehicle()" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 1rem;
          ">차량 등록하기</button>
        </div>
      `;
      carsContainer.appendChild(emptyMessage);
    }

    console.log('✅ 차량 정보 로드 완료');
    return true;
  } catch (error) {
    console.error('❌ 차량 정보 로드 실패:', error);
    return false;
  }
}

// PDF 명세서에 따른 차량 항목 생성
function createCarItem(car) {
  const item = document.createElement('div');
  item.className = 'car-item vehicle-item';

  item.innerHTML = `
    <div class="car-header">
      <div class="car-number">${car.carNumber}</div>
      ${car.isPrimary ? '<span class="primary-badge">주차용</span>' : ''}
    </div>
    <div class="car-info">
      <div class="car-details">
        <span class="car-brand">${car.manufacturer} ${car.model}</span>
        <span class="car-year">(${car.year})</span>
      </div>
      <div class="car-color">
        <span class="color-dot" style="background-color: ${getColorCode(car.color)}"></span>
        ${car.color}
      </div>
    </div>
    <div class="car-actions">
      <button onclick="editVehicle('${car.carNumber}')" class="btn-edit">
        <span>✏️</span> 수정
      </button>
      <button onclick="deleteVehicle('${car.carNumber}')" class="btn-delete">
        <span>🗑️</span> 삭제
      </button>
      ${!car.isPrimary ? `
        <button onclick="setPrimary('${car.carNumber}')" class="btn-primary">
          <span>⭐</span> 주차용 설정
        </button>
      ` : ''}
    </div>
  `;

  return item;
}

function getColorCode(colorName) {
  const colorMap = {
    '화이트': '#ffffff',
    '블랙': '#000000',
    '실버': '#c0c0c0',
    '그레이': '#808080',
    '레드': '#ff0000',
    '블루': '#0000ff',
    '그린': '#008000',
    '옐로우': '#ffff00',
    '브라운': '#8B4513',
    '오렌지': '#FFA500'
  };
  return colorMap[colorName] || '#64748b';
}

// ========================================
// 멤버십 정보 로드 (PDF 명세서 기준)
// ========================================
async function loadMembershipInfo() {
  console.log('🏆 멤버십 정보 로드 중...');

  const data = await apiRequest('/api/membership/info');
  if (!data) return false;

  try {
    // 멤버십 등급 업데이트
    updateElement('membership-grade', data.membershipGrade);

    // 가입일 업데이트
    updateElement('joined-date', data.joinedAt);

    // 총 이용횟수 업데이트
    updateElement('total-usage-count', data.totalUsageCount?.toLocaleString() + '회');

    // 누적 결제금액 업데이트
    updateElement('total-payment', '₩' + data.totalPayment?.toLocaleString());

    // 할인율 업데이트
    updateElement('discount-rate', data.discountRate + '%');

    // 혜택 목록 업데이트
    const benefitsContainer = document.querySelector('.benefits-list');
    if (benefitsContainer && data.benefits) {
      benefitsContainer.innerHTML = '';
      data.benefits.forEach(benefit => {
        const item = document.createElement('div');
        item.className = 'benefit-item';
        item.innerHTML = `<span class="benefit-icon">✓</span> ${benefit}`;
        benefitsContainer.appendChild(item);
      });
    }

    console.log('✅ 멤버십 정보 로드 완료');
    return true;
  } catch (error) {
    console.error('❌ 멤버십 정보 로드 실패:', error);
    return false;
  }
}

// ========================================
// 계정 정보 로드 (PDF 명세서 기준)
// ========================================
async function loadAccountInfo() {
  console.log('💳 계정 정보 로드 중...');

  const data = await apiRequest('/api/payment/account-info');
  if (!data) return false;

  try {
    // 포인트 정보 업데이트
    updateElement('point-amount', data.point?.toLocaleString() + 'P');
    updateElement('point', data.point?.toLocaleString() + 'P');

    // 선불 잔액 업데이트
    updateElement('prepaid-balance', '₩' + data.prepaidBalance?.toLocaleString());

    // 이번달 사용액 업데이트
    updateElement('monthly-usage', '₩' + data.monthlyUsage?.toLocaleString());

    // 다음달 소멸 예정 포인트 업데이트
    updateElement('point-expire-next-month', data.pointExpireNextMonth?.toLocaleString() + 'P');

    // 마지막 충전일 업데이트
    updateElement('last-charged-at', data.lastChargedAt || '-');

    // 지난달 대비 절약율 업데이트
    if (data.compareLastMonth !== undefined) {
      const rate = Math.abs(data.compareLastMonth);
      const isPositive = data.compareLastMonth < 0;
      const element = document.getElementById('compare-last-month');
      if (element) {
        element.textContent = (isPositive ? '↓' : '↑') + rate + '%';
        element.style.color = isPositive ? '#10b981' : '#ef4444';
      }
    }

    console.log('✅ 계정 정보 로드 완료');
    return true;
  } catch (error) {
    console.error('❌ 계정 정보 로드 실패:', error);
    return false;
  }
}

// ========================================
// 프로필 정보 수정
// ========================================
async function updateProfile() {
  event.preventDefault();

  const formData = {
    name: document.getElementById('profile-name')?.value.trim(),
    email: document.getElementById('profile-email')?.value.trim(),
    phone: document.getElementById('profile-phone')?.value.trim(),
    birthDate: document.getElementById('profile-birth')?.value
  };

  // 유효성 검사
  if (!formData.name || !formData.email || !formData.phone) {
    showToast('필수 정보를 모두 입력해주세요.', 'error');
    return;
  }

  // 이메일 형식 검사
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(formData.email)) {
    showToast('올바른 이메일 형식을 입력해주세요.', 'error');
    return;
  }

  // 전화번호 형식 검사
  const phonePattern = /^\d{3}-\d{4}-\d{4}$/;
  if (!phonePattern.test(formData.phone)) {
    showToast('올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)', 'error');
    return;
  }

  showLoading('프로필을 업데이트하는 중...');

  try {
    const response = await apiRequest('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(formData)
    });

    if (response) {
      hideLoading();
      showToast('프로필이 업데이트되었습니다.', 'success');

      // 프로필 정보 새로고침
      await loadUserProfile();
    }
  } catch (error) {
    hideLoading();
    showToast('프로필 업데이트에 실패했습니다.', 'error');
  }
}

// ========================================
// 차량 관리 (PDF 명세서 기준)
// ========================================
function addVehicle() {
  const formTitle = document.getElementById('vehicle-form-title');
  const vehicleForm = document.getElementById('vehicle-form');

  if (formTitle) formTitle.textContent = '차량 정보 추가';
  if (vehicleForm) {
    vehicleForm.style.display = 'block';

    // 폼 초기화
    const form = vehicleForm.querySelector('form');
    if (form) form.reset();

    document.getElementById('car-number').readOnly = false;
    document.getElementById('car-number').focus();
    document.body.style.overflow = 'hidden';
  }
}

async function saveVehicle() {
  event.preventDefault();

  const carData = {
    carNumber: document.getElementById('car-number')?.value.trim(),
    manufacturer: document.getElementById('car-manufacturer')?.value.trim(),
    model: document.getElementById('car-model')?.value.trim(),
    year: parseInt(document.getElementById('car-year')?.value),
    color: document.getElementById('car-color')?.value,
    isPrimary: document.getElementById('is-primary')?.checked || false
  };

  // 유효성 검사
  if (!carData.carNumber || !carData.manufacturer || !carData.model || !carData.year || !carData.color) {
    showToast('모든 필드를 입력해주세요.', 'error');
    return;
  }

  const carNumberPattern = /^\d{2,3}[가-힣]\d{4}$/;
  if (!carNumberPattern.test(carData.carNumber)) {
    showToast('올바른 차량번호 형식을 입력해주세요. (예: 12가3456)', 'error');
    return;
  }

  if (carData.year < 1990 || carData.year > new Date().getFullYear() + 1) {
    showToast('올바른 연식을 입력해주세요.', 'error');
    return;
  }

  showLoading('차량 정보를 저장하는 중...');

  try {
    const isEdit = document.getElementById('car-number').readOnly;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `/api/user/cars/${carData.carNumber}` : '/api/user/cars';

    const response = await apiRequest(url, {
      method: method,
      body: JSON.stringify(carData)
    });

    if (response) {
      hideLoading();
      showToast(isEdit ? '차량 정보가 수정되었습니다.' : '차량이 등록되었습니다.', 'success');
      cancelVehicleForm();
      await loadUserCars(); // 목록 새로고침
    }
  } catch (error) {
    hideLoading();
    showToast('차량 정보 저장에 실패했습니다.', 'error');
  }
}

async function deleteVehicle(carNumber) {
  if (!confirm(`${carNumber} 차량을 정말 삭제하시겠습니까?`)) {
    return;
  }

  showLoading('차량을 삭제하는 중...');

  try {
    const response = await apiRequest(`/api/user/cars/${carNumber}`, {
      method: 'DELETE'
    });

    if (response) {
      hideLoading();
      showToast(`${carNumber} 차량이 삭제되었습니다.`, 'success');
      await loadUserCars(); // 목록 새로고침
    }
  } catch (error) {
    hideLoading();
    showToast('차량 삭제에 실패했습니다.', 'error');
  }
}

async function setPrimary(carNumber) {
  if (!confirm(`${carNumber}을(를) 주차용으로 설정하시겠습니까?`)) {
    return;
  }

  showLoading('주차용을 설정하는 중...');

  try {
    const response = await apiRequest('/api/user/cars/primary', {
      method: 'PATCH',
      body: JSON.stringify({ carNumber })
    });

    if (response) {
      hideLoading();
      showToast(`${carNumber}이(가) 주차용으로 설정되었습니다.`, 'success');
      await loadUserCars(); // 목록 새로고침
    }
  } catch (error) {
    hideLoading();
    showToast('주차용 설정에 실패했습니다.', 'error');
  }
}

function cancelVehicleForm() {
  const vehicleForm = document.getElementById('vehicle-form');
  if (vehicleForm) {
    vehicleForm.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// ========================================
// 유틸리티 함수
// ========================================
function updateElement(id, content) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = content;
  }
}

// ========================================
// 폼 이벤트 설정
// ========================================
function setupFormEvents() {
  // 프로필 업데이트 폼
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', updateProfile);
  }

  // 차량 등록/수정 폼
  const vehicleForm = document.querySelector('#vehicle-form form');
  if (vehicleForm) {
    vehicleForm.addEventListener('submit', saveVehicle);
  }

  // 모달 외부 클릭시 닫기
  document.addEventListener('click', function(event) {
    const vehicleForm = document.getElementById('vehicle-form');
    if (event.target === vehicleForm) {
      cancelVehicleForm();
    }
  });
}

// ========================================
// 전역 함수 노출
// ========================================
window.updateProfile = updateProfile;
window.addVehicle = addVehicle;
window.editVehicle = editVehicle;
window.saveVehicle = saveVehicle;
window.deleteVehicle = deleteVehicle;
window.setPrimary = setPrimary;
window.cancelVehicleForm = cancelVehicleForm;
window.loadUserCars = loadUserCars;
window.loadMembershipInfo = loadMembershipInfo;
window.loadAccountInfo = loadAccountInfo;