import { useState, useEffect } from 'react';
import './index.css';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Active Tab
  const [activeTab, setActiveTab] = useState('vouchers');

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
      setError('Lỗi tải cấu hình');
    }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
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
        setError(data.error);
      }
    } catch (err) {
      setError('Lỗi kết nối');
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
        alert('Lỗi khi lưu cấu hình');
      }
    } catch (err) {
      alert('Lỗi kết nối');
    }
    setLoading(false);
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
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-700">
          <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center border-2 border-orange-500">
               <span className="text-3xl">🔒</span>
             </div>
          </div>
          <h2 className="text-2xl font-bold mb-6 text-center text-orange-500">Vali Admin</h2>
          {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-500/10 p-2 rounded">{error}</p>}
          <input
            type="password"
            placeholder="Nhập mật khẩu..."
            className="w-full p-4 rounded-xl bg-gray-900 text-white mb-6 border border-gray-700 focus:border-orange-500 outline-none text-center text-lg tracking-widest"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button disabled={loading} className="w-full bg-orange-600 p-4 rounded-xl font-bold hover:bg-orange-500 transition-colors shadow-lg shadow-orange-900/50">
            {loading ? 'ĐANG TẢI...' : 'ĐĂNG NHẬP'}
          </button>
        </form>
      </div>
    );
  }

  if (!config) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div></div>;

  const vouchers = config.vouchers || [];

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
         <div className="p-6 border-b border-gray-700">
            <h1 className="text-2xl font-bold text-orange-500 flex items-center gap-2">
               <span>⚡</span> Vali Admin
            </h1>
         </div>
         <nav className="flex-1 p-4 space-y-2">
            <button 
               onClick={() => setActiveTab('vouchers')}
               className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'vouchers' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            >
               <span>👥</span> Khách hàng & Voucher
            </button>
            <button 
               onClick={() => setActiveTab('packages')}
               className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'packages' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            >
               <span>📦</span> Quản lý Gói cước
            </button>
            <button 
               onClick={() => setActiveTab('portal')}
               className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'portal' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            >
               <span>🎨</span> Giao diện Trang Chào
            </button>
            <button 
               onClick={() => setActiveTab('ruijie')}
               className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeTab === 'ruijie' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
            >
               <span>⚙️</span> Cấu hình Ruijie API
            </button>
         </nav>
         <div className="p-4 border-t border-gray-700">
            <button 
               onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }}
               className="w-full bg-gray-700 p-3 rounded-lg font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
            >
               <span>🚪</span> Đăng xuất
            </button>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 overflow-y-auto" style={{ maxHeight: '100vh' }}>
         <div className="max-w-5xl mx-auto">
            
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-8">
               <h2 className="text-3xl font-bold text-white">
                  {activeTab === 'vouchers' && 'Khách hàng & Voucher'}
                  {activeTab === 'packages' && 'Quản lý Gói Mạng'}
                  {activeTab === 'portal' && 'Giao diện Trang Chào'}
                  {activeTab === 'ruijie' && 'Cấu hình Ruijie API'}
               </h2>
               {activeTab !== 'vouchers' && (
                  <button onClick={handleSave} disabled={loading} className="bg-orange-600 px-6 py-2 rounded-lg font-bold hover:bg-orange-500 shadow-lg flex items-center gap-2">
                     {loading ? 'Đang lưu...' : (
                        <><span>💾</span> Lưu Thay Đổi</>
                     )}
                  </button>
               )}
            </div>

            {/* Content Area */}
            <div className="bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-700">
               
               {/* TAB: VOUCHERS */}
               {activeTab === 'vouchers' && (
                  <div>
                     <div className="flex justify-between mb-6">
                        <div className="bg-gray-700 p-4 rounded-xl text-center w-full max-w-xs">
                           <p className="text-gray-400 text-sm">Tổng số Voucher đã cấp</p>
                           <p className="text-3xl font-bold text-orange-400">{vouchers.length}</p>
                        </div>
                     </div>

                     <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                           <thead>
                              <tr className="border-b border-gray-700">
                                 <th className="p-4 text-gray-400 font-medium">Khách hàng</th>
                                 <th className="p-4 text-gray-400 font-medium">SĐT</th>
                                 <th className="p-4 text-gray-400 font-medium">Gói Mạng</th>
                                 <th className="p-4 text-gray-400 font-medium">Mã Voucher</th>
                                 <th className="p-4 text-gray-400 font-medium">Thời gian</th>
                                 <th className="p-4 text-gray-400 font-medium">Nguồn</th>
                              </tr>
                           </thead>
                           <tbody>
                              {vouchers.length === 0 ? (
                                 <tr>
                                    <td colSpan="6" className="text-center p-8 text-gray-500">Chưa có khách hàng nào</td>
                                 </tr>
                              ) : (
                                 [...vouchers].reverse().map(v => (
                                    <tr key={v.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                                       <td className="p-4 font-bold text-white">{v.customerName}</td>
                                       <td className="p-4 text-gray-300">{v.customerPhone}</td>
                                       <td className="p-4">
                                          <span className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm">{v.packageName}</span>
                                       </td>
                                       <td className="p-4 font-mono text-green-400 font-bold tracking-widest">{v.voucherCode}</td>
                                       <td className="p-4 text-gray-400 text-sm">{new Date(v.createdAt).toLocaleString('vi-VN')}</td>
                                       <td className="p-4">
                                          {v.method === 'momo' ? (
                                             <span className="bg-pink-500/20 text-pink-400 px-2 py-1 rounded text-xs">MoMo</span>
                                          ) : (
                                             <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs">Admin</span>
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
                  <div>
                     <div className="flex justify-end mb-4">
                        <button type="button" onClick={handleAddPackage} className="bg-green-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-500 flex items-center gap-2">
                           <span>➕</span> Thêm gói mới
                        </button>
                     </div>
                     
                     <div className="space-y-6">
                        {config.packages.map((pkg, idx) => (
                           <div key={pkg.id} className="bg-gray-900 p-6 rounded-2xl border border-gray-700 relative group">
                              <button type="button" onClick={() => handleRemovePackage(idx)} className="absolute top-4 right-4 text-red-500 hover:text-red-400 bg-red-500/10 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="Xóa gói này">
                                 🗑️ Xóa
                              </button>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div className="md:col-span-1">
                                    <label className="block text-sm text-gray-400 mb-2">Tên gói hiển thị</label>
                                    <input type="text" value={pkg.name} onChange={e => handlePackageChange(idx, 'name', e.target.value)} className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 focus:border-orange-500 outline-none" />
                                 </div>
                                 <div>
                                    <label className="block text-sm text-gray-400 mb-2">Loại gói</label>
                                    <select value={pkg.type} onChange={e => handlePackageChange(idx, 'type', e.target.value)} className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 focus:border-orange-500 outline-none">
                                       <option value="free">Miễn phí (Free)</option>
                                       <option value="vip">Thu phí MoMo (VIP)</option>
                                    </select>
                                 </div>
                                 <div>
                                    <label className="block text-sm text-gray-400 mb-2">Giá tiền (VNĐ)</label>
                                    <input type="number" value={pkg.price} onChange={e => handlePackageChange(idx, 'price', parseInt(e.target.value) || 0)} className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 focus:border-orange-500 outline-none" />
                                 </div>
                                 <div className="md:col-span-1">
                                    <label className="block text-sm text-gray-400 mb-2">Thời hạn (Ngày)</label>
                                    <input type="number" value={pkg.durationDays} onChange={e => handlePackageChange(idx, 'durationDays', parseInt(e.target.value) || 1)} className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 focus:border-orange-500 outline-none" />
                                 </div>
                                 <div>
                                    <label className="block text-sm text-gray-400 mb-2">Ruijie Profile ID</label>
                                    <input type="text" value={pkg.ruijieProfileId} onChange={e => handlePackageChange(idx, 'ruijieProfileId', e.target.value)} className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 focus:border-orange-500 outline-none font-mono text-xs text-orange-300" placeholder="Chỉ dành cho gói VIP" />
                                 </div>
                                 <div>
                                    <label className="block text-sm text-gray-400 mb-2">Ruijie User Group ID</label>
                                    <input type="text" value={pkg.ruijieUserGroupId} onChange={e => handlePackageChange(idx, 'ruijieUserGroupId', e.target.value)} className="w-full p-3 rounded-lg bg-gray-800 border border-gray-600 focus:border-orange-500 outline-none font-mono text-xs text-orange-300" placeholder="Chỉ dành cho gói VIP" />
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               )}

               {/* TAB: PORTAL */}
               {activeTab === 'portal' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm text-gray-400 mb-2">Tiêu đề chính trang chào</label>
                        <input type="text" value={config.portal.title} onChange={e => setConfig({...config, portal: {...config.portal, title: e.target.value}})} className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none text-xl font-bold" />
                     </div>
                     <div>
                        <label className="block text-sm text-gray-400 mb-2">Lời chào (Subtitle)</label>
                        <textarea value={config.portal.subtitle} onChange={e => setConfig({...config, portal: {...config.portal, subtitle: e.target.value}})} className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none h-24" />
                     </div>
                  </div>
               )}

               {/* TAB: RUIJIE */}
               {activeTab === 'ruijie' && (
                  <div>
                     <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl mb-6">
                        <p className="text-blue-400 text-sm">💡 Các thông số này được dùng để gọi API đến Ruijie Cloud cấp mã Voucher tự động. Bạn không cần điền nếu hệ thống đã tự động chạy tốt (hệ thống có tham số mặc định ẩn bên dưới).</p>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                           <label className="block text-sm text-gray-400 mb-2">App ID</label>
                           <input type="text" value={config.ruijie.appId} onChange={e => setConfig({...config, ruijie: {...config.ruijie, appId: e.target.value}})} className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none font-mono" />
                        </div>
                        <div>
                           <label className="block text-sm text-gray-400 mb-2">App Secret</label>
                           <input type="text" value={config.ruijie.appSecret} onChange={e => setConfig({...config, ruijie: {...config.ruijie, appSecret: e.target.value}})} className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none font-mono" />
                        </div>
                        <div>
                           <label className="block text-sm text-gray-400 mb-2">Token Static</label>
                           <input type="text" value={config.ruijie.tokenStatic} onChange={e => setConfig({...config, ruijie: {...config.ruijie, tokenStatic: e.target.value}})} className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none font-mono" />
                        </div>
                        <div>
                           <label className="block text-sm text-gray-400 mb-2">Network Group ID (Dự án)</label>
                           <input type="text" value={config.ruijie.groupId} onChange={e => setConfig({...config, ruijie: {...config.ruijie, groupId: e.target.value}})} className="w-full p-3 rounded-lg bg-gray-900 border border-gray-700 focus:border-orange-500 outline-none font-mono" />
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
