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
// 등록된 차량 정보 로드
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

function createCarItem(car) {
  const item = document.createElement('div');
  item.className = 'car-item vehicle-item';
  
  item.innerHTML = `
    <div class="car-header">
      <div class="car-number">${car.carNumber}</div>
      ${car.isPrimary ? '<span class="primary-badge">주차량</span>' : ''}
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
          <span>⭐</span> 주차량 설정
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
// 멤버십 정보 로드
// ========================================
async function loadMembershipInfo() {
  console.log('🏆 멤버십 정보 로드 중...');
  
  const data = await apiRequest('/api/membership/info');
  if (!data) return false;
  
  try {
    // 멤버십 등급 업데이트
    const gradeElements = document.querySelectorAll('.membership-grade');
    gradeElements.forEach(el => {
      if (el) el.textContent = data.membershipGrade;
    });
    
    // 가입일 업데이트
    const joinedElements = document.querySelectorAll('.joined-date');
    joinedElements.forEach(el => {
      if (el) el.textContent = data.joinedAt;
    });
    
    // 총 이용횟수 업데이트
    const usageElements = document.querySelectorAll('.total-usage');
    usageElements.forEach(el => {
      if (el) el.textContent = data.totalUsageCount?.toLocaleString() + '회';
    });
    
    // 누적 결제금액 업데이트
    const paymentElements = document.querySelectorAll('.total-payment');
    paymentElements.forEach(el => {
      if (el) el.textContent = '₩' + data.totalPayment?.toLocaleString();
    });
    
    // 할인율 업데이트
    const discountElements = document.querySelectorAll('.discount-rate');
    discountElements.forEach(el => {
      if (el) el.textContent = data.discountRate + '%';
    });
    
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
// 계정 정보 로드
// ========================================
async function loadAccountInfo() {
  console.log('💳 계정 정보 로드 중...');
  
  const data = await apiRequest('/api/payment/account-info');
  if (!data) return false;
  
  try {
    // 포인트 정보 업데이트
    const pointElements = document.querySelectorAll('.point-amount, #point');
    pointElements.forEach(el => {
      if (el) el.textContent = data.point?.toLocaleString() + 'P';
    });
    
    // 선불 잔액 업데이트
    const balanceElements = document.querySelectorAll('.balance-amount, #prepaid-balance');
    balanceElements.forEach(el => {
      if (el) el.textContent = '₩' + data.prepaidBalance?.toLocaleString();
    });
    
    // 이번달 사용액 업데이트
    const usageElements = document.querySelectorAll('.monthly-usage');
    usageElements.forEach(el => {
      if (el) el.textContent = '₩' + data.monthlyUsage?.toLocaleString();
    });
    
    // 마지막 충전일 업데이트
    const lastChargedElements = document.querySelectorAll('#last-charged');
    lastChargedElements.forEach(el => {
      if (el) el.textContent = data.lastChargedAt || '-';
    });
    
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
// 비밀번호 변경
// ========================================
async function changePassword() {
  event.preventDefault();
  
  const currentPassword = document.getElementById('current-password')?.value;
  const newPassword = document.getElementById('new-password')?.value;
  const confirmPassword = document.getElementById('confirm-password')?.value;
  
  // 유효성 검사
  if (!currentPassword || !newPassword || !confirmPassword) {
    showToast('모든 비밀번호 필드를 입력해주세요.', 'error');
    return;
  }
  
  if (newPassword !== confirmPassword) {
    showToast('새 비밀번호가 일치하지 않습니다.', 'error');
    return;
  }
  
  if (newPassword.length < 8) {
    showToast('새 비밀번호는 8자 이상이어야 합니다.', 'error');
    return;
  }
  
  // 비밀번호 복잡도 검사
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!passwordPattern.test(newPassword)) {
    showToast('새 비밀번호는 영문 대소문자, 숫자, 특수문자를 포함해야 합니다.', 'error');
    return;
  }
  
  showLoading('비밀번호를 변경하는 중...');
  
  try {
    const response = await apiRequest('/api/user/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });
    
    if (response) {
      hideLoading();
      showToast('비밀번호가 변경되었습니다.', 'success');
      
      // 폼 초기화
      document.getElementById('password-form')?.reset();
    }
  } catch (error) {
    hideLoading();
    showToast('비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인해주세요.', 'error');
  }
}

// ========================================
// 차량 관리
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

async function editVehicle(carNumber) {
  const formTitle = document.getElementById('vehicle-form-title');
  const vehicleForm = document.getElementById('vehicle-form');
  
  if (formTitle) formTitle.textContent = '차량 정보 수정';
  if (vehicleForm) {
    vehicleForm.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    showLoading('차량 정보를 불러오는 중...');
    
    try {
      const carData = await apiRequest(`/api/user/cars/${carNumber}`);
      
      if (carData) {
        document.getElementById('car-number').value = carData.carNumber;
        document.getElementById('car-number').readOnly = true; // 수정 시 차량번호 변경 불가
        document.getElementById('car-manufacturer').value = carData.manufacturer;
        document.getElementById('car-model').value = carData.model;
        document.getElementById('car-year').value = carData.year;
        document.getElementById('car-color').value = carData.color;
      }
      
      hideLoading();
    } catch (error) {
      hideLoading();
      showToast('차량 정보를 불러오는데 실패했습니다.', 'error');
    }
  }
}

async function saveVehicle() {
  event.preventDefault();
  
  const carData = {
    carNumber: document.getElementById('car-number')?.value.trim(),
    manufacturer: document.getElementById('car-manufacturer')?.value.trim(),
    model: document.getElementById('car-model')?.value.trim(),
    year: parseInt(document.getElementById('car-year')?.value),
    color: document.getElementById('car-color')?.value
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
  if (!confirm(`${carNumber}을(를) 주차량으로 설정하시겠습니까?`)) {
    return;
  }
  
  showLoading('주차량을 설정하는 중...');
  
  try {
    const response = await apiRequest('/api/user/cars/primary', {
      method: 'PATCH',
      body: JSON.stringify({ carNumber })
    });
    
    if (response) {
      hideLoading();
      showToast(`${carNumber}이(가) 주차량으로 설정되었습니다.`, 'success');
      await loadUserCars(); // 목록 새로고침
    }
  } catch (error) {
    hideLoading();
    showToast('주차량 설정에 실패했습니다.', 'error');
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
// 계정 탈퇴
// ========================================
function requestAccountDeletion() {
  const confirmText = '계정 탈퇴';
  const userInput = prompt(`정말로 계정을 탈퇴하시겠습니까?\n\n⚠️ 주의사항:\n- 모든 데이터가 영구 삭제됩니다\n- 이용 중인 서비스가 즉시 중단됩니다\n- 탈퇴 후 복구가 불가능합니다\n\n탈퇴를 진행하려면 "${confirmText}"를 정확히 입력해주세요:`);
  
  if (userInput !== confirmText) {
    if (userInput !== null) {
      showToast('입력이 정확하지 않습니다.', 'error');
    }
    return;
  }
  
  showLoading('계정 탈퇴를 처리하는 중...');
  
  // 실제로는 API 호출
  setTimeout(() => {
    hideLoading();
    alert('계정 탈퇴가 완료되었습니다.\n그동안 이용해 주셔서 감사합니다.');
    window.location.href = '/';
  }, 2000);
}

// ========================================
// 알림 설정
// ========================================
async function updateNotificationSettings() {
  const settings = {
    emailNotification: document.getElementById('email-notification')?.checked,
    smsNotification: document.getElementById('sms-notification')?.checked,
    pushNotification: document.getElementById('push-notification')?.checked,
    marketingConsent: document.getElementById('marketing-consent')?.checked
  };
  
  showLoading('알림 설정을 저장하는 중...');
  
  try {
    const response = await apiRequest('/api/user/notification-settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
    
    if (response) {
      hideLoading();
      showToast('알림 설정이 저장되었습니다.', 'success');
    }
  } catch (error) {
    hideLoading();
    showToast('알림 설정 저장에 실패했습니다.', 'error');
  }
}

// ========================================
// 폼 이벤트 설정
// ========================================
function setupFormEvents() {
  
  // 비밀번호 변경 폼
  const passwordForm = document.getElementById('password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', changePassword);
  }
  
  // 차량 등록/수정 폼
  const vehicleForm = document.querySelector('#vehicle-form form');
  if (vehicleForm) {
    vehicleForm.addEventListener('submit', saveVehicle);
  }
  
  // 알림 설정 체크박스들
  const notificationCheckboxes = document.querySelectorAll('#email-notification, #sms-notification, #push-notification, #marketing-consent');
  notificationCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateNotificationSettings);
  });
  
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
window.changePassword = changePassword;
window.addVehicle = addVehicle;
window.editVehicle = editVehicle;
window.saveVehicle = saveVehicle;
window.deleteVehicle = deleteVehicle;
window.setPrimary = setPrimary;
window.cancelVehicleForm = cancelVehicleForm;
window.requestAccountDeletion = requestAccountDeletion;
window.updateNotificationSettings = updateNotificationSettings;
window.uploadProfileImage = uploadProfileImage;
window.loadUserCars = loadUserCars;
window.loadMembershipInfo = loadMembershipInfo;
window.loadAccountInfo = loadAccountInfo;