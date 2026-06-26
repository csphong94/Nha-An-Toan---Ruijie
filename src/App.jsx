import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  
  // Lấy MAC thật từ URL do Ruijie gán vào (ví dụ: ?mac=AA:BB:CC...)
  const urlParams = new URLSearchParams(window.location.search);
  const realMac = urlParams.get('mac') || urlParams.get('client_mac') || 'UNKNOWN_MAC';

  useEffect(() => {
    // Tải cấu hình Public từ Backend (Tên trang, Lời chào, Danh sách Gói cước)
    fetch('/api/admin/config/public')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error("Lỗi tải cấu hình:", err));
  }, []);

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

  const handleVipAuth = async (packageId) => {
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
            ssid: urlParams.get('ssid'),
            packageId: packageId // Truyền ID gói cước vừa chọn
        })
      });
      const data = await res.json();
      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        setStatus('Lỗi tạo thanh toán MoMo: ' + JSON.stringify(data.error));
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (err) {
      setStatus('Lỗi kết nối máy chủ khi tạo thanh toán MoMo');
      setTimeout(() => setStatus(null), 3000);
    }
  };

  // SVG Icons
  const WifiIcon = () => (
    <svg className="w-16 h-16 mx-auto mb-6 text-orange-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"></path>
    </svg>
  );

  const RocketIcon = () => (
    <svg className="w-6 h-6 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
    </svg>
  );

  if (status) {
    return (
      <div className="app-container">
        <div className="glass-card text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="title mb-2">{status}</h2>
          <p className="subtitle text-sm">Vui lòng chờ trong giây lát...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="app-container">
        <div className="glass-card text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        </div>
      </div>
    );
  }

  // Tách gói Free và VIP
  const freePackages = config.packages.filter(p => p.type === 'free');
  const vipPackages = config.packages.filter(p => p.type === 'vip');

  return (
    <div className="app-container">
      <div className="glass-card text-center relative z-10">
        <WifiIcon />
        <h1 className="title mb-2">{config.portal.title}</h1>
        <p className="subtitle mb-6">{config.portal.subtitle}</p>

        {/* Thông tin thiết bị */}
        <div className="mb-6" style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--surface-border)' }}>
          <div className="flex justify-between mb-2" style={{ fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Thiết bị của bạn:</span>
            <span className="font-mono text-gray-300">{realMac}</span>
          </div>
          <div className="flex justify-between items-center" style={{ fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Trạng thái:</span>
            <span className="flex items-center" style={{ color: 'var(--accent-vip)', fontWeight: '600' }}>
              <span className="w-2 h-2 rounded-full mr-2 animate-pulse" style={{ backgroundColor: 'var(--accent-vip)' }}></span>
              Chưa kết nối
            </span>
          </div>
        </div>

        <div className="flex-col gap-4">
          {/* Nút Gói Free */}
          {freePackages.length > 0 && (
            <button
              onClick={handleFreeAuth}
              disabled={loading}
              className="btn btn-free mb-6"
            >
              <div className="flex-col items-center justify-center w-full">
                <span style={{ display: 'block', fontSize: '1.1rem', marginBottom: '4px' }}>{freePackages[0].name}</span>
                <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 'normal' }}>Quảng cáo / Giới hạn tốc độ</span>
              </div>
            </button>
          )}

          {/* Các Gói VIP */}
          {vipPackages.length > 0 && (
            <div>
              <h3 className="mb-4" style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Nâng cấp VIP (Không giới hạn)
              </h3>
              
              <div className="flex-col gap-3">
                {vipPackages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => handleVipAuth(pkg.id)}
                    className="btn btn-vip w-full flex justify-between items-center"
                    style={{ marginBottom: '0.75rem' }}
                  >
                    <div className="flex items-center">
                      <RocketIcon />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '1rem' }}>{pkg.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)', fontWeight: 'normal' }}>{pkg.durationDays} Ngày sử dụng</div>
                      </div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.25rem 0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                      {pkg.price.toLocaleString('vi-VN')}đ
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
