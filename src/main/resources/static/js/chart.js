document.addEventListener('DOMContentLoaded', () => {
    renderDonutChart('donut1', '75%', ['사용 중', '남음'], [75, 25], ['#22c55e', '#e5e7eb']);
    renderDonutChart('donut2', '50%', ['월주차', '일반'], [50, 50], ['#10b981', '#e5e7eb']);
    renderDonutChart('donut3', '60%', ['예약', '미예약'], [60, 40], ['#f97316', '#e5e7eb']);
    renderEntryRevenueChart();
});

// ✅ 도넛 차트 렌더링
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

    // 중앙 숫자 설정 (선택적으로 변경)
    const center = document.querySelector(`#${canvasId}`).parentElement.querySelector('.center-number');
    if (center) center.innerText = label;
}

function renderEntryRevenueChart() {
    const ctx = document.getElementById('entryRevenueChart').getContext('2d');

    const labels = Array.from({ length: 24 }, (_, i) => `${i}`);

    // ✅ 입차 수를 일반/일주차/월주차로 분리
    const entryCountsNormal = [1, 2, 1, 0, 0, 0, 1, 2, 3, 4, 6, 7, 6, 5, 5, 4, 3, 3, 2, 2, 1, 1, 1, 1];
    const entryCountsDaily = [0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 4, 4, 3, 3, 3, 2, 2, 1, 1, 1, 0, 0];
    const entryCountsMonthly = [0, 0, 0, 0, 0, 0, 1, 1, 1, 2, 2, 3, 3, 3, 3, 3, 2, 2, 2, 1, 1, 0, 0, 0];

    const revenues = [500, 1000, 800, 0, 0, 0, 2000, 4000, 6000, 8000, 7000, 7500, 7200, 7000, 6500, 6000, 5000, 4500, 4000, 3000, 2000, 1500, 1200, 1000];

    const revenueMax = Math.max(...revenues);
    const revenueSuggestedMax = Math.ceil(revenueMax * 1.2);

    new Chart(ctx, {
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
                    z:1,
                    order: 2
                },
                {
                    label: '일주차',
                    data: entryCountsDaily,
                    backgroundColor: '#60a5fa',
                    stack: 'entry',
                    yAxisID: 'y',
                    z:1,
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
                    // ✅ 마지막에 둬야 실제로 가장 위에 렌더됨
                    type: 'line',
                    label: '수익 (₩)',
                    data: revenues,
                    borderColor: '#facc15',
                    borderWidth: 2,
                    pointRadius: 3,
                    tension: 0.4,
                    fill: false,
                    yAxisID: 'y1',
                    z: 10, // ✅ 이거 추가
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
                    labels: {
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },

            elements: {  // ✅ 여기로 빼줘야 적용됨
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



const labels = ['월', '화', '수', '목', '금', '토', '일'];
const values = [12, 15, 10, 8, 20, 25, 18];
window.weeklyEntryChart = renderWeeklyEntryChart(labels, values);

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



