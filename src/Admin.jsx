import { useState, useEffect } from 'react';
import './index.css';

export default function Admin() {
  const [token, setToken] = useState(localStorage.getItem('admin_token') || '');
  const [password, setPassword] = useState('');
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    e.preventDefault();
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
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-2xl w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-6 text-center text-orange-500">Admin Login</h2>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <input
            type="password"
            placeholder="Mật khẩu"
            className="w-full p-3 rounded bg-gray-700 text-white mb-4 border border-gray-600 focus:border-orange-500 outline-none"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button disabled={loading} className="w-full bg-orange-600 p-3 rounded font-bold hover:bg-orange-500">
            {loading ? 'Đang tải...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    );
  }

  if (!config) return <div className="min-h-screen bg-gray-900 text-white p-8">Đang tải cấu hình...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
          <h1 className="text-2xl font-bold text-orange-500">Admin Dashboard</h1>
          <button 
            onClick={() => { setToken(''); localStorage.removeItem('admin_token'); }}
            className="text-sm bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
          >
            Đăng xuất
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Cấu hình Ruijie */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-blue-400">Cấu hình Ruijie API</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">App ID</label>
                <input type="text" value={config.ruijie.appId} onChange={e => setConfig({...config, ruijie: {...config.ruijie, appId: e.target.value}})} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">App Secret</label>
                <input type="text" value={config.ruijie.appSecret} onChange={e => setConfig({...config, ruijie: {...config.ruijie, appSecret: e.target.value}})} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Token Static</label>
                <input type="text" value={config.ruijie.tokenStatic} onChange={e => setConfig({...config, ruijie: {...config.ruijie, tokenStatic: e.target.value}})} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Network Group ID (Dự án)</label>
                <input type="text" value={config.ruijie.groupId} onChange={e => setConfig({...config, ruijie: {...config.ruijie, groupId: e.target.value}})} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
              </div>
            </div>
          </section>

          {/* Giao diện Portal */}
          <section>
            <h2 className="text-xl font-bold mb-4 text-pink-400">Giao diện Trang Chào</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Tiêu đề chính</label>
                <input type="text" value={config.portal.title} onChange={e => setConfig({...config, portal: {...config.portal, title: e.target.value}})} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Lời chào (Subtitle)</label>
                <input type="text" value={config.portal.subtitle} onChange={e => setConfig({...config, portal: {...config.portal, subtitle: e.target.value}})} className="w-full p-2 rounded bg-gray-700 border border-gray-600" />
              </div>
            </div>
          </section>

          {/* Gói cước */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-green-400">Quản lý Gói Mạng (Packages)</h2>
              <button type="button" onClick={handleAddPackage} className="bg-green-600 px-4 py-2 rounded text-sm hover:bg-green-500">+ Thêm gói mới</button>
            </div>
            
            <div className="space-y-4">
              {config.packages.map((pkg, idx) => (
                <div key={pkg.id} className="bg-gray-700 p-4 rounded-xl border border-gray-600 relative">
                  <button type="button" onClick={() => handleRemovePackage(idx)} className="absolute top-2 right-2 text-red-400 hover:text-red-300">Xóa</button>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <label className="block text-xs text-gray-400">Tên gói hiển thị</label>
                      <input type="text" value={pkg.name} onChange={e => handlePackageChange(idx, 'name', e.target.value)} className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400">Loại (free / vip)</label>
                      <select value={pkg.type} onChange={e => handlePackageChange(idx, 'type', e.target.value)} className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm">
                        <option value="free">Miễn phí (Free)</option>
                        <option value="vip">Thu phí MoMo (VIP)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400">Giá tiền (VNĐ)</label>
                      <input type="number" value={pkg.price} onChange={e => handlePackageChange(idx, 'price', parseInt(e.target.value) || 0)} className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400">Ruijie Profile ID</label>
                      <input type="text" value={pkg.ruijieProfileId} onChange={e => handlePackageChange(idx, 'ruijieProfileId', e.target.value)} className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400">Ruijie User Group ID</label>
                      <input type="text" value={pkg.ruijieUserGroupId} onChange={e => handlePackageChange(idx, 'ruijieUserGroupId', e.target.value)} className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-sm" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button type="submit" disabled={loading} className="w-full bg-orange-600 py-4 rounded-xl font-bold text-lg hover:bg-orange-500 shadow-lg mt-8">
            {loading ? 'Đang lưu...' : 'LƯU CẤU HÌNH'}
          </button>
        </form>
      </div>
    </div>
  );
}
