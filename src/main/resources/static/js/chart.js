let revenueChartInstance = null; // 전역 Chart 인스턴스

document.addEventListener('DOMContentLoaded', () => {
    const usageRate = 25;
    const usageColor = getColorByUsageRate(usageRate);
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    document.getElementById('dateInput').value = `${yyyy}-${mm}-${dd}`;
    document.getElementById('monthInput').value = `${yyyy}-${mm}`;
    document.getElementById('yearInput').value = yyyy;

    loadDashboardDonuts();
    loadChartData();
    loadWeekdayEntryChart()
    onViewModeChange();
    renderMonthlyRevenueComparisonChart();
});

function getDonutConfigs(data) {
    return [
        {
            id: 'donut1',
            value: data.usageRate,
            labels: ['사용 중', '남음'],
            data: [data.usedSpaces, data.availableSpaces], // ✅ 실제 주차 수
            getColors: (val) => [getColorByUsageRate(val), '#e5e7eb'],
            centerLabel: (val) => `${val}%`
        },
        {
            id: 'donut2',
            value: data.monthlyRate,
            labels: ['월주차', '일반'],
            data: [data.monthlyMembers, data.normalMembers], // ✅ 실제 회원 수
            colors: ['#3b82f6', '#e5e7eb'],
            centerLabel: (val) => `${val}%`
        },
        {
            id: 'donut3',
            value: data.reservationRate,
            labels: ['예약', '미예약'],
            data: [data.reservedToday, data.unreservedToday], // ✅ 실제 예약 수
            colors: ['#1e3a8a', '#e5e7eb'],
            centerLabel: (val) => `${val}%`
        }
    ];
}

async function loadDashboardDonuts() {
    try {
        const res = await fetch('/api/management/parking/donut');
        const data = await res.json();

        console.log('📊 도넛 통계 데이터:', data);

        const donutConfigs = getDonutConfigs(data);

        donutConfigs.forEach(cfg => {
            const colors = cfg.colors || cfg.getColors(cfg.value);
            const center = cfg.centerLabel ? cfg.centerLabel(cfg.value) : `${cfg.value}%`;
            renderDonutChart(cfg.id, center, cfg.labels, cfg.data, colors); // ✅ 수정됨
        });

    } catch (err) {
        console.error('❌ 도넛 통계 로딩 실패:', err);
    }
}

function renderDonutChart(canvasId, label, labels, data, colors) {
    new Chart(document.getElementById(canvasId), {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            cutout: '70%',
            plugins: {
                legend: { display: false }
            }
        }
    });

    const center = document.querySelector(`#${canvasId}`).parentElement.querySelector('.center-number');
    if (center) center.innerText = label;
}

function getColorByUsageRate(rate) {
    if (rate >= 80) return '#ef4444';
    else if (rate >= 60) return '#f97316';
    else if (rate >= 40) return '#facc15';
    else return '#10b981';
}

let entryRevenueChartInstance = null;

async function loadChartData() {
    const mode = document.getElementById('viewModeSelect').value;
    let dateInput = document.getElementById('dateInput').value;
    let monthInput = document.getElementById('monthInput').value;
    let year = document.getElementById('yearInput').value;

    const today = new Date();
    const todayDate = today.toISOString().split('T')[0];       // YYYY-MM-DD
    const todayMonth = todayDate.substring(0, 7);               // YYYY-MM
    const todayYear = today.getFullYear();                      // YYYY

    let url = '/api/management/parking/entry-revenue';
    let params = new URLSearchParams();

    if (mode === 'daily') {
        if (!dateInput) dateInput = todayDate;
        params.append('mode', 'daily');
        params.append('date', dateInput); // ex) 2025-08-04
    } else if (mode === 'monthly') {
        if (!monthInput) monthInput = todayMonth;
        params.append('mode', 'monthly');
        params.append('date', monthInput); // ex) 2025-08
    } else if (mode === 'yearly') {
        if (!year) year = todayYear;
        params.append('mode', 'yearly');
        params.append('year', year); // ex) 2025
    }

    try {
        const res = await fetch(`${url}?${params.toString()}`);
        const data = await res.json();

        if (!data || !data.labels) {
            console.warn('⛔ 유효하지 않은 응답');
            return;
        }

        renderEntryRevenueChart(data);
    } catch (err) {
        console.error('❌ 혼합 그래프 데이터 로딩 실패:', err);
    }
}


function renderEntryRevenueChart(chartData) {
    const ctx = document.getElementById('entryRevenueChart').getContext('2d');

    const {
        labels,
        entryCountsNormal,
        entryCountsDaily,
        entryCountsMonthly,
        revenues
    } = chartData;

    console.log("📊 chartData:", chartData);

    const revenueMax = Math.max(...revenues);
    const revenueSuggestedMax = Math.ceil(revenueMax * 1.2);

    // ✅ 기존 차트 제거 (있을 경우)
    if (entryRevenueChartInstance) {
        entryRevenueChartInstance.destroy();
    }

    entryRevenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: '일반',
                    data: entryCountsNormal,
                    backgroundColor: '#4ade80',
                    stack: 'entry',
                    yAxisID: 'y',
                    z: 1,
                    order: 2
                },
                {
                    label: '일주차',
                    data: entryCountsDaily,
                    backgroundColor: '#60a5fa',
                    stack: 'entry',
                    yAxisID: 'y',
                    z: 1,
                    order: 2
                },
                {
                    label: '월주차',
                    data: entryCountsMonthly,
                    backgroundColor: '#f87171',
                    stack: 'entry',
                    yAxisID: 'y',
                    z: 1,
                    order: 2
                },
                {
                    type: 'line',
                    label: '수익 (₩)',
                    data: revenues,
                    borderColor: '#facc15',
                    borderWidth: 2,
                    pointRadius: 3,
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y1',
                    z: 10,
                    order: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { font: { size: 12 } }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            elements: {
                bar: {
                    borderSkipped: false,
                    barPercentage: 0.7,
                    categoryPercentage: 0.7
                },
                line: {
                    tension: 0.4
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                x: {
                    stacked: true,
                    offset: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: { display: true, text: '입차 수' }
                },
                y1: {
                    beginAtZero: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    suggestedMax: revenueSuggestedMax,
                    title: { display: true, text: '수익 (₩)' },
                    ticks: {
                        callback: value => `${(value / 1000).toFixed(0)}K`
                    }
                }
            }
        }
    });
}
function onViewModeChange() {
    const mode = document.getElementById('viewModeSelect').value;
    document.getElementById('dateInput').style.display = mode === 'daily' ? 'inline-block' : 'none';
    document.getElementById('monthInput').style.display = mode === 'monthly' ? 'inline-block' : 'none';
    document.getElementById('yearInput').style.display = mode === 'yearly' ? 'inline-block' : 'none';
}



async function loadWeekdayEntryChart() {
    const select = document.getElementById('weekdayMonthSelect');
    const month = select ? select.value : (new Date().getMonth() + 1); // fallback

    try {
        const res = await fetch(`/api/management/parking/weekday-avg-entry?month=${month}`);
        const data = await res.json();

        const labels = ['월', '화', '수', '목', '금', '토', '일'];
        const values = Array(7).fill(0);

        data.forEach(d => {
            const index = (d.weekday + 5) % 7;
            values[index] = d.averageCount;
        });

        if (window.weeklyEntryChart && typeof window.weeklyEntryChart.destroy === 'function') {
            window.weeklyEntryChart.destroy();
        }

        window.weeklyEntryChart = renderWeeklyEntryChart(labels, values);

    } catch (e) {
        console.error('📛 요일별 평균 입차 수 불러오기 실패:', e);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('weekdayMonthSelect');
    if (select) {
        const currentMonth = new Date().getMonth() + 1;
        select.value = currentMonth;
    }

    loadWeekdayEntryChart();
});

function renderWeeklyEntryChart(labels, data) {
    const ctx = document.getElementById('weeklyEntryChart').getContext('2d');

    const max = Math.max(...data);

    // 📌 데이터 비율 기반으로 색상 밝기 조정 (밝을수록 연하고, 낮을수록 진함)
    const backgroundColor = data.map(v => {
        const lightness = 85 - (v / max) * 35; // 밝기: 85% ~ 50%
        return `hsl(220, 50%, ${lightness}%)`; // 고정된 블루 계열
    });

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '입차 수',
                data: data,
                backgroundColor: backgroundColor,
                borderRadius: 4,
                barPercentage: 0.6,
                categoryPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '입차 수'
                    }
                }
            }
        }
    });
}

function updateRevenueChart() {
    const mode = document.getElementById('revenueModeSelect').value;
    const year = document.getElementById('revenueYearSelect').value;
    const month = document.getElementById('revenueMonthSelect').value;

    // ✅ 월모드일 때만 month 파라미터 포함
    let url = `/api/management/parking/revenue-comparison?mode=${mode}&year=${year}`;
    if (mode === 'month') {
        url += `&month=${month}`;
    }

    fetch(url)
        .then(res => res.json())
        .then(data => {
            renderMonthlyRevenueComparisonChart(mode, data);
        })
        .catch(err => {
            console.error("📛 수익 비교 데이터 로딩 실패", err);
        });

    // ✅ 필터 UI 전환
    toggleMonthSelect(mode); // ← 이거 꼭 있어야 함
}


function renderMonthlyRevenueComparisonChart(mode, data) {
    const ctx = document.getElementById('monthlyRevenueComparisonChart').getContext('2d');

    // ✅ 라벨은 모드에 따라 다르게 설정
    const labels = mode === 'month'
        ? ['1~7일', '8~14일', '15~21일', '22~28일', '29~31일']
        : ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    // ✅ 데이터도 라벨 개수에 맞춰 동기화
    const currentRevenue = data.current || new Array(labels.length).fill(0);
    const previousRevenue = data.previous || new Array(labels.length).fill(0);

    // ✅ 기존 차트 파괴
    if (revenueChartInstance) {
        revenueChartInstance.destroy();
    }

    // ✅ 새 차트 생성
    revenueChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: mode === 'month' ? '이번 달 수익' : '올해 수익',
                    data: currentRevenue,
                    borderColor: '#60a5fa',
                    backgroundColor: 'rgba(96,165,250,0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3
                },
                {
                    label: mode === 'month' ? '지난 달 수익' : '지난해 수익',
                    data: previousRevenue,
                    borderColor: '#f87171',
                    backgroundColor: 'rgba(248,113,113,0.1)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 3
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,     // ⬅️ 범례 아이콘을 기본 사각형 대신 선택한 스타일로
                        pointStyle: 'line'       // ⬅️ 원하는 아이콘 모양 ('line', 'rect', 'rectRounded', 'dash', etc.)
                    }
                },
                tooltip: {
                    callbacks: {
                        label: ctx => `₩${ctx.raw.toLocaleString()}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => `₩${(value / 1000).toFixed(0)}K`
                    }
                }
            }
        }
    });
}

function generateYearOptions(selectId, range = 5) {
    const select = document.getElementById(selectId);
    const currentYear = new Date().getFullYear();
    select.innerHTML = ''; // 기존 옵션 제거

    for (let i = 0; i < range; i++) {
        const year = currentYear - i;
        const option = document.createElement('option');
        option.value = year;
        option.textContent = `${year}년`;
        select.appendChild(option);
    }

    select.value = currentYear;
}

function toggleMonthSelect(mode) {
    const monthSelect = document.getElementById('revenueMonthSelect');
    monthSelect.style.display = (mode === 'month') ? 'inline-block' : 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    generateYearOptions('revenueYearSelect', 5); // 최근 5년 동적 생성

    const today = new Date();
    document.getElementById('revenueMonthSelect').value = today.getMonth() + 1;
    document.getElementById('revenueModeSelect').value = 'month';

    toggleMonthSelect('month');
    updateRevenueChart();
});






