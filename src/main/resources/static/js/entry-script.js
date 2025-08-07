function uploadAndRecognize() {
    const fileInput = document.getElementById('image-upload');
    const file = fileInput.files[0];
    const cameraId = document.getElementById('camera-id').value;

    if (!file) {
        alert('차량 이미지를 선택해주세요.');
        return;
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('cameraId', cameraId);

    fetch('/detect', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            // ✅ 입차 제한 처리
            if (data.entryDenied === 'true') {
                alert('🚫 입차 제한: ' + data.reason); // 또는 openModal(data.reason)
                return; // 아래 로직 중단
            }
            // ✅ 이미지 미리보기
            if (data.image) {
                const img = document.createElement('img');
                img.src = data.image;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';

                const preview = document.getElementById('image-preview');
                preview.innerHTML = '';
                preview.appendChild(img);

                sessionStorage.setItem('entryImage', data.image);
            }

            // ✅ id 그대로 저장
            if (data.id) {
                sessionStorage.setItem('id', data.id); // 🔁 id 키 사용
                console.log('📌 id 저장됨:', data.id);
            }

            // ✅ 결과 표시
            document.getElementById('plate-number').textContent = data.plateNumber || '인식 실패';
            document.getElementById('member-status').textContent = data.isMember === 'true' ? '회원' : '비회원';

            const now = new Date();
            const formatted = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')} ` +
                `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            document.getElementById('entry-time').textContent = formatted;

            document.getElementById('entry-result').style.display = 'block';
        })
        .catch(error => {
            alert('번호판 인식에 실패했습니다.');
            console.error('🚨 인식 오류:', error);
        });


}


// 네이버 지도 초기화


// 전역 마커 및 InfoWindow 저장소
const markers = {};
const infoWindows = {};

function initMap() {
    const parkingSpots = {
        7: { lat: 37.544041, lng: 127.127777 }, // 천호
        2: { lat: 37.493392, lng: 127.027610 }, // 서초
        3: { lat: 37.500312, lng: 127.114580 }  // 송파
    };

    const map = new naver.maps.Map('map', {
        center: new naver.maps.LatLng(37.52, 127.10),
        zoom: 13
    });

    // ✅ 초기 마커 생성
    fetch("/api/parking/data")
        .then(res => res.json())
        .then(data => {
            Object.entries(data).forEach(([id, info]) => {
                const coord = parkingSpots[parseInt(id)];
                if (!coord) return;

                const { name, total, occupied, rate } = info;
                const isCrowded = rate >= 80;
                const markerColor = isCrowded ? 'red' : 'green';

                // 마커 생성
                const marker = new naver.maps.Marker({
                    position: new naver.maps.LatLng(coord.lat, coord.lng),
                    map: map,
                    icon: {
                        content: `<div style="width:16px; height:16px; background:${markerColor}; border-radius:50%; border: 2px solid white;"></div>`,
                        size: new naver.maps.Size(16, 16),
                        anchor: new naver.maps.Point(8, 8)
                    }
                });

                // InfoWindow 생성
                const infoWindow = new naver.maps.InfoWindow({
                    content: `
                        <div style="padding:10px;">
                            <strong>${name}</strong><br/>
                            총 면수: ${total}<br/>
                            사용중: ${occupied}<br/>
                            이용률: ${rate.toFixed(1)}%
                        </div>
                    `
                });

                // 클릭 시 InfoWindow
                naver.maps.Event.addListener(marker, "click", () => {
                    infoWindow.open(map, marker);
                    open3dModal(id);
                });

                infoWindow.open(map, marker); // 초기 표시

                // 전역에 저장
                markers[id] = marker;
                infoWindows[id] = infoWindow;
            });

            // 초기 주차장 현황 표시
            renderParkingStatus(data);
        })
        .catch(err => {
            console.error("❌ 주차장 정보 불러오기 실패:", err);
            alert("주차장 상태를 불러오는 데 실패했습니다.");
        });

    // ✅ 주기적 갱신 (30초)
    setInterval(() => {
        fetch("/api/parking/data")
            .then(res => res.json())
            .then(data => {
                renderParkingStatus(data);
                updateMarkers(data);
            })
            .catch(err => {
                console.error("❌ 자동 갱신 실패:", err);
            });
    }, 10000);
}

// ✅ 마커 상태 갱신 함수
function updateMarkers(data) {
    Object.entries(data).forEach(([id, info]) => {
        const marker = markers[id];
        const infoWindow = infoWindows[id];
        const coord = marker?.getPosition();

        if (!marker || !infoWindow || !coord) return;

        const { name, total, occupied, rate } = info;
        const isCrowded = rate >= 80;
        const markerColor = isCrowded ? 'red' : 'green';

        // 마커 색상 업데이트
        marker.setIcon({
            content: `<div style="width:16px; height:16px; background:${markerColor}; border-radius:50%; border: 2px solid white;"></div>`,
            size: new naver.maps.Size(16, 16),
            anchor: new naver.maps.Point(8, 8)
        });

        // InfoWindow 내용 갱신
        infoWindow.setContent(`
            <div style="padding:10px;">
                <strong>${name}</strong><br/>
                총 면수: ${total}<br/>
                사용중: ${occupied}<br/>
                이용률: ${rate.toFixed(1)}%
            </div>
        `);
    });
}

// ✅ 주차장 가용률 상태 박스 렌더링
function renderParkingStatus(data) {
    const statusGrid = document.getElementById('status-grid');
    if (!statusGrid) return;

    statusGrid.innerHTML = '';

    Object.entries(data).forEach(([id, info]) => {
        const { name, total, occupied } = info;
        const rate = ((occupied / total) * 100).toFixed(0);

        const html = `
            <div class="zone-status">
                <h4>${name}</h4>
                <div class="availability">
                    <span class="occupied">${occupied}</span>/<span class="total">${total}</span>
                </div>
                <div class="zone-rate">이용률: ${rate}%</div>
            </div>
        `;

        statusGrid.insertAdjacentHTML('beforeend', html);
    });
}

// ✅ 네이버 지도 인증 실패 알림
window.navermap_authFailure = function () {
    alert('❌ 네이버 지도 인증 실패! ncpKeyId가 정확한지 확인하세요.');
};
function open3dModal(parkingId) {
    const modal = document.getElementById('parking3d-modal');
    const iframe = document.getElementById('parking3d-frame');
    iframe.src = `/parking3d.html?parkingId=${parkingId}`; // 파라미터 전달
    modal.style.display = 'block';
}

function close3dModal() {
    const modal = document.getElementById('parking3d-modal');
    const iframe = document.getElementById('parking3d-frame');
    iframe.src = ''; // 리셋
    modal.style.display = 'none';
}


