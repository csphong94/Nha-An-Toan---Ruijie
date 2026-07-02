import { useState, useEffect } from 'react';
import './index.css';

// Sleek SVG Icons for a premium look
const VouchersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const PackagesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const PayOSIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const PortalIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const RuijieIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Active Tab
  const [activeTab, setActiveTab] = useState('vouchers');

  // Webhook states
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState('');

  useEffect(() => {
    if (token) {
      loadConfig();
    }
  }, [token]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        setToken('');
        localStorage.removeItem('admin_token');
        return;
      }
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      setError('Lỗi tải cấu hình hệ thống');
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        localStorage.setItem('admin_token', data.token);
      } else {
        setError(data.error || 'Mật khẩu sai, vui lòng thử lại');
      }
    } catch (err) {
      setError('Không thể kết nối tới máy chủ');
    }
    setLoading(false);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      if (res.ok) {
        alert('Đã lưu cấu hình thành công!');
      } else {
        alert('Lỗi lưu cấu hình, vui lòng kiểm tra lại');
      }
    } catch (err) {
      alert('Không thể kết nối tới máy chủ');
    }
    setLoading(false);
  };

  const handleRegisterWebhook = async () => {
    setWebhookLoading(true);
    setWebhookStatus('Đang gửi yêu cầu đăng ký Webhook...');
    try {
      const res = await fetch('/api/admin/payos/register-webhook', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setWebhookStatus(`✅ Đăng ký Webhook thành công!\nĐịa chỉ: ${data.webhookUrl}`);
      } else {
        setWebhookStatus(`❌ Lỗi: ${data.error || 'Không xác định'}`);
      }
    } catch (err) {
      setWebhookStatus('❌ Lỗi kết nối máy chủ khi đăng ký Webhook');
    }
    setWebhookLoading(false);
  };

  const handlePackageChange = (index, field, value) => {
    const newPackages = [...config.packages];
    newPackages[index] = { ...newPackages[index], [field]: value };
    setConfig({ ...config, packages: newPackages });
  };

  const handleAddPackage = () => {
    setConfig({
      ...config,
      packages: [
        ...config.packages,
        {
          id: 'pkg_' + Date.now(),
          name: 'Gói VIP Mới',
          type: 'vip',
          durationDays: 1,
          price: 5000,
          ruijieProfileId: '',
          ruijieUserGroupId: ''
        }
      ]
    });
  };

  const handleRemovePackage = (index) => {
    const newPackages = [...config.packages];
    newPackages.splice(index, 1);
    setConfig({ ...config, packages: newPackages });
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#080B11] text-white flex items-center justify-center p-4 relative overflow-hidden">
        {/* Abstract Gradient Background Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />

        <form onSubmit={handleLogin} className="backdrop-blur-xl bg-slate-900/40 p-8 rounded-3xl w-full max-w-md shadow-2xl border border-white/5 relative z-10 transition-all duration-300">
          <div className="flex justify-center mb-6">
             <div className="w-20 h-20 bg-gradient-to-tr from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
               </svg>
             </div>
          </div>
          
          <h2 className="text-3xl font-extrabold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">Vali WiFi Admin</h2>
          <p className="text-center text-slate-400 text-sm mb-8">Hệ thống trang chào & cấp phát mạng tự động</p>
          
          {error && <p className="text-red-400 text-sm mb-6 text-center bg-red-500/10 border border-red-500/20 p-3 rounded-xl">{error}</p>}
          
          <div className="space-y-4 mb-6">
            <input
              type="password"
              placeholder="Nhập mật khẩu quản trị..."
              className="w-full px-5 py-4 rounded-xl bg-slate-950/60 text-white border border-white/10 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none text-center text-xl tracking-widest transition-all"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button disabled={loading} className="w-full bg-gradient-to-r from-orange-500 to-amber-600 p-4 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>ĐĂNG NHẬP HỆ THỐNG</>
            )}
          </button>
        </form>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-[#080B11] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          <span className="text-slate-400 text-sm">Đang tải dữ liệu...</span>
        </div>
      </div>
    );
  }

  const vouchers = config.vouchers || [];
  
  // Calculate Quick Stats
  const revenue = vouchers
    .filter(v => v.method !== 'free')
    .reduce((sum, v) => {
      const pkg = config.packages.find(p => p.id === v.packageId);
      return sum + (pkg ? pkg.price : 0);
    }, 0);

  return (
    <div className="min-h-screen bg-[#080B11] text-white flex flex-col md:flex-row relative">
      {/* Glow effects */}
      <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[30%] h-[30%] bg-orange-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Sidebar */}
      <div className="w-full md:w-72 bg-slate-950/60 backdrop-blur-xl border-r border-white/5 flex flex-col z-10">
         <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg shadow-orange-500/10">
               ⚡
            </div>
            <div>
               <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-200">Vali Admin</h1>
               <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">Wifi Billing Portal</span>
            </div>
         </div>
         
         <nav className="flex-1 p-4 space-y-1.5">
            <button 
               onClick={() => setActiveTab('vouchers')}
               className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3.5 transition-all ${activeTab === 'vouchers' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
            >
               <VouchersIcon />
               <span>Khách hàng & Voucher</span>
            </button>
            <button 
               onClick={() => setActiveTab('packages')}
               className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3.5 transition-all ${activeTab === 'packages' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
            >
               <PackagesIcon />
               <span>Quản lý Gói cước</span>
            </button>
            <button 
               onClick={() => setActiveTab('payos')}
               className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3.5 transition-all ${activeTab === 'payos' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
            >
               <PayOSIcon />
               <span>Cấu hình PayOS</span>
            </button>
            <button 
               onClick={() => setActiveTab('portal')}
               className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3.5 transition-all ${activeTab === 'portal' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
            >
               <PortalIcon />
               <span>Giao diện Trang chào</span>
            </button>
            <button 
               onClick={() => setActiveTab('ruijie')}
               className={`w-full text-left px-4 py-3.5 rounded-xl flex items-center gap-3.5 transition-all ${activeTab === 'ruijie' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 font-bold' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
            >
               <RuijieIcon />
               <span>Cấu hình Ruijie API</span>
            </button>
         </nav>
         
         <div className="p-4 border-t border-white/5">
            <button 
               onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }}
               className="w-full bg-slate-900/60 border border-white/5 p-3 rounded-xl font-bold hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all flex items-center justify-center gap-2"
            >
               <LogoutIcon />
               <span>Đăng xuất</span>
            </button>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen z-10 flex flex-col">
         <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col">
            
            {/* Header / Page Title with Glow Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
               <div>
                  <span className="text-[11px] font-bold text-orange-500 uppercase tracking-widest">Quản trị hệ thống</span>
                  <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400 mt-1">
                     {activeTab === 'vouchers' && 'Khách hàng & Voucher'}
                     {activeTab === 'packages' && 'Quản lý Gói Mạng'}
                     {activeTab === 'payos' && 'Cấu hình cổng PayOS'}
                     {activeTab === 'portal' && 'Thiết kế Trang chào'}
                     {activeTab === 'ruijie' && 'Cấu hình Ruijie API'}
                  </h2>
               </div>
               
               {activeTab !== 'vouchers' && (
                  <button onClick={handleSave} disabled={loading} className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-amber-600 px-6 py-3 rounded-xl font-bold hover:brightness-110 active:scale-[0.98] transition-all shadow-lg shadow-orange-500/15 flex items-center justify-center gap-2">
                     {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                     ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                          </svg>
                          Lưu thay đổi
                        </>
                     )}
                  </button>
               )}
            </div>

            {/* Dashboard Quick Stats Grid (Only on vouchers page to keep layout clean) */}
            {activeTab === 'vouchers' && (
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                  <div className="backdrop-blur-md bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex items-center gap-5 relative overflow-hidden">
                     <div className="absolute top-0 left-0 h-full w-[4px] bg-orange-500" />
                     <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center text-xl">👥</div>
                     <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Đã cấp phát</p>
                        <p className="text-3xl font-black text-white mt-1">{vouchers.length} <span className="text-xs text-slate-500 font-normal">mã</span></p>
                     </div>
                  </div>
                  <div className="backdrop-blur-md bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex items-center gap-5 relative overflow-hidden">
                     <div className="absolute top-0 left-0 h-full w-[4px] bg-green-500" />
                     <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center text-xl">💰</div>
                     <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Doanh thu ước tính</p>
                        <p className="text-3xl font-black text-green-400 mt-1">{revenue.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">đ</span></p>
                     </div>
                  </div>
                  <div className="backdrop-blur-md bg-slate-900/40 border border-white/5 p-6 rounded-2xl flex items-center gap-5 relative overflow-hidden">
                     <div className="absolute top-0 left-0 h-full w-[4px] bg-blue-500" />
                     <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center text-xl">📦</div>
                     <div>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Gói cước hoạt động</p>
                        <p className="text-3xl font-black text-white mt-1">{(config.packages || []).length} <span className="text-xs text-slate-500 font-normal">gói</span></p>
                     </div>
                  </div>
               </div>
            )}

            {/* Main Content Card */}
            <div className="backdrop-blur-md bg-slate-900/30 border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl flex-1 flex flex-col">
               
               {/* TAB: VOUCHERS */}
               {activeTab === 'vouchers' && (
                  <div className="flex-1 flex flex-col">
                     <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950/20">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="border-b border-white/5 bg-slate-950/40 text-slate-400">
                                 <th className="p-4 text-xs font-bold uppercase tracking-wider">Khách hàng</th>
                                 <th className="p-4 text-xs font-bold uppercase tracking-wider">Số điện thoại</th>
                                 <th className="p-4 text-xs font-bold uppercase tracking-wider">Địa chỉ MAC</th>
                                 <th className="p-4 text-xs font-bold uppercase tracking-wider">Gói cước</th>
                                 <th className="p-4 text-xs font-bold uppercase tracking-wider">Mã Voucher</th>
                                 <th className="p-4 text-xs font-bold uppercase tracking-wider">Ngày cấp</th>
                                 <th className="p-4 text-xs font-bold uppercase tracking-wider">Cổng thanh toán</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-white/5">
                              {vouchers.length === 0 ? (
                                 <tr>
                                    <td colSpan="7" className="text-center py-12 text-slate-500 font-medium">Chưa phát sinh lượt truy cập nào</td>
                                 </tr>
                              ) : (
                                 [...vouchers].reverse().map(v => (
                                    <tr key={v.id} className="hover:bg-white/5 transition-colors">
                                       <td className="p-4 font-bold text-white">{v.customerName}</td>
                                       <td className="p-4 text-slate-300 font-mono text-sm">{v.customerPhone}</td>
                                       <td className="p-4 font-mono text-slate-400 text-xs">{v.mac}</td>
                                       <td className="p-4">
                                          <span className="bg-orange-500/10 text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full text-xs font-semibold">{v.packageName}</span>
                                       </td>
                                       <td className="p-4">
                                          <span className="bg-slate-950 border border-white/5 px-2.5 py-1 rounded font-mono text-green-400 font-bold tracking-widest text-sm">{v.voucherCode}</span>
                                       </td>
                                       <td className="p-4 text-slate-400 text-xs">{new Date(v.createdAt).toLocaleString('vi-VN')}</td>
                                       <td className="p-4">
                                          {v.method === 'payos_webhook' || v.method === 'payos_direct' ? (
                                             <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">VietQR</span>
                                          ) : v.method === 'payos_mock' ? (
                                             <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Mock QR</span>
                                          ) : (
                                             <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Admin</span>
                                          )}
                                       </td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               )}

               {/* TAB: PACKAGES */}
               {activeTab === 'packages' && (
                  <div className="space-y-6">
                     <div className="flex justify-between items-center bg-slate-950/20 p-4 rounded-2xl border border-white/5">
                        <div>
                           <p className="font-bold text-white">Quản lý các Gói truy cập</p>
                           <p className="text-xs text-slate-400">Các gói sẽ hiển thị cho khách hàng chọn tại màn hình chào.</p>
                        </div>
                        <button type="button" onClick={handleAddPackage} className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-green-500/15">
                           <span>➕</span> Thêm gói mới
                        </button>
                     </div>
                     
                     <div className="grid grid-cols-1 gap-6">
                        {config.packages.map((pkg, idx) => (
                           <div key={pkg.id} className="bg-slate-950/40 p-6 rounded-2xl border border-white/5 relative group hover:border-slate-700 transition-all">
                              <button type="button" onClick={() => handleRemovePackage(idx)} className="absolute top-4 right-4 text-red-500 hover:text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold" title="Xóa gói này">
                                 🗑️ Xóa gói
                              </button>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div>
                                    <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Tên gói hiển thị</label>
                                    <input type="text" value={pkg.name} onChange={e => handlePackageChange(idx, 'name', e.target.value)} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none text-sm transition-all" placeholder="Gói VIP 1 Ngày" />
                                 </div>
                                 <div>
                                    <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Loại gói cước</label>
                                    <select value={pkg.type} onChange={e => handlePackageChange(idx, 'type', e.target.value)} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none text-sm transition-all">
                                       <option value="free">Miễn phí (Yêu cầu thông tin khách hàng)</option>
                                       <option value="vip">Trả phí (Chuyển khoản VietQR)</option>
                                    </select>
                                 </div>
                                 <div>
                                    <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Giá tiền (VNĐ)</label>
                                    <input type="number" value={pkg.price} onChange={e => handlePackageChange(idx, 'price', parseInt(e.target.value) || 0)} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none text-sm transition-all font-mono" placeholder="5000" />
                                 </div>
                                 <div>
                                    <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Thời hạn sử dụng (Ngày)</label>
                                    <input type="number" value={pkg.durationDays} onChange={e => handlePackageChange(idx, 'durationDays', parseInt(e.target.value) || 1)} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none text-sm transition-all font-mono" placeholder="1" />
                                 </div>
                                 <div>
                                    <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Ruijie Profile ID</label>
                                    <input type="text" value={pkg.ruijieProfileId} onChange={e => handlePackageChange(idx, 'ruijieProfileId', e.target.value)} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none font-mono text-xs text-orange-300" placeholder="Chỉ áp dụng với gói Trả phí" />
                                 </div>
                                 <div>
                                    <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Ruijie User Group ID</label>
                                    <input type="text" value={pkg.ruijieUserGroupId} onChange={e => handlePackageChange(idx, 'ruijieUserGroupId', e.target.value)} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none font-mono text-xs text-orange-300" placeholder="Chỉ áp dụng với gói Trả phí" />
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* TAB: PAYOS */}
               {activeTab === 'payos' && (
                  <div className="space-y-6">
                     <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-2xl flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <div>
                           <p className="font-bold text-yellow-400 text-sm">Cảnh báo quan trọng</p>
                           <p className="text-slate-300 text-xs mt-1">Khi tắt **Chế độ Giả lập**, hệ thống sẽ kết nối với tài khoản ngân hàng của bạn thật qua PayOS. Hãy chắc chắn rằng bạn đã điền đúng 3 khoá bảo mật phía dưới trước khi tắt.</p>
                        </div>
                     </div>
                     
                     <div className="flex items-center justify-between bg-slate-950/40 p-6 rounded-2xl border border-white/5">
                        <div>
                           <p className="font-bold text-white text-lg">Chế độ Giả lập (Mock Mode)</p>
                           <p className="text-xs text-slate-400 mt-1">Hỗ trợ thử nghiệm quét mã VietQR và kiểm thử hệ thống mà không tốn tiền thật.</p>
                        </div>
                        <div>
                           <label className="relative inline-flex items-center cursor-pointer select-none">
                              <input 
                                 type="checkbox" 
                                 checked={config.payos?.useMock ?? true} 
                                 onChange={e => setConfig({...config, payos: {...(config.payos || {}), useMock: e.target.checked}})}
                                 className="sr-only peer" 
                              />
                              <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
                           </label>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                           <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Client ID</label>
                           <input type="text" value={config.payos?.clientId || ''} onChange={e => setConfig({...config, payos: {...(config.payos || {}), clientId: e.target.value}})} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none font-mono text-sm transition-all" placeholder="Nhập Client ID từ PayOS" />
                        </div>
                        <div className="md:col-span-2">
                           <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">API Key</label>
                           <input type="text" value={config.payos?.apiKey || ''} onChange={e => setConfig({...config, payos: {...(config.payos || {}), apiKey: e.target.value}})} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none font-mono text-sm transition-all" placeholder="Nhập API Key từ PayOS" />
                        </div>
                        <div className="md:col-span-2">
                           <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Checksum Key</label>
                           <input type="password" value={config.payos?.checksumKey || ''} onChange={e => setConfig({...config, payos: {...(config.payos || {}), checksumKey: e.target.value}})} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none font-mono text-sm transition-all" placeholder="Nhập Checksum Key từ PayOS" />
                        </div>
                        
                        <div className="md:col-span-2 pt-6 border-t border-white/5">
                           <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-orange-500/5 p-6 rounded-2xl border border-orange-500/10">
                              <div>
                                 <p className="font-bold text-orange-400">Đăng ký Webhook Tự Động</p>
                                 <p className="text-xs text-slate-400 mt-1">Bấm nút để tự động kết nối và xác nhận URL Webhook với tài khoản PayOS của bạn.</p>
                                 {webhookStatus && <div className="mt-3 text-xs font-mono text-orange-400 whitespace-pre-wrap bg-slate-950/80 p-3 rounded-xl border border-white/5">{webhookStatus}</div>}
                              </div>
                              <button 
                                 type="button"
                                 disabled={webhookLoading}
                                 onClick={handleRegisterWebhook}
                                 className="w-full sm:w-auto bg-green-600 hover:bg-green-500 disabled:bg-slate-800 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
                              >
                                 {webhookLoading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                                 ) : (
                                    <><span>🔗</span> Đăng ký tự động</>
                                 )}
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               )}

               {/* TAB: PORTAL */}
               {activeTab === 'portal' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="md:col-span-2">
                        <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Tiêu đề chính trang chào</label>
                        <input type="text" value={config.portal.title} onChange={e => setConfig({...config, portal: {...config.portal, title: e.target.value}})} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none text-lg font-bold transition-all" />
                     </div>
                     <div className="md:col-span-2">
                        <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Lời chào & Hướng dẫn (Subtitle)</label>
                        <textarea value={config.portal.subtitle} onChange={e => setConfig({...config, portal: {...config.portal, subtitle: e.target.value}})} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none h-32 transition-all text-sm leading-relaxed" />
                     </div>
                  </div>
               )}

               {/* TAB: RUIJIE */}
               {activeTab === 'ruijie' && (
                  <div className="space-y-6">
                     <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-start gap-3">
                        <span className="text-xl">💡</span>
                        <p className="text-slate-300 text-xs mt-0.5">Các thông số này được sử dụng để gọi dịch vụ Ruijie Cloud cấp Voucher tự động. Bạn không cần sửa đổi nếu hệ thống đang hoạt động ổn định.</p>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">App ID</label>
                           <input type="text" value={config.ruijie.appId} onChange={e => setConfig({...config, ruijie: {...config.ruijie, appId: e.target.value}})} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none font-mono text-sm transition-all" />
                        </div>
                        <div>
                           <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">App Secret</label>
                           <input type="text" value={config.ruijie.appSecret} onChange={e => setConfig({...config, ruijie: {...config.ruijie, appSecret: e.target.value}})} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none font-mono text-sm transition-all" />
                        </div>
                        <div>
                           <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Token Static (Static Token)</label>
                           <input type="text" value={config.ruijie.tokenStatic} onChange={e => setConfig({...config, ruijie: {...config.ruijie, tokenStatic: e.target.value}})} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none font-mono text-sm transition-all" />
                        </div>
                        <div>
                           <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Network Group ID (Dự án Ruijie)</label>
                           <input type="text" value={config.ruijie.groupId} onChange={e => setConfig({...config, ruijie: {...config.ruijie, groupId: e.target.value}})} className="w-full p-3 rounded-xl bg-slate-950 border border-white/10 focus:border-orange-500 outline-none font-mono text-sm transition-all" />
                        </div>
                     </div>
                  </div>
               )}

            </div>
         </div>
      </div>
    </div>
  );
}
