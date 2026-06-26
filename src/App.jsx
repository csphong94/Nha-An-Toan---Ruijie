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
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center border border-gray-700">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">{status}</h2>
          <p className="text-gray-400 text-sm">Vui lòng chờ trong giây lát...</p>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
      </div>
    );
  }

  // Tách gói Free và VIP
  const freePackages = config.packages.filter(p => p.type === 'free');
  const vipPackages = config.packages.filter(p => p.type === 'vip');

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>

      <div className="bg-gray-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md text-center z-10 border border-gray-700">
        <WifiIcon />
        <h1 className="text-3xl font-extrabold mb-2 bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
          {config.portal.title}
        </h1>
        <p className="text-gray-400 mb-8 font-medium">{config.portal.subtitle}</p>

        {/* Thông tin thiết bị */}
        <div className="bg-gray-900/50 rounded-xl p-4 mb-8 text-sm text-gray-400 border border-gray-700 shadow-inner text-left">
          <div className="flex justify-between mb-2">
            <span>Thiết bị của bạn:</span>
            <span className="font-mono text-gray-300">{realMac}</span>
          </div>
          <div className="flex justify-between">
            <span>Trạng thái:</span>
            <span className="text-orange-400 font-semibold flex items-center">
              <span className="w-2 h-2 rounded-full bg-orange-400 mr-2 animate-pulse"></span>
              Chưa kết nối
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* Nút Gói Free */}
          {freePackages.length > 0 && (
            <button
              onClick={handleFreeAuth}
              disabled={loading}
              className="w-full relative group overflow-hidden bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 border border-gray-600 hover:border-gray-500 shadow-lg"
            >
              <div className="flex items-center justify-center">
                <span className="text-lg">{freePackages[0].name}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 font-normal">Quảng cáo / Giới hạn tốc độ</p>
            </button>
          )}

          {/* Các Gói VIP */}
          {vipPackages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Nâng cấp VIP (Không giới hạn)</h3>
              <div className="grid grid-cols-1 gap-3">
                {vipPackages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => handleVipAuth(pkg.id)}
                    className="w-full flex items-center justify-between bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg transform transition hover:scale-105"
                  >
                    <div className="flex items-center">
                      <RocketIcon />
                      <div className="text-left">
                        <div className="text-md">{pkg.name}</div>
                        <div className="text-xs text-orange-200">{pkg.durationDays} Ngày sử dụng</div>
                      </div>
                    </div>
                    <div className="text-lg bg-black/20 px-3 py-1 rounded-lg">
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
