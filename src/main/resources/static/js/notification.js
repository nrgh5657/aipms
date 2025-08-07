// 토글 스위치 상호작용을 위한 간단한 스크립트
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('notification-form');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // 폼 데이터 수집
        const formData = new FormData(form);
        const settings = {};

        // 체크박스 상태 확인
        const checkboxes = form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            settings[checkbox.name] = checkbox.checked;
        });

        console.log('알림 설정:', settings);

        // 저장 완료 메시지
        alert('알림 설정이 저장되었습니다!');
    });
});