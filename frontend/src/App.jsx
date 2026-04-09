import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { lazyLoadMultiple } from './utils/lazyLoad.jsx';
import { ThemeToggle } from './components/ui';

// Lazy-load route-level components for code splitting
const {
  MarkdownToolbar,
  CommentSection,
  NoteChat,
  NoteQuiz,
  UserProfile
} = lazyLoadMultiple({
  MarkdownToolbar: () => import('./components/MarkdownToolbar'),
  CommentSection: () => import('./components/CommentSection'),
  NoteChat: () => import('./components/NoteChat'),
  NoteQuiz: () => import('./components/NoteQuiz'),
  UserProfile: () => import('./components/UserProfile')
});

function App() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [communityNotes, setCommunityNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('upload'); // 'upload', 'history' or 'community', 'detail'
  const [previousViewMode, setPreviousViewMode] = useState('upload'); 
  const [selectedStyle, setSelectedStyle] = useState('课堂考点提炼');
  const [currentFileUrl, setCurrentFileUrl] = useState('');
  
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [currentTitle, setCurrentTitle] = useState('Untitled Note');
  const [currentCategory, setCurrentCategory] = useState('未分类');
  const [isEditing, setIsEditing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isNoteOwner, setIsNoteOwner] = useState(true);
  const [isPublic, setIsPublic] = useState(false);
  
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [username, setUsername] = useState('');
  const [profileData, setProfileData] = useState({});
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const[authForm, setAuthForm] = useState({ username: '', password: '', contact: '' });

  const styles = ['标准普通', '课堂考点提炼', '学术论文范式', '超精简归纳', '自定义...'];
  const [customStyleInput, setCustomStyleInput] = useState('');
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('customCategories');
      return saved ? JSON.parse(saved) : ['未分类', '工作', '学习', '生活', '灵感', '代码'];
    } catch {
      return ['未分类', '工作', '学习', '生活', '灵感', '代码'];
    }
  });
  const [historyFilterCategory, setHistoryFilterCategory] = useState('');
  const [communityFilterCategory, setCommunityFilterCategory] = useState('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');

  const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000',
  });
  
  // Add interceptor to dynamically get token
  axiosInstance.interceptors.request.use((config) => {
    const currentToken = localStorage.getItem('token');
    const zhipuKey = localStorage.getItem('zhipuApiKey');
    if (currentToken) {
      config.headers.Authorization = `Bearer ${currentToken}`;
    }
    if (zhipuKey) {
      config.headers['x-zhipu-api-key'] = zhipuKey;
    }
    return config;
  });

  useEffect(() => {
    if (token) {
      axiosInstance.get('/api/me')
        .then(res => {
          setUsername(res.data.username);
          setProfileData(res.data);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken('');
        });
      fetchHistory();
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('customCategories', JSON.stringify(customCategories));
  }, [customCategories]);

  const handleGoToHistory = () => {
    setViewMode('history');
    setSearchQuery('');
    fetchHistory();
  };

  const handleGoToCommunity = () => {
    setViewMode('community');
    setSearchQuery('');
    fetchCommunityNotes();
  };

  const handleGoToProfile = () => {
    setViewMode('profile');
    setSearchQuery('');
  };

  const loadCommunityDetail = async (id) => {
    try {
      const response = await axiosInstance.get(`/api/community/notes/${id}`);
      setResult(response.data.content);
      setSelectedStyle(response.data.style);        setCurrentCategory(response.data.category || '未分类');      setCurrentTitle(response.data.title || 'Untitled Note');
      setCurrentNoteId(response.data.id);
      setCurrentFileUrl('');
      setPreview(null);
      setPreviousViewMode('community');
      setViewMode('detail');
      setIsEditing(false);
      setIsNoteOwner(response.data.author === username);
      setIsPublic(true);
    } catch(err) {
      alert("获取笔记详情失败：" + err);
    }
  };

  const fetchHistory = async (query = '') => {
    try {
      const response = await axiosInstance.get(`/api/notes${query ? '?search='+encodeURIComponent(query) : ''}`);
      setHistory(response.data);
    } catch (err) {
      console.error('获取历史记录失败', err);
    }
  };

  const fetchCommunityNotes = async (query = '') => {
    try {
      const response = await axiosInstance.get(`/api/community/notes${query ? '?search='+encodeURIComponent(query) : ''}`);
      setCommunityNotes(response.data);
    } catch (err) {
      console.error('获取社区笔记失败', err);
    }
  };

  const togglePublicStatus = async (noteId, currentStatus) => {
    try {
      await axiosInstance.patch(`/api/notes/${noteId}/public?is_public=${!currentStatus}`);
      fetchHistory(); // Refresh statuses locally
      if (noteId === currentNoteId) setIsPublic(!currentStatus);
    } catch (err) {
      alert("分享状态更新失败");
    }
  };

  const handleGoToUpload = () => {
    setViewMode('upload');
    if (!loading) {
      setResult('');
      setPreview(null);
      setCurrentFileUrl('');
      setSelectedFiles([]);
      setCurrentTitle('Untitled Note');
      setCurrentCategory('未分类');
      setCurrentNoteId(null);
      setIsEditing(false);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        const formData = new URLSearchParams();
        formData.append('username', authForm.username);
        formData.append('password', authForm.password);
        const res = await axios.post('http://localhost:8000/api/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        localStorage.setItem('token', res.data.access_token);
        setToken(res.data.access_token);
        handleGoToUpload(); // ensure fresh upload state on login!
      } else {
        await axios.post('http://localhost:8000/api/register', authForm);
        setAuthMode('login');
        alert("注册成功，请登录");
      }
    } catch (err) {
      alert(err.response?.data?.detail || '认证失败');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUsername('');
    setResult('');
    setPreview(null);
    setSelectedFiles([]);
    setAuthForm({ username: '', password: '', contact: '' });
    setAuthMode('login');
    setViewMode('upload');
    setHistory([]);
    setCommunityNotes([]);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const oldPwd = prompt("请输入现在的密码进行验证：");
    if (!oldPwd) return;
    const newPwd = prompt("请输入新的密码：");
    if (!newPwd) return;
    try {
      const res = await axiosInstance.post('/api/user/password', { old_password: oldPwd, new_password: newPwd });
      alert(res.data.message);
      logout();
    } catch(err) {
      alert(err.response?.data?.detail || "密码修改失败");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="flex justify-center mb-8">
             <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
                 <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2 font-sans">NoteSnap AI</h1>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8 font-medium">{authMode === 'login' ? '欢迎回来，请登录' : '创建您的新账号'}</p>
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">用户名</label>
              <input type="text" required value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} className="mt-1 block w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors" placeholder="请输入用户名" />
            </div>
            {authMode === 'register' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">联系方式 (邮箱/手机)</label>
              <input type="text" required value={authForm.contact} onChange={e => setAuthForm({...authForm, contact: e.target.value})} className="mt-1 block w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors" placeholder="用于找回密码安全验证" />
            </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">密码</label>
              <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="mt-1 block w-full px-4 py-3 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors" placeholder="••••••••" />
            </div>
            {authMode === 'login' && (
              <div className="flex justify-end mt-1">
                 <button type="button" onClick={() => alert("因未开启邮箱SMTP服务，暂时无法投递重置邮件。请联系系统管理员重置密码！")} className="text-xs text-indigo-600 hover:underline">忘记密码？</button>

                        </div>
            )}
            <button type="submit" className="w-full bg-indigo-600 border border-transparent text-white rounded-xl py-3 px-4 font-bold text-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md">
              {authMode === 'login' ? '登录' : '注册'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button type="button" onClick={(e) => { e.preventDefault(); setAuthMode(authMode === 'login' ? 'register' : 'login'); }} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
              {authMode === 'login' ? '没有账号？点击注册新用户' : '已有账号？点击返回登录'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      setError('');
      setResult('');
      setCurrentFileUrl('');
      
      const firstImage = files.find(f => f.type.startsWith('image/'));
      if (firstImage) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(firstImage);
      } else {
         // keep old preview if exists
      }
    }
    // reset input value to allow selecting the same file again if needed
    e.target.value = null;
  };

  const removeSelectedFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      setError('请先选择文件 (图片, PDF 或 PPTX)！');
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    selectedFiles.forEach((file, index) => {
      formData.append('files', file); // 适配新版多文件后端
      if (index === 0) {
        formData.append('file', file); // 兼容旧版单文件后端，避免报错 422 Unprocessable Entity
      }
    });
    formData.append('style', selectedStyle === '自定义...' ? customStyleInput : selectedStyle);
    formData.append('category', currentCategory);

    try {
        const response = await axiosInstance.post('/api/process-note', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResult(response.data.note);
      setCurrentFileUrl(response.data.file_url);
      setCurrentNoteId(response.data.id);
      setCurrentTitle(response.data.title || 'Untitled Note');
      setCurrentCategory(response.data.category || '未分类');
      setIsEditing(false);
      setIsNoteOwner(true);
      setIsPublic(false);
      setViewMode('upload');
      fetchHistory();
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      const errorMsg = Array.isArray(errorDetail) ? JSON.stringify(errorDetail) : errorDetail;
      setError(errorMsg || '处理失败，请重试。' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadHistoryDetail = (item) => {
      setResult(item.content);
      setCurrentTitle(item.title || 'Untitled Note');
      setCurrentCategory(item.category || '未分类');
      setCurrentNoteId(item.id);
      setCurrentFileUrl(item.file_url);
      setPreviousViewMode('history');
      setViewMode('detail');
      setSelectedStyle(item.style);
      setIsEditing(false);
      setIsNoteOwner(true);
      setIsPublic(item.is_public || false);
  };

  const handleSave = async () => {
    try {
      if (currentNoteId) {
        await axiosInstance.put(`/api/notes/${currentNoteId}`, {title: currentTitle, content: result, category: currentCategory});
        if (currentCategory && !customCategories.includes(currentCategory)) {
            setCustomCategories([...customCategories, currentCategory]);
        }
        setIsEditing(false);
        fetchHistory(); // sync history titles if they changed
        alert('保存成功！');
      } else {
        const res = await axiosInstance.post(`/api/notes`, {title: currentTitle, content: result, category: currentCategory, is_public: false});
        setCurrentNoteId(res.data.id);
        if (currentCategory && !customCategories.includes(currentCategory)) {
            setCustomCategories([...customCategories, currentCategory]);
        }
        setIsEditing(false);
        fetchHistory();
        alert('新建笔记成功！');
      }
    } catch(err) {
      alert('保存失败！' + (err.response?.data?.detail || err.message));
    }
  };

    const handleDelete = async () => {
    if (!currentNoteId) {
      alert('未保存的笔记无法删除！');
      return;
    }
    if (!confirm('确定要删除此笔记吗？')) return;
    try {
      await axiosInstance.delete(`/api/notes/${currentNoteId}`);
      alert('删除成功！');
      setViewMode('history');
      fetchHistory();
    } catch (err) {
      alert('删除失败：' + (err.response?.data?.detail || err.message));
    }
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notesnap-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex items-center space-x-4">
             <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
                 <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             </div>
             <div>
                 <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 m-0 tracking-tight">
                    NoteSnap AI
                 </h1>
             </div>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0 items-center">
              <button 
                onClick={handleGoToProfile}
                className="text-sm text-gray-500 dark:text-gray-400 font-bold mr-4 flex items-center hover:text-indigo-600 transition-colors px-2 py-1 rounded-md hover:bg-indigo-50"
                title="个人主页"
              >
                  {profileData?.avatar_url ? (
                    <img src={profileData.avatar_url} alt="avatar" className="w-6 h-6 rounded-full mr-2 object-cover border border-gray-200 dark:border-slate-700" />
                  ) : (
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  )}
                  {profileData?.username || username}
              </button>
            <button 
              onClick={() => { setPreviousViewMode('history'); setViewMode('detail'); setIsEditing(true); setCurrentNoteId(null); setCurrentTitle('无标题笔记'); setResult(''); setCurrentCategory('默认分类'); setOriginalFile(null); }}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center ${viewMode === 'detail' && !currentNoteId ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              写新笔记
            </button>
            <button 
              onClick={handleGoToUpload}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'upload' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              提取笔记
            </button>
            <button 
              onClick={handleGoToHistory}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center ${viewMode === 'history' || (viewMode === 'detail' && previousViewMode === 'history') ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              我的笔记
            </button>
            <button 
              onClick={handleGoToCommunity}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center ${viewMode === 'community' || (viewMode === 'detail' && previousViewMode === 'community') ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-purple-600'}`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              社区广场
            </button>
            <button
              onClick={() => setViewMode('profile')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center ${viewMode === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}
            >
              主页
            </button>
            <ThemeToggle />
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-all border border-red-100 ml-2"
            >
              退出
            </button>
          </div>
        </div>

        {viewMode === 'history' && (
           <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4 md:mb-0">
                     <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                     我的笔记库
                 </h2>
                 <div className="relative w-full md:w-64">
                     <input type="text" placeholder="搜索历史笔记..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => {if(e.key === 'Enter') fetchHistory(searchQuery);}} className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm" />
                     <svg className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
               </div>
             <div className="flex flex-col md:flex-row gap-6">
                 {/* Sidebar */}
                 <div className="md:w-48 flex-shrink-0">
                     <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">按分类查看</h3>
                     <ul className="space-y-1">
                         <li>
                             <button
                                 onClick={() => setHistoryFilterCategory('')}
                                 className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${historyFilterCategory === '' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                             >
                                 全部笔记
                             </button>
                         </li>
                         {Array.from(new Set(history.map(h => h.category || '未分类'))).map(cat => (
                             <li key={cat}>
                                 <button
                                     onClick={() => setHistoryFilterCategory(cat)}
                                     className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${historyFilterCategory === cat ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                 >
                                     {cat}
                                 </button>
                             </li>
                         ))}
                     </ul>
                 </div>
                 {/* List */}
                 <div className="flex-1">
                     <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                       {(historyFilterCategory ? history.filter(h => (h.category || '未分类') === historyFilterCategory) : history).map(item => (
                 <div key={item.id} className="border border-gray-200 dark:border-slate-700 p-6 rounded-xl hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer bg-white group hover:-translate-y-1" onClick={() => loadHistoryDetail(item)}>
                    <div className="flex justify-between items-start mb-3">
                          <p className="font-bold text-gray-900 dark:text-gray-100 truncate pr-3 flex-1" title={item.title || item.filename}>{item.title || item.filename}</p>
                            <div className="flex flex-col gap-1 items-end">
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold whitespace-nowrap border border-indigo-100">{item.style}</span>
                                {item.category && item.category !== '未分类' && (
                                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold whitespace-nowrap border border-purple-100">{item.category}</span>
                                )}
                            </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-4 flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {new Date(item.created_at).toLocaleString()}
                    </p>
                    <div className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4 font-normal bg-gray-50/50 p-3 rounded-lg border border-gray-100">{item.content.replace(/[#*]/g, '')}</div>
<div className="mt-4 text-sm text-indigo-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                          <span className="flex items-center">
                            查看完整笔记 
                            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); togglePublicStatus(item.id, item.is_public); }}
                            className={`px-3 py-1 rounded-full text-xs transition-colors border ${item.is_public ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-100'}`}
                          >
                            {item.is_public ? '已公开 ✅' : '设为公开'}
                          </button>
                      </div>
                   </div>
                 ))}
                 {(historyFilterCategory ? history.filter(h => (h.category || "未分类") === historyFilterCategory) : history).length === 0 && (
                     <div className="col-span-full py-16 text-center text-gray-500 dark:text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                         <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                         <span className="font-semibold text-lg block">暂无笔记记录</span>
                         <span className="text-sm">快去提取你的第一份AI笔记吧</span>
                     </div>
                 )}
               </div>
             </div>
           </div>
          </div>
          )}

        {viewMode === 'community' && (
           <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-gray-800 flex items-center mb-4 md:mb-0">
                     <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                     社区笔记广场
                 </h2>
                 <div className="relative w-full md:w-64">
                     <input type="text" placeholder="搜索社区笔记..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => {if(e.key === 'Enter') fetchCommunityNotes(searchQuery);}} className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm" />
                     <svg className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
               </div>
             <div className="flex flex-col md:flex-row gap-6">
                 {/* Sidebar */}
                 <div className="md:w-48 flex-shrink-0">
                     <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">按分类查看</h3>
                     <ul className="space-y-1">
                         <li>
                             <button
                                 onClick={() => setCommunityFilterCategory('')}
                                 className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${communityFilterCategory === '' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                             >
                                 全部笔记
                             </button>
                         </li>
                         {['AI', '矩阵分析', '机器学习', '编程开发', '系统架构', '科技前沿', '未分类'].map(cat => (
                             <li key={cat}>
                                 <button
                                     onClick={() => setCommunityFilterCategory(cat)}
                                     className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${communityFilterCategory === cat ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                 >
                                     {cat}
                                 </button>
                             </li>
                         ))}
                     </ul>
                 </div>
                 {/* List */}
                 <div className="flex-1">
                     <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                        {(communityFilterCategory ? communityNotes.filter(h => (h.category || '未分类').toLowerCase() === communityFilterCategory.toLowerCase()) : communityNotes).map(item => (
                 <div key={item.id} onClick={() => loadCommunityDetail(item.id)} className="border border-gray-200 dark:border-slate-700 p-6 rounded-xl hover:shadow-xl hover:border-purple-300 transition-all cursor-pointer bg-white group hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-3">
                          <p className="font-bold text-gray-900 dark:text-gray-100 truncate pr-3 flex-1" title={item.title || item.filename}>{item.title || item.filename}</p>
                            <div className="flex flex-col gap-1 items-end">
                                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold whitespace-nowrap border border-indigo-100">{item.style}</span>
                                {item.category && item.category !== '未分类' && (
                                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold whitespace-nowrap border border-purple-100">{item.category}</span>
                                )}
                            </div>
                    </div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            {item.author}
                        </p>
                        <p className="text-xs text-gray-400">
                            {new Date(item.created_at).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="text-sm text-gray-600 line-clamp-3 leading-relaxed font-normal bg-gray-50/50 p-3 rounded-lg border border-gray-100">{item.content.replace(/[#*]/g, '')}</div>
                    <div className="mt-4 text-sm text-purple-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                        查看无删减原文 
                        <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                 </div>
               ))}
               {(communityFilterCategory ? communityNotes.filter(h => (h.category || "未分类").toLowerCase() === communityFilterCategory.toLowerCase()) : communityNotes).length === 0 && (
                   <div className="col-span-full py-16 text-center text-gray-500 dark:text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                       <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                       <span className="font-semibold text-lg block">社区空空如也</span>
                       <span className="text-sm">去主页将有价值的笔记设为公开吧</span>
                   </div>
               )}
             </div>
           </div>
           </div>
          </div>
        )}

        {viewMode === 'profile' && (
          <UserProfile 
            token={token} 
            onPasswordChange={handlePasswordChange} 
            onUpdateProfile={(data) => {
              setProfileData(data);
              setUsername(data.username);
            }} 
            onBack={() => setViewMode('upload')} 
          />
        )}

        {/* Upload & Preview Section */}
        {(viewMode === 'upload' || viewMode === 'detail') && (
          <div className={`grid gap-6 ${(result || preview || currentFileUrl) && viewMode === 'upload' ? 'lg:grid-cols-12' : viewMode === 'detail' ? 'lg:grid-cols-12 max-w-5xl mx-auto' : 'lg:grid-cols-1 max-w-3xl mx-auto'}`}>
            
            {/* 左侧：文件上传与预览 */}
            {viewMode === 'upload' && (
            <div className={`space-y-6 ${result || preview || currentFileUrl ? 'lg:col-span-4' : 'lg:col-span-1 border border-transparent'}`}>
                {/* Upload Panel */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition">
                    <h2 className="text-lg font-bold mb-5 text-gray-800 flex items-center">
                         <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                         上传与设置
                    </h2>
                    
                    <div className="mb-5">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">AI 提取风格</label>
                        <div className="grid grid-cols-2 gap-2">
                            {styles.map(style => (
                                <button
                                    key={style}
                                    onClick={() => setSelectedStyle(style)}
                                    className={`px-3 py-2.5 rounded-lg text-sm font-bold transition-all border ${selectedStyle === style ? 'bg-indigo-50/50 border-indigo-600 text-indigo-700 shadow-sm' : 'bg-white border-gray-200 dark:border-slate-700 text-gray-600 hover:border-indigo-300 hover:bg-indigo-50/20'}`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                        {selectedStyle === '自定义...' && (
                          <div className="mt-3">
                            <input
                              type="text"
                              value={customStyleInput}
                              onChange={(e) => setCustomStyleInput(e.target.value)}
                              placeholder="请输入您的自定义提取规则，例如：代码解析、日记等"
                              className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-100 transition-all font-medium text-sm"
                            />
                          </div>
                        )}
                    </div>

                    <div className="mb-5">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">笔记分类</label>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {customCategories.map(cat => (
                                <div key={cat} className="relative group flex items-center justify-center w-full h-full">
                                    <button
                                        onClick={() => setCurrentCategory(cat)}
                                        className={`w-full h-full px-2 py-2 rounded-lg text-xs font-bold transition-all border break-words ${currentCategory === cat ? 'bg-purple-50/50 border-purple-600 text-purple-700 shadow-[0_2px_8px_-2px_rgba(168,85,247,0.4)]' : 'bg-white border-gray-200 dark:border-slate-700 text-gray-600 hover:border-purple-300 hover:bg-purple-50/20'}`}
                                    >
                                        {cat}
                                    </button>
                                    <span 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(window.confirm(`确定要永久删除分类选项 "${cat}" 吗？（删除分类不会删除已有笔记）`)) {
                                                const newCats = customCategories.filter(c => c !== cat);
                                                if (currentCategory === cat) setCurrentCategory(newCats.length ? newCats[0] : '默认分类');
                                                setTimeout(() => setCustomCategories(newCats), 0);
                                            }
                                        }}
                                        className={`absolute -top-1 -right-1 bg-red-100 text-red-600 hover:bg-red-500 hover:text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] cursor-pointer transition-all font-bold shadow-sm ${currentCategory === cat ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                        title={`删除 ${cat}`}
                                    >
                                        ×
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={customCategoryInput} 
                                onChange={(e) => setCustomCategoryInput(e.target.value)} 
                                placeholder="输入自定义分类" 
                                className="flex-1 w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500" 
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') {
                                        e.preventDefault();
                                        const newCat = customCategoryInput.trim();
                                        if (newCat && !customCategories.includes(newCat)) {
                                            setCustomCategories([...customCategories, newCat]);
                                            setCurrentCategory(newCat);
                                        }
                                        setCustomCategoryInput('');
                                    }
                                }}
                            />
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    const newCat = customCategoryInput.trim();
                                    if (newCat && !customCategories.includes(newCat)) {
                                        setCustomCategories([...customCategories, newCat]);
                                        setCurrentCategory(newCat);
                                    }
                                    setCustomCategoryInput('');
                                }}
                                className="bg-purple-50 text-purple-600 px-3 py-2 rounded-lg text-sm font-bold border border-purple-200 hover:bg-purple-100 transition whitespace-nowrap"
                            >
                                添加
                            </button>
                        </div>
                    </div>

                    <div className="relative border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-6 hover:border-indigo-400 hover:bg-indigo-50/30 focus-within:border-indigo-500 transition-all bg-gray-50 text-center cursor-pointer group mb-5">
                        <input
                            type="file"
                            multiple
                            accept="image/*,.pdf,.pptx"
                            onChange={handleFileChange}
                            className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-4 py-4">
                            <div className="p-3.5 bg-white rounded-full shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                                <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <div className="text-gray-700">
                                <div className="space-y-1">
                                    <p className="font-bold">{selectedFiles.length > 0 ? '继续点击或拖拽添加文件' : '点击或拖拽上传，支持多选'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">支持 图片 / PDF / PPTX 合并处理</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 已选文件列表区域 (可单独删除) */}
                    {selectedFiles.length > 0 && (
                        <div className="mb-5 space-y-2 max-h-48 overflow-y-auto pr-1">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="flex justify-between items-center bg-white border border-gray-200 dark:border-slate-700 rounded-lg p-3 shadow-sm hover:border-indigo-200 transition-colors">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <div className="bg-indigo-50 p-1.5 rounded">
                                            <svg className="w-5 h-5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => removeSelectedFile(index)} 
                                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors shrink-0 z-20 relative outline-none focus:ring-2 focus:ring-red-200"
                                        title="移除文件"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <button
                        onClick={handleUpload}
                        disabled={selectedFiles.length === 0 || loading}
                        className={`w-full py-3.5 rounded-xl font-bold text-base shadow-sm transition-all flex justify-center items-center ${
                            selectedFiles.length === 0 || loading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg transform hover:-translate-y-0.5'
                        }`}
                    >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            AI 深度处理中...
                        </>
                    ) : (
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            开始智能分析
                        </div>
                    )}
                    </button>
                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-100 p-4 rounded-xl flex items-start text-red-700 shadow-sm transition-all">
                            <svg className="w-5 h-5 mr-2.5 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-sm font-medium leading-relaxed">{error}</span>
                        </div>
                    )}
                </div>

                {/* File Preview Panel */}
                {(preview || currentFileUrl) && (
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative group hidden lg:block">
                        <h2 className="text-xs font-bold mb-3 text-gray-500 dark:text-gray-400 uppercase tracking-wider">原始文档预览</h2>
                        <div className="bg-gray-50/50 rounded-xl overflow-hidden flex items-center justify-center min-h-[250px] border border-gray-200 dark:border-slate-700">
                            {(preview || (currentFileUrl && currentFileUrl.match(/\.(jpeg|jpg|gif|png)$/i))) ? (
                                <img src={preview || currentFileUrl} alt="Preview" className="max-w-full max-h-[400px] object-contain rounded-lg" />
                            ) : currentFileUrl ? (
                                <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-8 text-indigo-600 hover:bg-white rounded-xl transition border border-transparent hover:border-indigo-100 hover:shadow-sm">
                                    <svg className="w-12 h-12 mb-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    <span className="font-bold text-sm">查看完整原文件</span>
                                </a>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* 若进入沉浸模式，在此添加黑色毛玻璃背景 */}
            {isFullscreen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] transition-opacity" onClick={() => setIsFullscreen(false)}></div>
            )}

            {/* 右侧：结果区 */}
            {(result || viewMode === 'detail') && (
                <div className={`flex flex-col gap-6 ${isFullscreen ? 'fixed inset-2 md:inset-6 z-[100] transition-all bg-white rounded-2xl shadow-2xl p-0' : (viewMode === 'detail' ? 'lg:col-span-12' : 'lg:col-span-8')}`}>
                    <div className={`bg-white p-0 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden relative ${isFullscreen ? 'h-full border-none shadow-none' : ''}`}>
                    {/* Header bar for result */}
                    <div className="flex justify-between items-start bg-gray-50/80 px-8 py-5 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-start space-x-3 flex-1 min-w-0 mr-4">
                            {viewMode === 'detail' && (
                                  <button onClick={() => { setViewMode(previousViewMode); if(previousViewMode==='history') fetchHistory(searchQuery); else if(previousViewMode==='community') fetchCommunityNotes(searchQuery); }} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700 mr-2 transition-colors cursor-pointer" title="返回列表">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                            )}
                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <div className="flex-1 w-full">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={currentTitle} 
                                        onChange={e => setCurrentTitle(e.target.value)} 
                                        className="text-lg font-bold text-gray-900 dark:text-gray-100 m-0 w-full bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-indigo-500" 
                                    />
                                ) : (
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 m-0">{currentTitle}</h2>
                                )}
                                  <div className="flex flex-wrap items-center gap-1.5 mt-2 w-full">
                                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded whitespace-nowrap self-start mt-0.5">{selectedStyle}风格</span>
                                        {isEditing ? (
                                            <>
                                                {customCategories.map(cat => (
                                                    <div 
                                                        key={cat} 
                                                        onClick={() => setCurrentCategory(cat)} 
                                                        className={`group relative flex items-center px-3 py-1 rounded-full cursor-pointer border text-xs font-bold transition-all ${currentCategory === cat ? 'bg-purple-100 border-purple-300 text-purple-800 shadow-[0_2px_8px_-2px_rgba(168,85,247,0.4)]' : 'bg-white border-gray-200 dark:border-slate-700 text-gray-600 hover:bg-gray-50'}`}
                                                    >
                                                        <span>{cat}</span>
                                                        <span 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if(window.confirm(`确定要永久删除分类选项 "${cat}" 吗？（删除分类不会删除已有笔记）`)) {
                                                                    const newCats = customCategories.filter(c => c !== cat);
                                                                    if (currentCategory === cat) setCurrentCategory(newCats.length ? newCats[0] : '默认分类');
                                                                    setTimeout(() => setCustomCategories(newCats), 0);
                                                                }
                                                            }}
                                                            className="ml-1 w-3.5 h-3.5 flex items-center justify-center rounded-full text-red-500 hover:bg-red-100 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                            title={`删除 ${cat}`}
                                                        >
                                                            ×
                                                        </span>
                                                    </div>
                                                ))}
                                                <input 
                                                    type="text" 
                                                    placeholder="+ 新建分类 (回车)" 
                                                    onKeyDown={(e) => {
                                                        if(e.key === 'Enter') {
                                                            const val = e.target.value.trim();
                                                            if(val && !customCategories.includes(val)) {
                                                                setCustomCategories([...customCategories, val]);
                                                                setCurrentCategory(val);
                                                                e.target.value = '';
                                                            }
                                                        }
                                                    }}
                                                    className="w-28 text-xs px-3 py-1 text-gray-600 bg-gray-50 border border-dashed border-gray-300 hover:border-purple-300 focus:border-purple-400 focus:bg-white focus:outline-none rounded-full transition-all placeholder:text-[10px] placeholder:leading-tight"
                                                />
                                            </>
                                        ) : (
                                          <span className="px-3 py-1 bg-purple-50 text-purple-700 text-xs font-bold rounded-full border border-purple-100 self-start mt-0.5">{currentCategory}</span>
                                      )}
                                  </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                            {currentNoteId && isNoteOwner && (
                                <button 
                                  onClick={async () => {
                                    try {
                                      await togglePublicStatus(currentNoteId, isPublic);
                                    } catch (e) {}
                                  }}
                                  className={`px-4 py-2 border rounded-lg font-bold transition-all text-sm flex items-center shadow-sm ${isPublic ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-100'}`}
                                >
                                  {isPublic ? '已公开 👍' : '设为公开'}
                                </button>
                            )}
                            {(isNoteOwner || !currentNoteId) && (
                                <button
                                    onClick={() => {
                                        if (isEditing) {
                                            handleSave();
                                        } else {
                                            setIsEditing(true);
                                        }
                                    }}
                                    className="bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg font-bold transition-all text-sm flex items-center shadow-sm"
                                >
                                    {isEditing ? '保存' : '编辑'}
                                </button>
                            )}
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className={`px-4 py-2 border rounded-lg font-bold transition-all text-sm flex items-center shadow-sm ${isFullscreen ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                {isFullscreen ? (
                                    <>
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                        还原
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                        沉浸
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleExport}
                                className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-100 px-4 py-2 rounded-lg font-bold transition-all text-sm flex items-center shadow-sm hover:shadow"
                            >
                                <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                导出 MD
                            </button>
                            {currentNoteId && isNoteOwner && (
                                <button
                                    onClick={handleDelete}
                                    className="bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg font-bold transition-all text-sm flex items-center shadow-sm ml-2"
                                >
                                    <svg className="w-4 h-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    删除
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Markdown Content */}
                    <div className={`p-8 overflow-y-auto custom-scrollbar bg-white ${isFullscreen ? 'flex-1 h-full' : 'max-h-[80vh]'}`}>
                        {isEditing ? (
                            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-stretch ${isFullscreen ? 'h-full' : 'h-full min-h-[600px]'}`}>
                                {/* Editor Side */}
                                <div className={`flex flex-col rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden bg-slate-900 ${isFullscreen ? 'h-full' : 'h-[600px]'}`}>
                                    <MarkdownToolbar result={result} setResult={setResult} />
                                    <textarea 
                                        id="markdown-editor"
                                        value={result} 
                                        onChange={e => setResult(e.target.value)}
                                        className="w-full flex-1 p-6 bg-slate-900 text-gray-50 focus:outline-none focus:ring-inset focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm leading-relaxed"
                                        spellCheck="false"
                                        placeholder="在这里使用 Markdown 编写你的笔记..."
                                    />
                                </div>
                                {/* Preview Side */}
                                <div className={`flex flex-col rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden bg-white ${isFullscreen ? 'h-full' : 'h-[600px]'}`}>
                                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        实时预览
                                    </div>
                                    <div className="p-6 overflow-y-auto flex-1 prose prose-indigo max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-a:text-indigo-600 prose-img:rounded-xl bg-white w-full">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm, remarkMath]} 
                                            rehypePlugins={[rehypeKatex]}
                                        >
                                            {(result || '*无预览内容...*').replace(/\\\((.*?)\\\)/g, '$$$1$$').replace(/\\\[(.*?)\\\]/gs, '$$$$$1$$$$')}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-indigo max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-a:text-indigo-600 prose-img:rounded-xl">
                                <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]} 
                                rehypePlugins={[rehypeKatex]}
                                >
                                {(result || '').replace(/\\\((.*?)\\\)/g, '$$$1$$').replace(/\\\[(.*?)\\\]/gs, '$$$$$1$$$$')}
                                </ReactMarkdown>
                            </div>
                        )}
                    </div>
                </div>
                
                {!isEditing && currentNoteId && (
                    <>
                        <div className="mt-8">
                            <NoteQuiz noteId={currentNoteId} token={token} />
                        </div>
                        {previousViewMode === 'community' && (
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 mt-8">
                                <CommentSection noteId={currentNoteId} token={token} currentUsername={username} />
                            </div>
                        )}
                        <NoteChat noteId={currentNoteId} token={token} />
                    </>
                )}
            </div>
            )}
        </div>
        )}
      </div>
    </div>
  );
}

export default App;
