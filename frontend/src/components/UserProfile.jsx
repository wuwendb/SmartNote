import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UserProfile({ token, onUpdateProfile, onBack, onPasswordChange }) {
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    phone: '',
    avatar_url: ''
  });
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('zhipuApiKey') || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
    headers: { Authorization: 'Bearer ' + token }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get('/api/me');
      setProfile({
        username: res.data.username || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        avatar_url: res.data.avatar_url || ''
      });
    } catch (err) {
      setError('无法获取个人信息');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      localStorage.setItem('zhipuApiKey', apiKey);
      const res = await axiosInstance.put('/api/me', profile);
      setMessage('保存成功！');
      if (onUpdateProfile) {
        onUpdateProfile(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.detail || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  const avatars = [
    '', // default
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Felix',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Luna',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Coco',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Jack',
    'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Max'
  ];

  return (
    <div className="max-w-3xl mx-auto w-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-8 text-white relative">
        <div className="mt-4 flex items-end space-x-6">
          <label className="relative w-24 h-24 rounded-full bg-white border-4 border-white/30 shadow-lg flex items-center justify-center overflow-hidden text-indigo-500 font-bold text-4xl shrink-0 cursor-pointer group">
             {profile.avatar_url ? (
               <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
             ) : (
               profile.username ? profile.username.charAt(0).toUpperCase() : 'U'
             )}
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
             </div>
             <input 
                type="file" 
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const res = await axiosInstance.post('/api/user/avatar', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    setProfile(prev => ({...prev, avatar_url: res.data.avatar_url}));
                  } catch (err) {
                    alert('头像上传失败');
                  }
                }}
             />
          </label>
          <div className="pb-2 flex-1">
            <h2 className="text-3xl font-black m-0">{profile.username || '用户'}</h2>
            <p className="text-indigo-100 mt-1">完善您的个人资料和联系方式</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {message && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl flex items-center font-bold text-sm"><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>{message}</div>}
        {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-center font-bold text-sm"><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">用户名</label>
              <input 
                type="text" 
                name="username" 
                value={profile.username} 
                onChange={handleChange} 
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
              />
            </div>
            
             <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">电子邮箱</label>
              <input 
                type="email" 
                name="email" 
                value={profile.email} 
                onChange={handleChange} 
                placeholder="example@email.com"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">手机号码</label>
              <input 
                type="tel" 
                name="phone" 
                value={profile.phone} 
                onChange={handleChange} 
                placeholder="您的联系电话"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
              />
            </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex justify-between">
                  <span>智谱 API Key (针对本地桌面版)</span>
                  <a href="https://open.bigmodel.cn/" target="_blank" rel="noreferrer" className="text-indigo-500 hover:text-indigo-600 font-medium text-xs font-normal underline">去官网获取 Key</a>
                </label>
                <input 
                  type="password" 
                  name="apiKey" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                  placeholder="请粘贴您的 API Key，不填将无法使用 AI 功能"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                />
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-bold text-gray-700">头像选择</label>
                
                {/* Preset Avatars */}
                <div className="flex gap-3">
                  {avatars.map((url, i) => (
                    <button 
                      type="button"
                      key={i}
                      onClick={() => setProfile(prev => ({...prev, avatar_url: url}))}
                      className={"w-12 h-12 rounded-full overflow-hidden border-2 transition-all shrink-0 " + (profile.avatar_url === url ? "border-indigo-500 ring-2 ring-indigo-200 shadow-md transform scale-110" : "border-gray-200 hover:border-indigo-300 hover:shadow-sm")}

                  >
                     {url ? <img src={url} alt="avatar" /> : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-xs">默认</div>}
                  </button>
                ))}
              </div>
              
              {/* Custom Upload */}
              <div className="mt-3">
                <div className="text-xs text-gray-500 mb-2 font-medium">或上传本地图片</div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const res = await axiosInstance.post('/api/user/avatar', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      setProfile(prev => ({...prev, avatar_url: res.data.avatar_url}));
                    } catch (err) {
                      alert('头像上传失败');
                    }
                  }}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-xl file:border-0
                    file:text-sm file:font-semibold
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100 cursor-pointer transition-colors"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100 flex justify-between items-center text-sm">
             <button 
                type="button"
                onClick={onPasswordChange}
                className="text-red-600 hover:text-red-800 font-bold flex items-center gap-1"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                修改密码
             </button>
             <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md font-bold transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {loading ? '正在保存...' : '保存更改'}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserProfile;
