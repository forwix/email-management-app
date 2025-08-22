import React, { useEffect } from 'react';
import { trackPageView, trackClick } from './utils/tracking';

function SimpleApp() {
  useEffect(() => {
    // ページロード時にトラッキング
    trackPageView();
  }, []);

  const handleButtonClick = () => {
    // ボタンクリックをトラッキング
    trackClick('test-button');
    alert('Button clicked and tracked!');
  };

  const viewStats = () => {
    fetch('/api/analytics/stats')
      .then(res => res.json())
      .then(data => {
        alert(JSON.stringify(data, null, 2));
      })
      .catch(err => {
        alert('Error: ' + err.message);
      });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Email Management App</h1>
      <p>System Status: ✅ Working with Analytics!</p>
      <p>Backend API: Connected</p>
      
      <button 
        onClick={handleButtonClick}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
      >
        Test Button (Click Tracking)
      </button>
      
      <button 
        onClick={viewStats}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        View Analytics Stats
      </button>
    </div>
  );
}

export default SimpleApp;
