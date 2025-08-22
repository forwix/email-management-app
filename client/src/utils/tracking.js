// セッションIDの生成・取得
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// イベントトラッキング関数
export const trackEvent = async (eventType, metadata = {}) => {
  try {
    const response = await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: getSessionId(),
        pageUrl: window.location.href,
        eventType,
        referrer: document.referrer,
        metadata,
        timestamp: new Date()
      })
    });
    
    if (response.ok) {
      console.log(`Event tracked: ${eventType}`);
    }
  } catch (error) {
    console.error('Tracking error:', error);
  }
};

// ページビュートラッキング
export const trackPageView = () => {
  trackEvent('pageview', {
    title: document.title,
    path: window.location.pathname
  });
};

// クリックイベントトラッキング
export const trackClick = (elementName) => {
  trackEvent('click', {
    element: elementName,
    timestamp: new Date()
  });
};

export default { trackEvent, trackPageView, trackClick };
