// ========================================
// 고객지원 페이지 (support.js)
// ========================================

let supportSocket = null;
let chatSession = null;
let agentInfo = null;
let currentTicketId = null;
let faqData = [];
let currentFAQCategory = 'all';
let supportUpdateInterval = null;
let typingTimeout = null;
let reconnectAttempts = 0;
let maxReconnectAttempts = 5;

// ========================================
// 초기화
// ========================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎧 고객지원 모듈 로드됨');

  initializeCommon()
  // 고객지원 페이지 초기화
  initializeSupportPage();

  console.log('✅ 고객지원 페이지 초기화 완료');
});

function initializeSupportPage() {
  // 초기 데이터 로드
  loadInitialSupportData();

  // 문의하기 폼 이벤트 설정
  setupInquiryForm();

  // FAQ 시스템 초기화
  initializeFAQSystem();

  // 실시간 채팅 초기화
  initializeRealtimeChat();

  // 파일 업로드 시스템 설정
  setupAdvancedFileUpload();

  // 지식베이스 검색 초기화
  initializeKnowledgeBase();

  // 실시간 업데이트 시작
  startSupportUpdates();
}

// ========================================
// 초기 데이터 로드
// ========================================
async function loadInitialSupportData() {
  showLoading('지원 정보를 불러오는 중...');

  try {
    await Promise.all([
      loadFAQData(),
      loadSupportSettings(),
      loadUserTickets(),
      checkAgentAvailability()
    ]);

    hideLoading();
  } catch (error) {
    hideLoading();
    console.error('❌ 초기 지원 데이터 로드 실패:', error);
    showToast('지원 정보를 불러오는데 실패했습니다.', 'error');
  }
}

// ========================================
// FAQ 시스템 (동적 로드)
// ========================================
async function loadFAQData() {
  console.log('❓ FAQ 데이터 로드 중...');

  try {
    const data = await apiRequest('/api/support/faq');
    if (!data || !data.faqs) return false;

    faqData = data.faqs;
    renderFAQCategories(data.categories || []);
    renderFAQItems(data.faqs);

    console.log('✅ FAQ 데이터 로드 완료', { count: data.faqs.length });
    return true;
  } catch (error) {
    console.error('❌ FAQ 데이터 로드 실패:', error);
    return false;
  }
}

function renderFAQCategories(categories) {
  const container = document.getElementById('faq-categories');
  if (!container) return;

  container.innerHTML = `
    <button class="category-btn active" onclick="filterFAQ('all')">전체</button>
  `;

  categories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'category-btn';
    button.onclick = () => filterFAQ(category.code);
    button.innerHTML = `
      <span class="category-icon">${category.icon}</span>
      <span class="category-name">${category.name}</span>
      <span class="category-count">${category.count}</span>
    `;
    container.appendChild(button);
  });
}

function renderFAQItems(faqs) {
  const container = document.getElementById('faq-container');
  if (!container) return;

  container.innerHTML = '';

  if (faqs && faqs.length > 0) {
    faqs.forEach(faq => {
      const item = createFAQItem(faq);
      container.appendChild(item);
    });
  } else {
    container.innerHTML = `
      <div class="no-faq-message">
        <div class="no-faq-icon">🔍</div>
        <p>검색 결과가 없습니다.</p>
        <button onclick="clearFAQSearch()" class="btn-clear-search">검색 초기화</button>
      </div>
    `;
  }
}

function createFAQItem(faq) {
  const item = document.createElement('div');
  item.className = 'faq-item';
  item.setAttribute('data-category', faq.category);
  item.setAttribute('data-id', faq.id);

  item.innerHTML = `
    <div class="faq-question" onclick="toggleFAQ(this)">
      <div class="faq-question-content">
        <span class="faq-category-badge">${getCategoryName(faq.category)}</span>
        <span class="faq-question-text">${escapeHtml(faq.question)}</span>
        ${faq.isPopular ? '<span class="popular-badge">인기</span>' : ''}
        ${faq.isNew ? '<span class="new-badge">신규</span>' : ''}
      </div>
      <div class="faq-toggle">+</div>
    </div>
    <div class="faq-answer" style="display: none;">
      <div class="faq-answer-content">
        ${faq.answer}
        ${faq.attachments && faq.attachments.length > 0 ? `
          <div class="faq-attachments">
            <h5>첨부파일</h5>
            ${faq.attachments.map(file => `
              <a href="${file.url}" download class="attachment-link">
                <span class="attachment-icon">📎</span>
                ${file.name}
              </a>
            `).join('')}
          </div>
        ` : ''}
        ${faq.relatedArticles && faq.relatedArticles.length > 0 ? `
          <div class="related-articles">
            <h5>관련 문서</h5>
            ${faq.relatedArticles.map(article => `
              <a href="#" onclick="showArticle('${article.id}')" class="related-link">
                ${article.title}
              </a>
            `).join('')}
          </div>
        ` : ''}
      </div>
      <div class="faq-actions">
        <button onclick="rateFAQ('${faq.id}', 'helpful')" class="btn-faq-action helpful">
          👍 도움됨 <span class="count">${faq.helpfulCount || 0}</span>
        </button>
        <button onclick="rateFAQ('${faq.id}', 'not-helpful')" class="btn-faq-action not-helpful">
          👎 도움안됨 <span class="count">${faq.notHelpfulCount || 0}</span>
        </button>
        <button onclick="requestMoreInfo('${faq.id}')" class="btn-faq-action more-info">
          ✋ 추가 문의
        </button>
      </div>
    </div>
  `;

  return item;
}

function getCategoryName(categoryCode) {
  const categoryMap = {
    'reservation': '예약',
    'payment': '결제',
    'parking': '주차',
    'account': '계정',
    'technical': '기술지원',
    'general': '일반'
  };
  return categoryMap[categoryCode] || categoryCode;
}

function initializeFAQSystem() {
  const searchInput = document.getElementById('faq-search');
  if (searchInput) {
    const debouncedSearch = debounce(searchFAQ, 300);
    searchInput.addEventListener('input', debouncedSearch);
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        searchFAQ();
      }
    });
  }
}

async function searchFAQ() {
  const searchTerm = document.getElementById('faq-search')?.value.trim();

  if (!searchTerm) {
    renderFAQItems(faqData);
    return;
  }

  try {
    const params = new URLSearchParams({
      q: searchTerm,
      category: currentFAQCategory !== 'all' ? currentFAQCategory : ''
    });

    const data = await apiRequest(`/api/support/faq/search?${params.toString()}`);

    if (data && data.results) {
      renderFAQItems(data.results);

      // 검색 분석 트래킹
      trackFAQSearch(searchTerm, data.results.length);
    }
  } catch (error) {
    console.error('❌ FAQ 검색 실패:', error);
    // 클라이언트 사이드 검색으로 대체
    const results = faqData.filter(faq => {
      const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = currentFAQCategory === 'all' || faq.category === currentFAQCategory;
      return matchesSearch && matchesCategory;
    });

    renderFAQItems(results);
  }
}

function filterFAQ(category) {
  currentFAQCategory = category;

  // 카테고리 버튼 active 상태 변경
  document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  // 검색어가 있으면 검색 재실행, 없으면 필터링
  const searchTerm = document.getElementById('faq-search')?.value.trim();
  if (searchTerm) {
    searchFAQ();
  } else {
    const filteredFAQs = category === 'all' ? faqData : faqData.filter(faq => faq.category === category);
    renderFAQItems(filteredFAQs);
  }
}

function clearFAQSearch() {
  const searchInput = document.getElementById('faq-search');
  if (searchInput) {
    searchInput.value = '';
  }

  renderFAQItems(faqData);
  showToast('검색이 초기화되었습니다.', 'info');
}

function toggleFAQ(element) {
  const faqItem = element.closest('.faq-item');
  const answer = faqItem.querySelector('.faq-answer');
  const toggle = element.querySelector('.faq-toggle');
  const faqId = faqItem.getAttribute('data-id');

  if (answer.style.display === 'block') {
    answer.style.display = 'none';
    toggle.textContent = '+';
    faqItem.classList.remove('active');
  } else {
    // 다른 FAQ 닫기
    document.querySelectorAll('.faq-item').forEach(item => {
      const otherAnswer = item.querySelector('.faq-answer');
      const otherToggle = item.querySelector('.faq-toggle');
      otherAnswer.style.display = 'none';
      otherToggle.textContent = '+';
      item.classList.remove('active');
    });

    // 현재 FAQ 열기
    answer.style.display = 'block';
    toggle.textContent = '−';
    faqItem.classList.add('active');

    // FAQ 조회 트래킹
    trackFAQView(faqId);
  }
}

async function rateFAQ(faqId, rating) {
  try {
    await apiRequest(`/api/support/faq/${faqId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating })
    });

    showToast(rating === 'helpful' ? '피드백 감사합니다!' : '의견 감사합니다. 개선하겠습니다.', 'success');

    // UI 업데이트
    updateFAQRating(faqId, rating);
  } catch (error) {
    console.error('❌ FAQ 평가 실패:', error);
    showToast('평가 처리에 실패했습니다.', 'error');
  }
}

function updateFAQRating(faqId, rating) {
  const faqItem = document.querySelector(`[data-id="${faqId}"]`);
  if (!faqItem) return;

  const button = faqItem.querySelector(`.btn-faq-action.${rating}`);
  if (button) {
    const countSpan = button.querySelector('.count');
    if (countSpan) {
      const currentCount = parseInt(countSpan.textContent) || 0;
      countSpan.textContent = currentCount + 1;
    }

    // 애니메이션 효과
    button.classList.add('clicked');
    setTimeout(() => button.classList.remove('clicked'), 300);
  }
}

async function requestMoreInfo(faqId) {
  if (confirm('이 FAQ에 대한 추가 문의를 하시겠습니까?\n상담사가 더 자세한 정보를 제공해드립니다.')) {
    try {
      const faq = faqData.find(f => f.id === faqId);
      if (faq) {
        // 문의 폼에 FAQ 정보 미리 채우기
        prefillInquiryForm(faq);

        // 문의 폼으로 스크롤
        document.getElementById('inquiry-section')?.scrollIntoView({ behavior: 'smooth' });

        showToast('문의 폼에 관련 정보가 입력되었습니다.', 'info');
      }
    } catch (error) {
      console.error('❌ 추가 문의 요청 실패:', error);
    }
  }
}

function prefillInquiryForm(faq) {
  const typeSelect = document.getElementById('inquiry-type');
  const titleInput = document.getElementById('inquiry-title');
  const contentTextarea = document.getElementById('inquiry-content');

  if (typeSelect) {
    typeSelect.value = faq.category;
  }

  if (titleInput) {
    titleInput.value = `[FAQ 추가문의] ${faq.question}`;
  }

  if (contentTextarea) {
    contentTextarea.value = `다음 FAQ에 대한 추가 문의입니다:\n\nQ: ${faq.question}\nA: ${faq.answer.replace(/<[^>]*>/g, '')}\n\n추가 문의사항:\n`;
    contentTextarea.focus();
  }
}

// ========================================
// 실시간 채팅 시스템 (WebSocket)
// ========================================
function initializeRealtimeChat() {
  checkAgentAvailability();

  // 페이지 언로드 시 채팅 세션 정리
  window.addEventListener('beforeunload', () => {
    if (supportSocket) {
      supportSocket.close();
    }
  });
}

async function checkAgentAvailability() {
  try {
    const data = await apiRequest('/api/support/chat/availability');

    updateChatAvailability(data);

    // 1분마다 가용성 재확인
    setTimeout(checkAgentAvailability, 60000);
  } catch (error) {
    console.error('❌ 상담사 가용성 확인 실패:', error);
    // 기본값으로 설정
    updateChatAvailability({
      available: false,
      queueLength: 0,
      estimatedWaitTime: 0
    });
  }
}

function updateChatAvailability(data) {
  const statusElement = document.querySelector('.chat-status');
  const chatBtn = document.querySelector('.chat-btn');
  const queueInfo = document.querySelector('.chat-queue-info');

  if (!statusElement || !chatBtn) return;

  if (data.available) {
    statusElement.innerHTML = `
      <span class="status-indicator online"></span>
      <span class="status-text">상담사 대기중</span>
    `;
    chatBtn.disabled = false;
    chatBtn.textContent = '채팅 상담 시작';

    if (queueInfo) {
      queueInfo.style.display = 'none';
    }
  } else {
    statusElement.innerHTML = `
      <span class="status-indicator offline"></span>
      <span class="status-text">상담사 부재중</span>
    `;

    if (data.queueLength > 0) {
      chatBtn.disabled = false;
      chatBtn.textContent = '대기열 참여';

      if (queueInfo) {
        queueInfo.innerHTML = `
          <div class="queue-status">
            대기 중인 고객: ${data.queueLength}명<br>
            예상 대기시간: 약 ${data.estimatedWaitTime}분
          </div>
        `;
        queueInfo.style.display = 'block';
      }
    } else {
      chatBtn.disabled = true;
      chatBtn.textContent = '상담 불가';

      if (queueInfo) {
        queueInfo.innerHTML = `
          <div class="offline-message">
            📞 전화 상담: 1588-1234<br>
            📧 이메일 문의: support@smartparking.com<br>
            ⏰ 상담시간: 평일 09:00-18:00
          </div>
        `;
        queueInfo.style.display = 'block';
      }
    }
  }
}

async function startChat() {
  try {
    // 채팅 세션 생성
    const sessionData = await apiRequest('/api/support/chat/start', {
      method: 'POST',
      body: JSON.stringify({
        userAgent: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer: document.referrer
      })
    });

    if (!sessionData || !sessionData.sessionId) {
      throw new Error('채팅 세션 생성 실패');
    }

    chatSession = sessionData;

    // WebSocket 연결
    await connectChatWebSocket(sessionData.sessionId);

    // 채팅 모달 표시
    showChatModal();

  } catch (error) {
    console.error('❌ 채팅 시작 실패:', error);
    showToast('채팅 연결에 실패했습니다. 잠시 후 다시 시도해주세요.', 'error');
  }
}

async function connectChatWebSocket(sessionId) {
  const wsUrl = `wss://api.smartparking.com/ws/support/chat/${sessionId}`;

  supportSocket = new WebSocket(wsUrl);

  supportSocket.onopen = () => {
    console.log('✅ 채팅 WebSocket 연결됨');
    reconnectAttempts = 0;

    // 연결 확인 메시지
    addChatMessage('system', '상담사와 연결되었습니다. 무엇을 도와드릴까요?');
  };

  supportSocket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleChatMessage(data);
  };

  supportSocket.onclose = (event) => {
    console.log('채팅 WebSocket 연결 종료:', event.code, event.reason);

    if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
      // 자동 재연결 시도
      setTimeout(() => {
        reconnectAttempts++;
        console.log(`재연결 시도 ${reconnectAttempts}/${maxReconnectAttempts}`);
        connectChatWebSocket(sessionId);
      }, 2000 * reconnectAttempts);
    }
  };

  supportSocket.onerror = (error) => {
    console.error('❌ 채팅 WebSocket 오류:', error);
    showToast('채팅 연결에 문제가 발생했습니다.', 'error');
  };
}

function handleChatMessage(data) {
  switch (data.type) {
    case 'message':
      addChatMessage(data.sender, data.content, data.timestamp);
      break;
    case 'agent_assigned':
      agentInfo = data.agent;
      updateChatHeader(agentInfo);
      addChatMessage('system', `${agentInfo.name} 상담사가 배정되었습니다.`);
      break;
    case 'agent_typing':
      showTypingIndicator(data.agentName);
      break;
    case 'agent_stopped_typing':
      hideTypingIndicator();
      break;
    case 'queue_update':
      updateQueueStatus(data.queuePosition, data.estimatedWaitTime);
      break;
    case 'chat_ended':
      handleChatEnd(data.reason);
      break;
    case 'file_received':
      addFileMessage(data.file);
      break;
    case 'system_notification':
      addChatMessage('system', data.message);
      break;
  }
}

function showChatModal() {
  const chatModal = document.getElementById('chat-modal');
  if (chatModal) {
    chatModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // 채팅 입력창에 포커스
    setTimeout(() => {
      const chatInput = document.getElementById('chat-input');
      if (chatInput) chatInput.focus();
    }, 300);

    // 환영 메시지 추가
    addChatMessage('system', '안녕하세요! 스마트파킹 고객지원입니다. 어떤 도움이 필요하신가요?');
  }
}

function closeChat() {
  if (supportSocket && supportSocket.readyState === WebSocket.OPEN) {
    // 채팅 만족도 조사
    showChatSatisfactionSurvey();
  } else {
    closeChatModal();
  }
}

function closeChatModal() {
  const chatModal = document.getElementById('chat-modal');
  if (chatModal) {
    chatModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }

  // WebSocket 연결 종료
  if (supportSocket) {
    supportSocket.close(1000, 'User closed chat');
    supportSocket = null;
  }

  // 채팅 세션 정리
  chatSession = null;
  agentInfo = null;
}

function sendChatMessage() {
  const chatInput = document.getElementById('chat-input');
  const message = chatInput.value.trim();

  if (!message || !supportSocket || supportSocket.readyState !== WebSocket.OPEN) return;

  // 사용자 메시지 전송
  supportSocket.send(JSON.stringify({
    type: 'message',
    content: message,
    timestamp: new Date().toISOString()
  }));

  // UI에 메시지 추가
  addChatMessage('user', message);

  // 입력창 초기화
  chatInput.value = '';

  // 타이핑 상태 중지
  stopTypingIndicator();
}

function handleChatTyping() {
  if (!supportSocket || supportSocket.readyState !== WebSocket.OPEN) return;

  // 타이핑 상태 전송
  supportSocket.send(JSON.stringify({
    type: 'user_typing'
  }));

  // 3초 후 타이핑 중지
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    stopTypingIndicator();
  }, 3000);
}

function stopTypingIndicator() {
  if (!supportSocket || supportSocket.readyState !== WebSocket.OPEN) return;

  supportSocket.send(JSON.stringify({
    type: 'user_stopped_typing'
  }));

  clearTimeout(typingTimeout);
}

function handleChatEnter(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    sendChatMessage();
  }
}

function addChatMessage(type, content, timestamp = null) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;

  const messageDiv = document.createElement('div');
  const currentTime = timestamp ? new Date(timestamp) : new Date();
  const timeString = currentTime.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  messageDiv.className = `chat-message ${type}`;

  if (type === 'user') {
    messageDiv.innerHTML = `
      <div class="message-content">${escapeHtml(content)}</div>
      <div class="message-time">${timeString}</div>
    `;
  } else if (type === 'agent') {
    messageDiv.innerHTML = `
      <div class="agent-info">
        <img src="${agentInfo?.avatar || '/images/default-agent.png'}" alt="상담사" class="agent-avatar">
        <span class="agent-name">${agentInfo?.name || '상담사'}</span>
      </div>
      <div class="message-content">${escapeHtml(content)}</div>
      <div class="message-time">${timeString}</div>
    `;
  } else if (type === 'system') {
    messageDiv.innerHTML = `
      <div class="system-message">${escapeHtml(content)}</div>
      <div class="message-time">${timeString}</div>
    `;
  }

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // 새 메시지 알림 (채팅창이 최소화된 경우)
  if (type === 'agent' && document.hidden) {
    showDesktopNotification('새 메시지', content);
  }
}

function addFileMessage(file) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message file';

  messageDiv.innerHTML = `
    <div class="file-message">
      <div class="file-icon">📎</div>
      <div class="file-info">
        <div class="file-name">${escapeHtml(file.name)}</div>
        <div class="file-size">${formatFileSize(file.size)}</div>
      </div>
      <a href="${file.downloadUrl}" download class="file-download">다운로드</a>
    </div>
    <div class="message-time">${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</div>
  `;

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTypingIndicator(agentName) {
  const existingIndicator = document.getElementById('typing-indicator');
  if (existingIndicator) return;

  const chatMessages = document.getElementById('chat-messages');
  const indicator = document.createElement('div');
  indicator.id = 'typing-indicator';
  indicator.className = 'chat-message typing';
  indicator.innerHTML = `
    <div class="typing-content">
      <span class="typing-text">${agentName}님이 입력 중</span>
      <div class="typing-dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;

  chatMessages.appendChild(indicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

function updateChatHeader(agent) {
  const chatHeader = document.querySelector('.chat-header');
  if (!chatHeader || !agent) return;

  chatHeader.innerHTML = `
    <div class="agent-profile">
      <img src="${agent.avatar}" alt="${agent.name}" class="agent-avatar-header">
      <div class="agent-details">
        <div class="agent-name">${agent.name}</div>
        <div class="agent-title">${agent.title}</div>
        <div class="agent-status online">온라인</div>
      </div>
    </div>
    <div class="chat-actions">
      <button onclick="toggleChatMenu()" class="btn-chat-menu">⋮</button>
      <button onclick="closeChat()" class="btn-close-chat">✕</button>
    </div>
  `;
}

function updateQueueStatus(position, estimatedWaitTime) {
  const queueStatus = document.getElementById('queue-status');
  if (!queueStatus) return;

  queueStatus.innerHTML = `
    <div class="queue-info">
      <div class="queue-position">대기 순서: ${position}번</div>
      <div class="queue-wait-time">예상 대기시간: 약 ${estimatedWaitTime}분</div>
    </div>
  `;
}

function handleChatEnd(reason) {
  addChatMessage('system', `채팅이 종료되었습니다. (${reason})`);

  setTimeout(() => {
    showChatSatisfactionSurvey();
  }, 2000);
}

function showChatSatisfactionSurvey() {
  const surveyHtml = `
    <div class="chat-survey">
      <h4>상담 만족도 조사</h4>
      <p>오늘 상담은 어떠셨나요?</p>
      <div class="satisfaction-rating">
        <button onclick="submitChatRating(5)" class="rating-btn">😄 매우 만족</button>
        <button onclick="submitChatRating(4)" class="rating-btn">😊 만족</button>
        <button onclick="submitChatRating(3)" class="rating-btn">😐 보통</button>
        <button onclick="submitChatRating(2)" class="rating-btn">😞 불만족</button>
        <button onclick="submitChatRating(1)" class="rating-btn">😡 매우 불만족</button>
      </div>
      <textarea id="chat-feedback" placeholder="추가 의견이 있으시면 남겨주세요 (선택사항)"></textarea>
      <div class="survey-actions">
        <button onclick="skipChatSurvey()" class="btn-skip">건너뛰기</button>
      </div>
    </div>
  `;

  const chatMessages = document.getElementById('chat-messages');
  if (chatMessages) {
    chatMessages.innerHTML += surveyHtml;
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

async function submitChatRating(rating) {
  const feedback = document.getElementById('chat-feedback')?.value.trim();

  try {
    await apiRequest('/api/support/chat/rating', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: chatSession?.sessionId,
        rating: rating,
        feedback: feedback,
        agentId: agentInfo?.id
      })
    });

    showToast('피드백 감사합니다!', 'success');
  } catch (error) {
    console.error('❌ 채팅 평가 제출 실패:', error);
  }

  closeChatModal();
}

function skipChatSurvey() {
  closeChatModal();
}

// ========================================
// 고급 문의하기 시스템
// ========================================
function setupInquiryForm() {
  const inquiryForm = document.getElementById('inquiry-form');
  if (inquiryForm) {
    inquiryForm.addEventListener('submit', handleInquirySubmit);
  }

  // 내용 글자 수 실시간 체크
  const contentTextarea = document.getElementById('inquiry-content');
  if (contentTextarea) {
    contentTextarea.addEventListener('input', validateInquiryContent);
  }

  // 문의 유형별 템플릿 로드
  const typeSelect = document.getElementById('inquiry-type');
  if (typeSelect) {
    typeSelect.addEventListener('change', loadInquiryTemplate);
  }

  // 자동 저장 기능
  setupAutoSave();
}

async function loadInquiryTemplate() {
  const type = document.getElementById('inquiry-type').value;
  if (!type) return;

  try {
    const data = await apiRequest(`/api/support/inquiry-templates/${type}`);

    if (data && data.template) {
      const contentTextarea = document.getElementById('inquiry-content');
      if (contentTextarea && !contentTextarea.value.trim()) {
        contentTextarea.value = data.template.content;
        contentTextarea.placeholder = data.template.placeholder;
      }

      // 추천 제목 업데이트
      updateSuggestedTitles(data.template.suggestedTitles || []);
    }
  } catch (error) {
    console.error('❌ 문의 템플릿 로드 실패:', error);
  }
}

function updateSuggestedTitles(suggestedTitles) {
  const container = document.getElementById('suggested-titles');
  if (!container || !suggestedTitles.length) return;

  container.innerHTML = `
    <div class="suggested-titles-header">추천 제목:</div>
    <div class="suggested-titles-list">
      ${suggestedTitles.map(title => `
        <button type="button" onclick="selectSuggestedTitle('${escapeHtml(title)}')" class="suggested-title-btn">
          ${escapeHtml(title)}
        </button>
      `).join('')}
    </div>
  `;
  container.style.display = 'block';
}

function selectSuggestedTitle(title) {
  const titleInput = document.getElementById('inquiry-title');
  if (titleInput) {
    titleInput.value = title;
    titleInput.focus();
  }

  // 추천 제목 숨기기
  const container = document.getElementById('suggested-titles');
  if (container) {
    container.style.display = 'none';
  }
}

function setupAutoSave() {
  const formElements = ['inquiry-type', 'inquiry-title', 'inquiry-content'];
  const autoSaveKey = 'inquiry_draft';

  // 자동 저장 (3초마다)
  setInterval(() => {
    const formData = {};
    let hasData = false;

    formElements.forEach(id => {
      const element = document.getElementById(id);
      if (element && element.value.trim()) {
        formData[id] = element.value;
        hasData = true;
      }
    });

    if (hasData) {
      localStorage.setItem(autoSaveKey, JSON.stringify({
        ...formData,
        savedAt: new Date().toISOString()
      }));
    }
  }, 3000);

  // 페이지 로드 시 임시저장 복원
  const savedData = localStorage.getItem(autoSaveKey);
  if (savedData) {
    try {
      const data = JSON.parse(savedData);
      const savedAt = new Date(data.savedAt);
      const now = new Date();

      // 24시간 이내 데이터만 복원
      if (now.getTime() - savedAt.getTime() < 24 * 60 * 60 * 1000) {
        showRestoreDraftOption(data);
      } else {
        localStorage.removeItem(autoSaveKey);
      }
    } catch (error) {
      localStorage.removeItem(autoSaveKey);
    }
  }
}

function showRestoreDraftOption(draftData) {
  const notification = document.createElement('div');
  notification.className = 'draft-notification';
  notification.innerHTML = `
    <div class="draft-message">
      💾 임시저장된 문의 내용이 있습니다. (${new Date(draftData.savedAt).toLocaleString()})
    </div>
    <div class="draft-actions">
      <button onclick="restoreDraft()" class="btn-restore">복원</button>
      <button onclick="deleteDraft()" class="btn-delete">삭제</button>
    </div>
  `;

  const inquirySection = document.getElementById('inquiry-section');
  if (inquirySection) {
    inquirySection.insertBefore(notification, inquirySection.firstChild);
  }

  // 전역에서 접근할 수 있도록 데이터 저장
  window.draftData = draftData;
}

function restoreDraft() {
  if (!window.draftData) return;

  Object.keys(window.draftData).forEach(key => {
    if (key !== 'savedAt') {
      const element = document.getElementById(key);
      if (element) {
        element.value = window.draftData[key];
      }
    }
  });

  deleteDraft();
  showToast('임시저장된 내용이 복원되었습니다.', 'success');
}

function deleteDraft() {
  localStorage.removeItem('inquiry_draft');
  const notification = document.querySelector('.draft-notification');
  if (notification) {
    notification.remove();
  }
  window.draftData = null;
}

async function handleInquirySubmit(event) {
  event.preventDefault();

  if (!validateInquiryForm()) {
    return;
  }

  const formData = collectInquiryData();

  try {
    showLoading('문의사항을 전송하는 중...');

    const response = await submitInquiryToServer(formData);

    hideLoading();

    if (response && response.ticketId) {
      currentTicketId = response.ticketId;
      showInquirySuccessModal(response);

      // 임시저장 데이터 삭제
      localStorage.removeItem('inquiry_draft');

      // 폼 초기화
      resetInquiryForm();
    }

  } catch (error) {
    hideLoading();
    showToast('문의사항 전송에 실패했습니다. 다시 시도해주세요.', 'error');
    console.error('❌ 문의 전송 실패:', error);
  }
}

function showInquirySuccessModal(response) {
  const modalContent = `
    <div class="inquiry-success-modal">
      <div class="success-icon">✅</div>
      <h3>문의가 접수되었습니다</h3>
      <div class="ticket-info">
        <div class="ticket-id">티켓번호: ${response.ticketId}</div>
        <div class="ticket-status">상태: 접수완료</div>
        <div class="estimated-response">예상 답변시간: ${response.estimatedResponseTime}</div>
      </div>
      <div class="success-actions">
        <button onclick="trackTicket('${response.ticketId}')" class="btn-track">티켓 추적</button>
        <button onclick="closeSuccessModal()" class="btn-close">확인</button>
      </div>
      <div class="additional-info">
        <p>📧 이메일로도 접수 확인 메일을 발송해드렸습니다.</p>
        <p>📱 상태 변경 시 SMS로 알려드립니다.</p>
      </div>
    </div>
  `;

  // 모달 표시 (실제로는 모달 컴포넌트 사용)
  alert(modalContent.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim());
}

async function trackTicket(ticketId) {
  try {
    const data = await apiRequest(`/api/support/tickets/${ticketId}`);

    if (data) {
      showTicketTrackingModal(data);
    }
  } catch (error) {
    console.error('❌ 티켓 추적 실패:', error);
    showToast('티켓 정보를 불러올 수 없습니다.', 'error');
  }
}

function showTicketTrackingModal(ticketData) {
  // 티켓 추적 모달 구현
  const trackingInfo = `
티켓 추적 정보

번호: ${ticketData.id}
제목: ${ticketData.title}
상태: ${ticketData.status}
접수일: ${ticketData.createdAt}
${ticketData.assignedAgent ? `담당자: ${ticketData.assignedAgent.name}` : ''}
${ticketData.lastUpdate ? `최종 업데이트: ${ticketData.lastUpdate}` : ''}

진행 상황:
${ticketData.timeline.map(item => `• ${item.timestamp}: ${item.description}`).join('\n')}
  `;

  alert(trackingInfo);
}

function validateInquiryForm() {
  const type = document.getElementById('inquiry-type').value;
  const title = document.getElementById('inquiry-title').value.trim();
  const content = document.getElementById('inquiry-content').value.trim();
  const email = document.getElementById('reply-email').value.trim();
  const phone = document.getElementById('reply-phone').value.trim();
  const privacyAgreement = document.getElementById('privacy-agreement').checked;

  if (!type) {
    showToast('문의 유형을 선택해주세요.', 'error');
    return false;
  }

  if (!title || title.length < 5) {
    showToast('제목을 5자 이상 입력해주세요.', 'error');
    return false;
  }

  if (!content || content.length < 10) {
    showToast('내용을 10자 이상 입력해주세요.', 'error');
    return false;
  }

  if (!validateEmail(email)) {
    showToast('올바른 이메일 주소를 입력해주세요.', 'error');
    return false;
  }

  if (!validatePhone(phone)) {
    showToast('올바른 전화번호를 입력해주세요.', 'error');
    return false;
  }

  if (!privacyAgreement) {
    showToast('개인정보 수집 및 이용에 동의해주세요.', 'error');
    return false;
  }

  return true;
}

function validateInquiryContent() {
  const content = document.getElementById('inquiry-content').value.trim();
  const counter = document.getElementById('content-counter');
  const small = document.querySelector('#inquiry-content + small');

  if (counter) {
    counter.textContent = `${content.length}/1000`;
  }

  if (small) {
    if (content.length < 10) {
      small.style.color = '#ef4444';
      small.textContent = `최소 10자 이상 입력해주세요 (현재: ${content.length}자)`;
    } else {
      small.style.color = '#6b7280';
      small.textContent = '적절한 길이입니다';
    }
  }
}

function collectInquiryData() {
  return {
    type: document.getElementById('inquiry-type').value,
    urgent: document.getElementById('inquiry-urgent')?.value,
    title: document.getElementById('inquiry-title').value.trim(),
    content: document.getElementById('inquiry-content').value.trim(),
    replyEmail: document.getElementById('reply-email').value.trim(),
    replyPhone: document.getElementById('reply-phone').value.trim(),
    files: document.getElementById('inquiry-file')?.files,
    userAgent: navigator.userAgent,
    referrer: document.referrer,
    currentUrl: window.location.href,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    createdAt: new Date().toISOString()
  };
}

async function submitInquiryToServer(formData) {
  const submitData = new FormData();

  Object.keys(formData).forEach(key => {
    if (key === 'files' && formData.files) {
      Array.from(formData.files).forEach(file => {
        submitData.append('files', file);
      });
    } else if (typeof formData[key] === 'string') {
      submitData.append(key, formData[key]);
    }
  });

  const response = await apiRequest('/api/support/tickets', {
    method: 'POST',
    body: submitData,
    headers: {
      // Content-Type을 설정하지 않음 (FormData가 자동 설정)
    }
  });

  return response;
}

function resetInquiryForm() {
  const form = document.getElementById('inquiry-form');
  if (form) {
    form.reset();

    // 파일 입력 초기화
    const fileInput = document.getElementById('inquiry-file');
    if (fileInput) {
      fileInput.value = '';
      updateFileList([]);
    }

    // 내용 검증 메시지 초기화
    const small = document.querySelector('#inquiry-content + small');
    if (small) {
      small.style.color = '#6b7280';
      small.textContent = '최소 10자 이상 입력해주세요';
    }

    // 글자 수 카운터 초기화
    const counter = document.getElementById('content-counter');
    if (counter) {
      counter.textContent = '0/1000';
    }
  }
}

// ========================================
// 고급 파일 업로드 시스템
// ========================================
function setupAdvancedFileUpload() {
  const fileInput = document.getElementById('inquiry-file');
  const dropZone = document.getElementById('file-drop-zone');

  if (fileInput) {
    fileInput.addEventListener('change', handleFileSelect);
  }

  if (dropZone) {
    setupDragAndDrop(dropZone, fileInput);
  }
}

function setupDragAndDrop(dropZone, fileInput) {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleDroppedFiles(files, fileInput);
    }
  });

  dropZone.addEventListener('click', () => {
    fileInput.click();
  });
}

function handleDroppedFiles(files, fileInput) {
  // 드래그앤드롭으로 추가된 파일을 input에 설정
  const dataTransfer = new DataTransfer();

  // 기존 파일들 추가
  if (fileInput.files) {
    Array.from(fileInput.files).forEach(file => {
      dataTransfer.items.add(file);
    });
  }

  // 새 파일들 추가
  Array.from(files).forEach(file => {
    dataTransfer.items.add(file);
  });

  fileInput.files = dataTransfer.files;
  handleFileSelect({ target: fileInput });
}

function handleFileSelect(event) {
  const files = event.target.files;

  if (!validateFiles(files)) {
    event.target.value = '';
    return;
  }

  updateFileList(files);
  previewFiles(files);
}

function validateFiles(files) {
  const maxFiles = 5;
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (files.length > maxFiles) {
    showToast(`최대 ${maxFiles}개 파일까지 업로드 가능합니다.`, 'error');
    return false;
  }

  let totalSize = 0;
  for (let file of files) {
    totalSize += file.size;

    // 개별 파일 크기 검사
    if (file.size > maxSize) {
      showToast(`${file.name}의 크기가 10MB를 초과합니다.`, 'error');
      return false;
    }

    // 파일 형식 검사
    if (!allowedTypes.includes(file.type)) {
      showToast(`${file.name}은(는) 지원하지 않는 파일 형식입니다.`, 'error');
      return false;
    }
  }

  // 전체 파일 크기 검사 (50MB)
  if (totalSize > 50 * 1024 * 1024) {
    showToast('전체 파일 크기가 50MB를 초과할 수 없습니다.', 'error');
    return false;
  }

  return true;
}

function updateFileList(files) {
  const fileList = document.getElementById('file-list');
  if (!fileList) return;

  fileList.innerHTML = '';

  if (files.length === 0) {
    fileList.style.display = 'none';
    return;
  }

  fileList.style.display = 'block';

  Array.from(files).forEach((file, index) => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
      <div class="file-info">
        <div class="file-icon">${getFileIcon(file.type)}</div>
        <div class="file-details">
          <div class="file-name" title="${file.name}">${file.name}</div>
          <div class="file-size">${formatFileSize(file.size)}</div>
        </div>
      </div>
      <div class="file-actions">
        <button type="button" onclick="removeFile(${index})" class="btn-remove-file">✕</button>
      </div>
    `;
    fileList.appendChild(fileItem);
  });
}

function removeFile(index) {
  const fileInput = document.getElementById('inquiry-file');
  if (!fileInput) return;

  const dataTransfer = new DataTransfer();
  const files = Array.from(fileInput.files);

  files.forEach((file, i) => {
    if (i !== index) {
      dataTransfer.items.add(file);
    }
  });

  fileInput.files = dataTransfer.files;
  updateFileList(fileInput.files);
}

function getFileIcon(fileType) {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType === 'application/pdf') return '📄';
  if (fileType.includes('word')) return '📝';
  if (fileType === 'text/plain') return '📄';
  return '📎';
}

function previewFiles(files) {
  const previewContainer = document.getElementById('file-preview');
  if (!previewContainer) return;

  previewContainer.innerHTML = '';

  Array.from(files).forEach(file => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.className = 'file-preview-image';
        img.alt = file.name;
        previewContainer.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });
}

// ========================================
// 지식베이스 시스템
// ========================================
function initializeKnowledgeBase() {
  // 스마트 검색 바 설정
  setupSmartSearch();

  // 인기 검색어 로드
  loadPopularSearchTerms();

  // 최근 본 문서 로드
  loadRecentDocuments();
}

function setupSmartSearch() {
  const searchInput = document.getElementById('knowledge-search');
  if (!searchInput) return;

  const debouncedSearch = debounce(performSmartSearch, 300);

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (query.length >= 2) {
      debouncedSearch(query);
    } else {
      hideSearchSuggestions();
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      performKnowledgeSearch(e.target.value.trim());
    }
  });
}

async function performSmartSearch(query) {
  try {
    const data = await apiRequest(`/api/support/knowledge/suggest?q=${encodeURIComponent(query)}`);

    if (data && data.suggestions) {
      showSearchSuggestions(data.suggestions);
    }
  } catch (error) {
    console.error('❌ 스마트 검색 실패:', error);
  }
}

function showSearchSuggestions(suggestions) {
  const suggestionsContainer = document.getElementById('search-suggestions');
  if (!suggestionsContainer) return;

  suggestionsContainer.innerHTML = '';

  suggestions.forEach(suggestion => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.innerHTML = `
      <div class="suggestion-icon">${suggestion.type === 'faq' ? '❓' : '📖'}</div>
      <div class="suggestion-content">
        <div class="suggestion-title">${escapeHtml(suggestion.title)}</div>
        <div class="suggestion-preview">${escapeHtml(suggestion.preview)}</div>
      </div>
    `;
    item.onclick = () => selectSuggestion(suggestion);
    suggestionsContainer.appendChild(item);
  });

  suggestionsContainer.style.display = 'block';
}

function hideSearchSuggestions() {
  const suggestionsContainer = document.getElementById('search-suggestions');
  if (suggestionsContainer) {
    suggestionsContainer.style.display = 'none';
  }
}

function selectSuggestion(suggestion) {
  if (suggestion.type === 'faq') {
    // FAQ 섹션으로 이동하고 해당 FAQ 열기
    document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      const faqItem = document.querySelector(`[data-id="${suggestion.id}"]`);
      if (faqItem) {
        const questionElement = faqItem.querySelector('.faq-question');
        toggleFAQ(questionElement);
      }
    }, 500);
  } else {
    // 문서 상세 보기
    showDocument(suggestion.id);
  }

  hideSearchSuggestions();
}

async function performKnowledgeSearch(query) {
  if (!query) return;

  try {
    showLoading('검색 중...');

    const data = await apiRequest(`/api/support/knowledge/search?q=${encodeURIComponent(query)}`);

    hideLoading();

    if (data) {
      showKnowledgeSearchResults(data.results, query);
      trackSearchQuery(query, data.results.length);
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 지식베이스 검색 실패:', error);
    showToast('검색에 실패했습니다.', 'error');
  }
}

function showKnowledgeSearchResults(results, query) {
  // 검색 결과 모달 또는 페이지 표시
  const searchResultsModal = `
    <div class="search-results-modal">
      <h3>"${query}" 검색 결과 (${results.length}건)</h3>
      <div class="search-results-list">
        ${results.map(result => `
          <div class="search-result-item" onclick="showDocument('${result.id}')">
            <div class="result-title">${escapeHtml(result.title)}</div>
            <div class="result-preview">${escapeHtml(result.preview)}</div>
            <div class="result-meta">
              <span class="result-type">${result.type}</span>
              <span class="result-date">${new Date(result.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // 실제로는 모달로 표시
  alert(searchResultsModal.replace(/<[^>]*>/g, '\n').replace(/\n+/g, '\n').trim());
}

async function loadPopularSearchTerms() {
  try {
    const data = await apiRequest('/api/support/knowledge/popular-terms');

    if (data && data.terms) {
      updatePopularSearchTerms(data.terms);
    }
  } catch (error) {
    console.error('❌ 인기 검색어 로드 실패:', error);
  }
}

function updatePopularSearchTerms(terms) {
  const container = document.getElementById('popular-search-terms');
  if (!container) return;

  container.innerHTML = `
    <h4>인기 검색어</h4>
    <div class="popular-terms-list">
      ${terms.map((term, index) => `
        <button onclick="performKnowledgeSearch('${escapeHtml(term)}')" class="popular-term-btn">
          <span class="term-rank">${index + 1}</span>
          <span class="term-text">${escapeHtml(term)}</span>
        </button>
      `).join('')}
    </div>
  `;
}

// ========================================
// 사용자 티켓 관리
// ========================================
async function loadUserTickets() {
  try {
    const data = await apiRequest('/api/support/tickets/my-tickets');

    if (data && data.tickets) {
      updateMyTicketsList(data.tickets);
    }
  } catch (error) {
    console.error('❌ 사용자 티켓 로드 실패:', error);
  }
}

function updateMyTicketsList(tickets) {
  const container = document.getElementById('my-tickets-list');
  if (!container) return;

  container.innerHTML = '';

  if (tickets.length === 0) {
    container.innerHTML = `
      <div class="no-tickets-message">
        <div class="no-tickets-icon">📝</div>
        <p>문의 내역이 없습니다.</p>
      </div>
    `;
    return;
  }

  tickets.forEach(ticket => {
    const item = createTicketItem(ticket);
    container.appendChild(item);
  });
}

function createTicketItem(ticket) {
  const item = document.createElement('div');
  item.className = 'ticket-item';

  const statusClass = ticket.status.toLowerCase();
  const statusText = getTicketStatusText(ticket.status);

  item.innerHTML = `
    <div class="ticket-header">
      <div class="ticket-id">#${ticket.id}</div>
      <div class="ticket-status status-${statusClass}">${statusText}</div>
    </div>
    <div class="ticket-content">
      <div class="ticket-title">${escapeHtml(ticket.title)}</div>
      <div class="ticket-meta">
        <span class="ticket-type">${getCategoryName(ticket.type)}</span>
        <span class="ticket-date">${new Date(ticket.createdAt).toLocaleDateString()}</span>
        ${ticket.assignedAgent ? `<span class="ticket-agent">${ticket.assignedAgent.name}</span>` : ''}
      </div>
      ${ticket.lastMessage ? `
        <div class="ticket-last-message">
          마지막 메시지: ${escapeHtml(ticket.lastMessage.content.substring(0, 100))}...
        </div>
      ` : ''}
    </div>
    <div class="ticket-actions">
      <button onclick="showTicketDetail('${ticket.id}')" class="btn-ticket-detail">상세보기</button>
      ${ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS' ?
      `<button onclick="addTicketReply('${ticket.id}')" class="btn-ticket-reply">답글</button>` : ''
  }
    </div>
  `;

  return item;
}

function getTicketStatusText(status) {
  const statusMap = {
    'OPEN': '접수',
    'IN_PROGRESS': '처리중',
    'WAITING': '대기',
    'RESOLVED': '해결',
    'CLOSED': '완료'
  };
  return statusMap[status] || status;
}

async function showTicketDetail(ticketId) {
  try {
    showLoading('티켓 상세 정보를 불러오는 중...');

    const data = await apiRequest(`/api/support/tickets/${ticketId}/detail`);

    hideLoading();

    if (data) {
      renderTicketDetailModal(data);
    }
  } catch (error) {
    hideLoading();
    console.error('❌ 티켓 상세 조회 실패:', error);
    showToast('티켓 정보를 불러올 수 없습니다.', 'error');
  }
}

function renderTicketDetailModal(ticketData) {
  // 티켓 상세 모달 구현 (간단한 예시)
  const detail = `
티켓 상세 정보

번호: #${ticketData.id}
제목: ${ticketData.title}
상태: ${getTicketStatusText(ticketData.status)}
유형: ${getCategoryName(ticketData.type)}
접수일: ${new Date(ticketData.createdAt).toLocaleString()}
${ticketData.assignedAgent ? `담당자: ${ticketData.assignedAgent.name}` : ''}

내용:
${ticketData.content}

${ticketData.messages && ticketData.messages.length > 0 ? `
메시지 기록:
${ticketData.messages.map(msg => `
[${new Date(msg.createdAt).toLocaleString()}] ${msg.sender}: ${msg.content}
`).join('')}` : ''}
  `;

  alert(detail);
}

// ========================================
// 연락처 및 위치 정보
// ========================================
async function loadSupportSettings() {
  try {
    const data = await apiRequest('/api/support/settings');

    if (data) {
      updateContactInfo(data.contact);
      updateBusinessHours(data.businessHours);
    }
  } catch (error) {
    console.error('❌ 지원 설정 로드 실패:', error);
  }
}

function updateContactInfo(contact) {
  if (!contact) return;

  // 전화번호 업데이트
  const phoneElements = document.querySelectorAll('.contact-phone');
  phoneElements.forEach(el => {
    el.textContent = contact.phone;
    el.href = `tel:${contact.phone}`;
  });

  // 이메일 업데이트
  const emailElements = document.querySelectorAll('.contact-email');
  emailElements.forEach(el => {
    el.textContent = contact.email;
    el.href = `mailto:${contact.email}`;
  });

  // 주소 업데이트
  const addressElements = document.querySelectorAll('.contact-address');
  addressElements.forEach(el => {
    el.textContent = contact.address;
  });
}

function updateBusinessHours(businessHours) {
  if (!businessHours) return;

  const hoursElement = document.getElementById('business-hours');
  if (hoursElement) {
    hoursElement.innerHTML = `
      <div class="hours-item">
        <span class="hours-label">평일:</span>
        <span class="hours-time">${businessHours.weekday}</span>
      </div>
      <div class="hours-item">
        <span class="hours-label">주말:</span>
        <span class="hours-time">${businessHours.weekend}</span>
      </div>
      <div class="hours-item">
        <span class="hours-label">공휴일:</span>
        <span class="hours-time">${businessHours.holiday}</span>
      </div>
    `;
  }
}

function makeCall() {
  const phoneNumber = document.querySelector('.contact-phone')?.textContent || '1588-1234';

  if (confirm(`${phoneNumber}로 전화를 거시겠습니까?`)) {
    // 모바일에서는 실제 전화 앱 실행
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      copyToClipboard(phoneNumber).then(() => {
        showToast(`전화번호 ${phoneNumber}가 클립보드에 복사되었습니다.`, 'success');
      });
    }
  }
}

function sendEmail() {
  const email = document.querySelector('.contact-email')?.textContent || 'support@smartparking.com';
  const subject = '[스마트파킹] 문의사항';
  const body = '안녕하세요. 문의할 내용을 입력해주세요.';

  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  try {
    window.location.href = mailtoLink;
  } catch (error) {
    copyToClipboard(email).then(() => {
      showToast(`이메일 주소 ${email}가 클립보드에 복사되었습니다.`, 'success');
    });
  }
}

function showMap() {
  const address = document.querySelector('.contact-address')?.textContent || '서울시 강남구 테헤란로 123';

  const mapUrl = `https://map.kakao.com/link/search/${encodeURIComponent(address)}`;

  const mapWindow = window.open(mapUrl, '_blank', 'width=800,height=600');
  if (!mapWindow) {
    showToast('팝업이 차단되었습니다. 팝업 허용 후 다시 시도해주세요.', 'warning');
  }
}

// ========================================
// 실시간 업데이트 및 분석
// ========================================
function startSupportUpdates() {
  // 5분마다 상담사 가용성 체크
  supportUpdateInterval = setInterval(() => {
    checkAgentAvailability();
  }, 300000);

  console.log('⏰ 고객지원 실시간 업데이트 시작');
}

function stopSupportUpdates() {
  if (supportUpdateInterval) {
    clearInterval(supportUpdateInterval);
    supportUpdateInterval = null;
  }

  console.log('⏰ 고객지원 실시간 업데이트 중지');
}

// 분석 및 트래킹 함수들
function trackFAQView(faqId) {
  try {
    apiRequest('/api/support/analytics/faq-view', {
      method: 'POST',
      body: JSON.stringify({ faqId, timestamp: new Date().toISOString() })
    });
  } catch (error) {
    // 분석 실패는 무시
  }
}

function trackFAQSearch(query, resultCount) {
  try {
    apiRequest('/api/support/analytics/faq-search', {
      method: 'POST',
      body: JSON.stringify({ query, resultCount, timestamp: new Date().toISOString() })
    });
  } catch (error) {
    // 분석 실패는 무시
  }
}

function trackSearchQuery(query, resultCount) {
  try {
    apiRequest('/api/support/analytics/knowledge-search', {
      method: 'POST',
      body: JSON.stringify({ query, resultCount, timestamp: new Date().toISOString() })
    });
  } catch (error) {
    // 분석 실패는 무시
  }
}

// ========================================
// 알림 및 푸시 기능
// ========================================
function showDesktopNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: '/images/logo-icon.png',
      badge: '/images/logo-icon.png'
    });
  }
}

async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return Notification.permission === 'granted';
}

// ========================================
// 유틸리티 함수들
// ========================================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  const phoneRegex = /^(\+82|0)(\d{2,3})(\d{3,4})(\d{4})$/;
  return phoneRegex.test(phone.replace(/[^0-9+]/g, ''));
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
}

// 로딩 및 토스트 함수들
function showLoading(message) {
  if (window.showLoading) {
    window.showLoading(message);
  } else {
    console.log('Loading:', message);
  }
}

function hideLoading() {
  if (window.hideLoading) {
    window.hideLoading();
  }
}

function showToast(message, type = 'info', duration = 3000) {
  if (window.showToast) {
    window.showToast(message, type, duration);
  } else {
    alert(message);
  }
}

// ========================================
// 페이지 정리
// ========================================
window.addEventListener('beforeunload', function() {
  stopSupportUpdates();

  if (supportSocket) {
    supportSocket.close();
  }
});

// ========================================
// 전역 함수 노출
// ========================================
window.makeCall = makeCall;
window.sendEmail = sendEmail;
window.showMap = showMap;
window.startChat = startChat;
window.closeChat = closeChat;
window.sendChatMessage = sendChatMessage;
window.handleChatEnter = handleChatEnter;
window.handleChatTyping = handleChatTyping;
window.submitChatRating = submitChatRating;
window.skipChatSurvey = skipChatSurvey;
window.filterFAQ = filterFAQ;
window.searchFAQ = searchFAQ;
window.clearFAQSearch = clearFAQSearch;
window.toggleFAQ = toggleFAQ;
window.rateFAQ = rateFAQ;
window.requestMoreInfo = requestMoreInfo;
window.resetInquiryForm = resetInquiryForm;
window.restoreDraft = restoreDraft;
window.deleteDraft = deleteDraft;
window.selectSuggestedTitle = selectSuggestedTitle;
window.removeFile = removeFile;
window.performKnowledgeSearch = performKnowledgeSearch;
window.trackTicket = trackTicket;
window.showTicketDetail = showTicketDetail;
window.addTicketReply = addTicketReply;