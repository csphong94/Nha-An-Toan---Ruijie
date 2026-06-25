import { useState } from 'react';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('login'); // 'login', 'payment', 'status'
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  
  // Lấy MAC thật từ URL do Ruijie gán vào (ví dụ: ?mac=AA:BB:CC...)
  const urlParams = new URLSearchParams(window.location.search);
  const realMac = urlParams.get('mac') || urlParams.get('client_mac') || 'UNKNOWN_MAC';
  const [macAddress] = useState(realMac);

  const handleFreeAuth = async () => {
    setLoading(true);
    setStatus('Đang kết nối...');

    try {
      const payload = { 
        mac: realMac, 
        nas_mac: urlParams.get('nas_mac'),
        ssid: urlParams.get('ssid'),
        sessionId: urlParams.get('sessionId')
      };
      
      const res = await fetch('/api/auth/free', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.authSuccess) {
        // Lấy return_url (link trang customHtml của Ruijie)
        const returnUrl = urlParams.get('return_url');
        if (returnUrl) {
          setStatus('Thành công! Đang xử lý cấp mạng...');
          // Redirect khách hàng trở lại customHtml của Ruijie, kèm theo voucherCode
          const separator = returnUrl.includes('?') ? '&' : '?';
          window.location.href = decodeURIComponent(returnUrl) + separator + 'voucher=' + data.voucherCode;
        } else {
          setStatus('Thành công! Đã cấp phát Voucher.');
        }
      } else {
        setStatus('Lỗi: ' + (data.error || data.message || 'Không xác định'));
      }
    } catch (err) {
      console.error(err);
      setStatus('Lỗi kết nối máy chủ');
    }
    setLoading(false);
  };



  if (status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-gray-700">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">{status}</h2>
          <p className="text-gray-400 text-sm">Vui lòng chờ trong giây lát...</p>
        </div>
      </div>
    );
  }

  const handleVIPSelect = () => {
    // Không cần chuyển sang trang Payment trung gian nữa, gọi API luôn
    handleVipAuth();
  };

  const handleVipAuth = async () => {
    setStatus('Đang chuyển hướng sang MoMo...');
    try {
      const res = await fetch('/api/payment/momo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            mac: realMac,
            sessionId: urlParams.get('sessionId'),
            return_url: urlParams.get('return_url'),
            nas_mac: urlParams.get('nas_mac'),
            ssid: urlParams.get('ssid')
        })
      });
      const data = await res.json();
      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        setStatus('Lỗi tạo thanh toán MoMo: ' + JSON.stringify(data.error));
        setTimeout(() => setStatus(''), 3000);
      }
    } catch (err) {
      setStatus('Lỗi kết nối máy chủ khi tạo thanh toán MoMo');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  // SVG Icons
  const WifiIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#EAB308', marginBottom: '1rem' }}>
      <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
      <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
      <line x1="12" y1="20" x2="12.01" y2="20"></line>
    </svg>
  );

  const CheckIcon = () => (
    <svg className="feature-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );

  const renderLogin = () => (
    <div className="glass-card text-center">
      <WifiIcon />
      <h1 className="title mb-2">Nha An Toan - Wifi</h1>
      <p className="subtitle mb-6">Chào mừng! Vui lòng chọn gói truy cập mạng của bạn.</p>

      {/* Behavioral Nudge: Put VIP first and make it shiny */}
      <div className="mb-4">
        <button className="btn btn-vip flex items-center justify-center gap-3" onClick={() => handleVIPSelect()}>
          Nâng cấp VIP - Tốc độ 100Mbps
          <span className="badge badge-free" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>Mượt mà</span>
        </button>
        <ul className="feature-list mb-4 mt-4" style={{ padding: '0 1rem' }}>
          <li className="feature-item"><CheckIcon /> Lướt web, xem phim 4K không lag</li>
          <li className="feature-item"><CheckIcon /> Chơi game ping thấp</li>
          <li className="feature-item"><CheckIcon /> Không bị ngắt kết nối</li>
        </ul>
      </div>

      <div style={{ height: '1px', background: 'var(--surface-border)', margin: '1.5rem 0' }}></div>

      {/* Behavioral Nudge: Free is secondary and muted */}
      <div>
        <button className="btn btn-free" onClick={() => handleFreeAuth()} disabled={loading}>
          {loading ? 'Đang kết nối...' : 'Dùng Miễn Phí (5Mbps)'}
        </button>
        <p className="text-gray-400 text-sm mt-4 text-center">
          Tốc độ cơ bản, có thể chậm khi tải video.
        </p>
      </div>

      {/* Debug Info for Developer */}
      <div className="mt-8 p-4 bg-gray-800 rounded-lg text-xs text-gray-400 break-all border border-gray-700">
        <p className="font-bold text-gray-300 mb-1">🛠 Debug Info (Gửi ảnh này cho Dev):</p>
        <p>{window.location.search}</p>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="glass-card text-center">
      <h2 className="title mb-4">Chọn gói VIP</h2>
      
      <div className="mb-4" style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--accent-vip)' }}>
        <div className="flex justify-between items-center mb-2">
          <strong style={{ color: 'var(--accent-vip)' }}>Gói 2 Giờ</strong>
          <span className="badge badge-vip">10,000đ</span>
        </div>
        <p className="subtitle" style={{ fontSize: '0.8rem' }}>Tối ưu cho một buổi cafe làm việc.</p>
      </div>

      <div className="mb-6" style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
        <div className="flex justify-between items-center mb-2">
          <strong>Gói Cả Ngày</strong>
          <span className="badge badge-free">25,000đ</span>
        </div>
        <p className="subtitle" style={{ fontSize: '0.8rem' }}>Thoải mái sử dụng không lo hết hạn.</p>
      </div>

      <button className="btn btn-vip mb-4" onClick={() => handlePaymentCreate()}>
        Thanh toán qua MoMo
      </button>

      <button className="btn btn-free" style={{ border: 'none' }} onClick={() => setCurrentView('login')}>
        Quay lại
      </button>
    </div>
  );

  const renderStatus = () => (
    <div className="glass-card text-center">
      <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'inline-block', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
      </div>
      
      <h2 className="title mb-2">Đã kết nối!</h2>
      <p className="subtitle mb-6">Bạn đang sử dụng gói Miễn Phí (5Mbps).</p>

      {/* Behavioral Nudge: Upsell after free connection */}
      <div style={{ background: 'rgba(234, 179, 8, 0.05)', border: '1px dashed rgba(234, 179, 8, 0.3)', padding: '1.5rem', borderRadius: '16px', marginBottom: '1.5rem' }}>
        <h3 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Cảm thấy mạng chậm?</h3>
        <p className="subtitle mb-4" style={{ fontSize: '0.85rem' }}>Nâng cấp băng thông ngay lập tức để trải nghiệm mượt mà hơn mà không cần đăng nhập lại.</p>
        <button className="btn btn-vip" onClick={() => setCurrentView('payment')} style={{ padding: '0.75rem', fontSize: '0.95rem' }}>
          Nâng cấp VIP ngay
        </button>
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
        Mẹo: Bạn có thể giữ lại trang này để nâng cấp bất cứ lúc nào.
      </p>
    </div>
  );

  return (
    <div className="app-container">
      {currentView === 'login' && renderLogin()}
      {currentView === 'payment' && renderPayment()}
      {currentView === 'status' && renderStatus()}
    </div>
  );
}

export default App;
