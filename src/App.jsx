import { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState(null);
  
  // Modals state
  const [showVoucherInput, setShowVoucherInput] = useState(false);
  const [inputVoucherCode, setInputVoucherCode] = useState('');
  
  const [showAdminBypass, setShowAdminBypass] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const realMac = urlParams.get('mac') || urlParams.get('client_mac') || 'UNKNOWN_MAC';
  const returnUrl = urlParams.get('return_url');
  
  // Success states from URL
  const isSuccess = urlParams.get('success') === 'true';
  const successVoucher = urlParams.get('voucher');

  useEffect(() => {
    fetch('/api/admin/config/public')
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(err => console.error("Lỗi tải cấu hình:", err));
  }, []);

  const connectWithVoucher = (voucherCode) => {
    if (!returnUrl) {
       setStatus('Lỗi: Không tìm thấy return_url để kết nối.');
       return;
    }
    const separator = returnUrl.includes('?') ? '&' : '?';
    window.location.href = decodeURIComponent(returnUrl) + separator + 'voucher=' + voucherCode;
  };

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
        if (returnUrl) {
          setStatus('Thành công! Đang xử lý cấp mạng...');
          connectWithVoucher(data.voucherCode);
        } else {
          setStatus('Thành công! Đã cấp phát Voucher: ' + data.voucherCode);
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
            return_url: returnUrl,
            nas_mac: urlParams.get('nas_mac'),
            ssid: urlParams.get('ssid'),
            packageId: packageId
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

  const handleAdminAuth = async (packageId) => {
    setLoading(true);
    setStatus('Admin đang cấp phát Voucher...');
    try {
      const res = await fetch('/api/auth/admin-bypass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            password: adminPassword,
            packageId: packageId,
            mac: realMac,
            sessionId: urlParams.get('sessionId'),
            nas_mac: urlParams.get('nas_mac'),
            ssid: urlParams.get('ssid')
        })
      });
      const data = await res.json();
      if (data.authSuccess) {
        setStatus('Thành công! Mã Voucher: ' + data.voucherCode);
        setTimeout(() => {
          connectWithVoucher(data.voucherCode);
        }, 3000);
      } else {
        setStatus('Lỗi Admin: ' + (data.error || 'Sai mật khẩu'));
        setTimeout(() => setStatus(null), 3000);
      }
    } catch (err) {
      setStatus('Lỗi kết nối máy chủ');
      setTimeout(() => setStatus(null), 3000);
    }
    setLoading(false);
  };

  const handleManualVoucherSubmit = () => {
    if (!inputVoucherCode.trim()) {
       alert("Vui lòng nhập mã Voucher");
       return;
    }
    connectWithVoucher(inputVoucherCode.trim());
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
          <h2 className="title mb-2" style={{fontSize: '1.2rem'}}>{status}</h2>
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

  // Nếu là trang Thành Công (từ MoMo redirect về)
  if (isSuccess && successVoucher) {
    return (
      <div className="app-container">
        <div className="glass-card text-center relative z-10" style={{ border: '2px solid var(--success)'}}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', display: 'inline-block', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1 className="title mb-4" style={{color: 'var(--success)', WebkitTextFillColor: 'var(--success)'}}>Thanh Toán Thành Công!</h1>
          
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
            <p className="subtitle mb-2">Mã Truy Cập (Voucher) của bạn là:</p>
            <h2 style={{ fontSize: '2rem', letterSpacing: '2px', color: 'var(--accent-vip)', fontWeight: 'bold' }}>{successVoucher}</h2>
          </div>

          <div style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px dashed rgba(234, 179, 8, 0.5)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              ⚠️ <strong>LƯU Ý:</strong> Hãy chụp ảnh màn hình này lại để lưu mã. Nhập mã này nếu bạn bị ngắt kết nối.
            </p>
          </div>

          <button onClick={() => connectWithVoucher(successVoucher)} className="btn btn-vip w-full">
            Kết Nối Internet Ngay
          </button>
        </div>
      </div>
    );
  }

  const freePackages = config.packages.filter(p => p.type === 'free');
  const vipPackages = config.packages.filter(p => p.type === 'vip');

  return (
    <div className="app-container pb-20">
      <div className="glass-card text-center relative z-10">
        <WifiIcon />
        <h1 className="title mb-2">{config.portal.title}</h1>
        <p className="subtitle mb-6">{config.portal.subtitle}</p>

        {/* Cấu hình hiển thị tuỳ vào việc mở Modal Voucher hay Admin */}
        {showVoucherInput ? (
           <div className="mb-6">
              <h3 className="mb-4" style={{ fontSize: '1.1rem', fontWeight: '700' }}>Nhập Mã Voucher</h3>
              <input 
                type="text" 
                placeholder="Nhập mã truy cập..." 
                value={inputVoucherCode}
                onChange={e => setInputVoucherCode(e.target.value)}
                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', marginBottom: '1rem', fontSize: '1.1rem', textAlign: 'center' }}
              />
              <button className="btn btn-vip w-full mb-3" onClick={handleManualVoucherSubmit}>Xác Nhận & Kết Nối</button>
              <button className="btn btn-free w-full" onClick={() => setShowVoucherInput(false)}>Quay lại</button>
           </div>
        ) : showAdminBypass && !adminLoggedIn ? (
           <div className="mb-6">
              <h3 className="mb-4" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444' }}>Admin Login (Thu tiền mặt)</h3>
              <input 
                type="password" 
                placeholder="Mật khẩu Admin..." 
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                style={{ width: '100%', padding: '1rem', borderRadius: '8px', border: '1px solid var(--surface-border)', background: 'rgba(0,0,0,0.3)', color: 'white', marginBottom: '1rem', fontSize: '1.1rem', textAlign: 'center' }}
              />
              <button className="btn w-full mb-3" style={{ background: '#ef4444', color: 'white' }} onClick={() => setAdminLoggedIn(true)}>Đăng Nhập</button>
              <button className="btn btn-free w-full" onClick={() => setShowAdminBypass(false)}>Quay lại</button>
           </div>
        ) : (
          <>
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
              {/* Nếu Admin đã đăng nhập */}
              {adminLoggedIn ? (
                 <div style={{ border: '1px solid #ef4444', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
                    <h3 className="mb-4 text-red-500 font-bold uppercase">Cấp Voucher Thủ Công</h3>
                    <div className="flex-col gap-3">
                      {vipPackages.map(pkg => (
                        <button
                          key={'admin_' + pkg.id}
                          onClick={() => handleAdminAuth(pkg.id)}
                          className="btn w-full flex justify-between items-center mb-2"
                          style={{ background: '#ef4444', color: 'white' }}
                        >
                          <span>{pkg.name}</span>
                          <span style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: '4px' }}>Cấp mã</span>
                        </button>
                      ))}
                    </div>
                    <button className="btn btn-free w-full mt-4" onClick={() => { setAdminLoggedIn(false); setShowAdminBypass(false); }}>Thoát Admin</button>
                 </div>
              ) : (
                <>
                  {/* Nút Gói Free */}
                  {freePackages.length > 0 && (
                    <button onClick={handleFreeAuth} disabled={loading} className="btn btn-free mb-6">
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

                  {/* Nút nhập Voucher */}
                  <div className="mt-6 pt-4" style={{ borderTop: '1px solid var(--surface-border)' }}>
                     <button 
                       onClick={() => setShowVoucherInput(true)}
                       style={{ background: 'transparent', border: 'none', color: 'var(--accent-vip)', textDecoration: 'underline', fontSize: '0.9rem', cursor: 'pointer' }}
                     >
                       Đã có mã truy cập (Voucher)?
                     </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hidden Admin Button */}
      {!showAdminBypass && (
        <div 
          onClick={() => setShowAdminBypass(true)} 
          style={{ position: 'absolute', bottom: '10px', right: '10px', width: '30px', height: '30px', opacity: 0.1, cursor: 'pointer', zIndex: 100 }}
          title="Admin Login"
        >
          🔒
        </div>
      )}
    </div>
  );
}

export default App;
