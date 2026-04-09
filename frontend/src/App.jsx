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
  const [selectedStyle, setSelectedStyle] = useState('è¯¾å èç¹æç¼');
  const [currentFileUrl, setCurrentFileUrl] = useState('');
  
  const [currentNoteId, setCurrentNoteId] = useState(null);
  const [currentTitle, setCurrentTitle] = useState('Untitled Note');
  const [currentCategory, setCurrentCategory] = useState('æªåç±»');
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

  const styles = ['æ åæ®é', 'è¯¾å èç¹æç¼', 'å­¦æ¯è®ºæèå¼', 'è¶ç²¾ç®å½çº³', 'èªå®ä¹...'];
  const [customStyleInput, setCustomStyleInput] = useState('');
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('customCategories');
      return saved ? JSON.parse(saved) : ['æªåç±»', 'å·¥ä½', 'å­¦ä¹ ', 'çæ´»', 'çµæ', 'ä»£ç '];
    } catch {
      return ['æªåç±»', 'å·¥ä½', 'å­¦ä¹ ', 'çæ´»', 'çµæ', 'ä»£ç '];
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
      setSelectedStyle(response.data.style);        setCurrentCategory(response.data.category || 'æªåç±»');      setCurrentTitle(response.data.title || 'Untitled Note');
      setCurrentNoteId(response.data.id);
      setCurrentFileUrl('');
      setPreview(null);
      setPreviousViewMode('community');
      setViewMode('detail');
      setIsEditing(false);
      setIsNoteOwner(response.data.author === username);
      setIsPublic(true);
    } catch(err) {
      alert("è·åç¬è®°è¯¦æå¤±è´¥ï¼" + err);
    }
  };

  const fetchHistory = async (query = '') => {
    try {
      const response = await axiosInstance.get(`/api/notes${query ? '?search='+encodeURIComponent(query) : ''}`);
      setHistory(response.data);
    } catch (err) {
      console.error('è·ååå²è®°å½å¤±è´¥', err);
    }
  };

  const fetchCommunityNotes = async (query = '') => {
    try {
      const response = await axiosInstance.get(`/api/community/notes${query ? '?search='+encodeURIComponent(query) : ''}`);
      setCommunityNotes(response.data);
    } catch (err) {
      console.error('è·åç¤¾åºç¬è®°å¤±è´¥', err);
    }
  };

  const togglePublicStatus = async (noteId, currentStatus) => {
    try {
      await axiosInstance.patch(`/api/notes/${noteId}/public?is_public=${!currentStatus}`);
      fetchHistory(); // Refresh statuses locally
      if (noteId === currentNoteId) setIsPublic(!currentStatus);
    } catch (err) {
      alert("åäº«ç¶ææ´æ°å¤±è´¥");
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
      setCurrentCategory('æªåç±»');
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
        alert("æ³¨åæåï¼è¯·ç»å½");
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'è®¤è¯å¤±è´¥');
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
    const oldPwd = prompt("è¯·è¾å¥ç°å¨çå¯ç è¿è¡éªè¯ï¼");
    if (!oldPwd) return;
    const newPwd = prompt("è¯·è¾å¥æ°çå¯ç ï¼");
    if (!newPwd) return;
    try {
      const res = await axiosInstance.post('/api/user/password', { old_password: oldPwd, new_password: newPwd });
      alert(res.data.message);
      logout();
    } catch(err) {
      alert(err.response?.data?.detail || "å¯ç ä¿®æ¹å¤±è´¥");
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100 dark:border-slate-700">
          <div className="flex justify-center mb-8">
             <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
                 <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
             </div>
          </div>
          <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2 font-sans">NoteSnap AI</h1>
          <p className="text-center text-gray-500 dark:text-gray-400 mb-8 font-medium">{authMode === 'login' ? 'æ¬¢è¿åæ¥ï¼è¯·ç»å½' : 'åå»ºæ¨çæ°è´¦å·'}</p>
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">ç¨æ·å</label>
              <input type="text" required value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} className="mt-1 block w-full px-4 py-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors" placeholder="è¯·è¾å¥ç¨æ·å" />
            </div>
            {authMode === 'register' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">èç³»æ¹å¼ (é®ç®±/ææº)</label>
              <input type="text" required value={authForm.contact} onChange={e => setAuthForm({...authForm, contact: e.target.value})} className="mt-1 block w-full px-4 py-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors" placeholder="ç¨äºæ¾åå¯ç å®å¨éªè¯" />
            </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">å¯ç </label>
              <input type="password" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} className="mt-1 block w-full px-4 py-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors" placeholder="â¢â¢â¢â¢â¢â¢â¢â¢" />
            </div>
            {authMode === 'login' && (
              <div className="flex justify-end mt-1">
                 <button type="button" onClick={() => alert("å æªå¼å¯é®ç®±SMTPæå¡ï¼ææ¶æ æ³æééç½®é®ä»¶ãè¯·èç³»ç³»ç»ç®¡çåéç½®å¯ç ï¼")} className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline">å¿è®°å¯ç ï¼</button>

                        </div>
            )}
            <button type="submit" className="w-full bg-indigo-600 border border-transparent text-white rounded-xl py-3 px-4 font-bold text-lg hover:bg-indigo-100 dark:bg-indigo-900/50 dark:hover:bg-indigo-900/30-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md">
              {authMode === 'login' ? 'ç»å½' : 'æ³¨å'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button type="button" onClick={(e) => { e.preventDefault(); setAuthMode(authMode === 'login' ? 'register' : 'login'); }} className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">
              {authMode === 'login' ? 'æ²¡æè´¦å·ï¼ç¹å»æ³¨åæ°ç¨æ·' : 'å·²æè´¦å·ï¼ç¹å»è¿åç»å½'}
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
      setError('è¯·åéæ©æä»¶ (å¾ç, PDF æ PPTX)ï¼');
      return;
    }

    setLoading(true);
    setError('');
    
    const formData = new FormData();
    selectedFiles.forEach((file, index) => {
      formData.append('files', file); // ééæ°çå¤æä»¶åç«¯
      if (index === 0) {
        formData.append('file', file); // å¼å®¹æ§çåæä»¶åç«¯ï¼é¿åæ¥é 422 Unprocessable Entity
      }
    });
    formData.append('style', selectedStyle === 'èªå®ä¹...' ? customStyleInput : selectedStyle);
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
      setCurrentCategory(response.data.category || 'æªåç±»');
      setIsEditing(false);
      setIsNoteOwner(true);
      setIsPublic(false);
      setViewMode('upload');
      fetchHistory();
    } catch (err) {
      const errorDetail = err.response?.data?.detail;
      const errorMsg = Array.isArray(errorDetail) ? JSON.stringify(errorDetail) : errorDetail;
      setError(errorMsg || 'å¤çå¤±è´¥ï¼è¯·éè¯ã' + err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadHistoryDetail = (item) => {
      setResult(item.content);
      setCurrentTitle(item.title || 'Untitled Note');
      setCurrentCategory(item.category || 'æªåç±»');
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
        alert('ä¿å­æåï¼');
      } else {
        const res = await axiosInstance.post(`/api/notes`, {title: currentTitle, content: result, category: currentCategory, is_public: false});
        setCurrentNoteId(res.data.id);
        if (currentCategory && !customCategories.includes(currentCategory)) {
            setCustomCategories([...customCategories, currentCategory]);
        }
        setIsEditing(false);
        fetchHistory();
        alert('æ°å»ºç¬è®°æåï¼');
      }
    } catch(err) {
      alert('ä¿å­å¤±è´¥ï¼' + (err.response?.data?.detail || err.message));
    }
  };

    const handleDelete = async () => {
    if (!currentNoteId) {
      alert('æªä¿å­çç¬è®°æ æ³å é¤ï¼');
      return;
    }
    if (!confirm('ç¡®å®è¦å é¤æ­¤ç¬è®°åï¼')) return;
    try {
      await axiosInstance.delete(`/api/notes/${currentNoteId}`);
      alert('å é¤æåï¼');
      setViewMode('history');
      fetchHistory();
    } catch (err) {
      alert('å é¤å¤±è´¥ï¼' + (err.response?.data?.detail || err.message));
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
                className="text-sm text-gray-500 dark:text-gray-400 font-bold mr-4 flex items-center hover:text-indigo-700 dark:hover:text-indigo-300-600 dark:text-indigo-400 transition-colors px-2 py-1 rounded-md hover:bg-indigo-100 dark:bg-indigo-900/50"
                title="ä¸ªäººä¸»é¡µ"
              >
                  {profileData?.avatar_url ? (
                    <img src={profileData.avatar_url} alt="avatar" className="w-6 h-6 rounded-full mr-2 object-cover border border-gray-200 dark:border-slate-700" />
                  ) : (
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  )}
                  {profileData?.username || username}
              </button>
            <button 
              onClick={() => { setPreviousViewMode('history'); setViewMode('detail'); setIsEditing(true); setCurrentNoteId(null); setCurrentTitle('æ æ é¢ç¬è®°'); setResult(''); setCurrentCategory('é»è®¤åç±»'); setOriginalFile(null); }}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center ${viewMode === 'detail' && !currentNoteId ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 dark:bg-indigo-900/20 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:hover:bg-indigo-900/30-100 dark:bg-indigo-900/50'}`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              åæ°ç¬è®°
            </button>
            <button 
              onClick={handleGoToUpload}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${viewMode === 'upload' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-slate-600 dark:bg-gray-700'}`}
            >
              æåç¬è®°
            </button>
            <button 
              onClick={handleGoToHistory}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center ${viewMode === 'history' || (viewMode === 'detail' && previousViewMode === 'history') ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:bg-slate-600 dark:bg-gray-700'}`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              æçç¬è®°
            </button>
            <button 
              onClick={handleGoToCommunity}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center ${viewMode === 'community' || (viewMode === 'detail' && previousViewMode === 'community') ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-50 dark:bg-purple-900/20 dark:bg-purple-900/20 hover:text-purple-600'}`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              ç¤¾åºå¹¿åº
            </button>
            <button
              onClick={() => setViewMode('profile')}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center ${viewMode === 'profile' ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-md' : 'bg-gray-100 dark:bg-slate-700 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:bg-blue-900/20 dark:bg-blue-900/20 hover:text-blue-600'}`}
            >
              ä¸»é¡µ
            </button>
            <ThemeToggle />
            <button
              onClick={logout}
              className="px-4 py-2 rounded-lg font-bold text-sm bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:bg-red-900/50 transition-all border border-red-100 dark:border-red-900/30 ml-2"
            >
              éåº
            </button>
          </div>
        </div>

        {viewMode === 'history' && (
           <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center mb-4 md:mb-0">
                     <svg className="w-5 h-5 mr-2 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                     æçç¬è®°åº
                 </h2>
                 <div className="relative w-full md:w-64">
                     <input type="text" placeholder="æç´¢åå²ç¬è®°..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => {if(e.key === 'Enter') fetchHistory(searchQuery);}} className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm" />
                     <svg className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
               </div>
             <div className="flex flex-col md:flex-row gap-6">
                 {/* Sidebar */}
                 <div className="md:w-48 flex-shrink-0">
                     <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">æåç±»æ¥ç</h3>
                     <ul className="space-y-1">
                         <li>
                             <button
                                 onClick={() => setHistoryFilterCategory('')}
                                 className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${historyFilterCategory === '' ? 'bg-indigo-100 dark:bg-indigo-900/50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-slate-700 dark:bg-gray-700'}`}
                             >
                                 å¨é¨ç¬è®°
                             </button>
                         </li>
                         {Array.from(new Set(history.map(h => h.category || 'æªåç±»'))).map(cat => (
                             <li key={cat}>
                                 <button
                                     onClick={() => setHistoryFilterCategory(cat)}
                                     className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${historyFilterCategory === cat ? 'bg-indigo-100 dark:bg-indigo-900/50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-slate-700 dark:bg-gray-700'}`}
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
                       {(historyFilterCategory ? history.filter(h => (h.category || 'æªåç±»') === historyFilterCategory) : history).map(item => (
                 <div key={item.id} className="border border-gray-200 dark:border-slate-700 p-6 rounded-xl hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer bg-white dark:bg-slate-800 group hover:-translate-y-1" onClick={() => loadHistoryDetail(item)}>
                    <div className="flex justify-between items-start mb-3">
                          <p className="font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 truncate pr-3 flex-1" title={item.title || item.filename}>{item.title || item.filename}</p>
                            <div className="flex flex-col gap-1 items-end">
                                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-semibold whitespace-nowrap border border-indigo-100 dark:border-indigo-900/30">{item.style}</span>
                                {item.category && item.category !== 'æªåç±»' && (
                                    <span className="text-[10px] bg-purple-50 dark:bg-purple-900/20 dark:bg-purple-900/20 text-purple-700 px-2 py-0.5 rounded font-semibold whitespace-nowrap border border-purple-100">{item.category}</span>
                                )}
                            </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-4 flex items-center">
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {new Date(item.created_at).toLocaleString()}
                    </p>
                    <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed mb-4 font-normal bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700">{item.content.replace(/[#*]/g, '')}</div>
<div className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                          <span className="flex items-center">
                            æ¥çå®æ´ç¬è®° 
                            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                          </span>
                          <button 
                            onClick={(e) => { e.stopPropagation(); togglePublicStatus(item.id, item.is_public); }}
                            className={`px-3 py-1 rounded-full text-xs transition-colors border ${item.is_public ? 'bg-green-50 dark:bg-green-900/20 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:bg-slate-700 dark:bg-gray-700'}`}
                          >
                            {item.is_public ? 'å·²å¬å¼ â' : 'è®¾ä¸ºå¬å¼'}
                          </button>
                      </div>
                   </div>
                 ))}
                 {(historyFilterCategory ? history.filter(h => (h.category || "æªåç±»") === historyFilterCategory) : history).length === 0 && (
                     <div className="col-span-full py-16 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-600">
                         <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
                         <span className="font-semibold text-lg block">ææ ç¬è®°è®°å½</span>
                         <span className="text-sm">å¿«å»æåä½ çç¬¬ä¸ä»½AIç¬è®°å§</span>
                     </div>
                 )}
               </div>
             </div>
           </div>
          </div>
          )}

        {viewMode === 'community' && (
           <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
               <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                 <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center mb-4 md:mb-0">
                     <svg className="w-5 h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                     ç¤¾åºç¬è®°å¹¿åº
                 </h2>
                 <div className="relative w-full md:w-64">
                     <input type="text" placeholder="æç´¢ç¤¾åºç¬è®°..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => {if(e.key === 'Enter') fetchCommunityNotes(searchQuery);}} className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-sm" />
                     <svg className="w-4 h-4 absolute left-3.5 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                 </div>
               </div>
             <div className="flex flex-col md:flex-row gap-6">
                 {/* Sidebar */}
                 <div className="md:w-48 flex-shrink-0">
                     <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">æåç±»æ¥ç</h3>
                     <ul className="space-y-1">
                         <li>
                             <button
                                 onClick={() => setCommunityFilterCategory('')}
                                 className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${communityFilterCategory === '' ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-slate-700 dark:bg-gray-700'}`}
                             >
                                 å¨é¨ç¬è®°
                             </button>
                         </li>
                         {['AI', 'ç©éµåæ', 'æºå¨å­¦ä¹ ', 'ç¼ç¨å¼å', 'ç³»ç»æ¶æ', 'ç§æåæ²¿', 'æªåç±»'].map(cat => (
                             <li key={cat}>
                                 <button
                                     onClick={() => setCommunityFilterCategory(cat)}
                                     className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${communityFilterCategory === cat ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-slate-700 dark:bg-gray-700'}`}
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
                        {(communityFilterCategory ? communityNotes.filter(h => (h.category || 'æªåç±»').toLowerCase() === communityFilterCategory.toLowerCase()) : communityNotes).map(item => (
                 <div key={item.id} onClick={() => loadCommunityDetail(item.id)} className="border border-gray-200 dark:border-slate-700 p-6 rounded-xl hover:shadow-xl hover:border-purple-300 transition-all cursor-pointer bg-white dark:bg-slate-800 group hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-3">
                          <p className="font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 truncate pr-3 flex-1" title={item.title || item.filename}>{item.title || item.filename}</p>
                            <div className="flex flex-col gap-1 items-end">
                                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-2 py-0.5 rounded font-semibold whitespace-nowrap border border-indigo-100 dark:border-indigo-900/30">{item.style}</span>
                                {item.category && item.category !== 'æªåç±»' && (
                                    <span className="text-[10px] bg-purple-50 dark:bg-purple-900/20 dark:bg-purple-900/20 text-purple-700 px-2 py-0.5 rounded font-semibold whitespace-nowrap border border-purple-100">{item.category}</span>
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
                    <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed font-normal bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700">{item.content.replace(/[#*]/g, '')}</div>
                    <div className="mt-4 text-sm text-purple-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                        æ¥çæ å ååæ 
                        <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </div>
                 </div>
               ))}
               {(communityFilterCategory ? communityNotes.filter(h => (h.category || "æªåç±»").toLowerCase() === communityFilterCategory.toLowerCase()) : communityNotes).length === 0 && (
                   <div className="col-span-full py-16 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-600">
                       <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                       <span className="font-semibold text-lg block">ç¤¾åºç©ºç©ºå¦ä¹</span>
                       <span className="text-sm">å»ä¸»é¡µå°æä»·å¼çç¬è®°è®¾ä¸ºå¬å¼å§</span>
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
            
            {/* å·¦ä¾§ï¼æä»¶ä¸ä¼ ä¸é¢è§ */}
            {viewMode === 'upload' && (
            <div className={`space-y-6 ${result || preview || currentFileUrl ? 'lg:col-span-4' : 'lg:col-span-1 border border-transparent'}`}>
                {/* Upload Panel */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition">
                    <h2 className="text-lg font-bold mb-5 text-gray-800 dark:text-gray-100 flex items-center">
                         <svg className="w-5 h-5 mr-2 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                         ä¸ä¼ ä¸è®¾ç½®
                    </h2>
                    
                    <div className="mb-5">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">AI æåé£æ ¼</label>
                        <div className="grid grid-cols-2 gap-2">
                            {styles.map(style => (
                                <button
                                    key={style}
                                    onClick={() => setSelectedStyle(style)}
                                    className={`px-3 py-2.5 rounded-lg text-sm font-bold transition-all border ${selectedStyle === style ? 'bg-indigo-50 dark:bg-indigo-900/20 dark:bg-indigo-900/20/50 border-indigo-600 text-indigo-700 dark:text-indigo-400 shadow-sm' : 'bg-white border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300 hover:bg-indigo-100 dark:bg-indigo-900/50/20'}`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                        {selectedStyle === 'èªå®ä¹...' && (
                          <div className="mt-3">
                            <input
                              type="text"
                              value={customStyleInput}
                              onChange={(e) => setCustomStyleInput(e.target.value)}
                              placeholder="è¯·è¾å¥æ¨çèªå®ä¹æåè§åï¼ä¾å¦ï¼ä»£ç è§£æãæ¥è®°ç­"
                              className="w-full px-4 py-2 border-2 border-indigo-200 rounded-lg focus:border-indigo-500 focus:ring focus:ring-indigo-100 transition-all font-medium text-sm"
                            />
                          </div>
                        )}
                    </div>

                    <div className="mb-5">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">ç¬è®°åç±»</label>
                        <div className="grid grid-cols-3 gap-2 mb-3">
                            {customCategories.map(cat => (
                                <div key={cat} className="relative group flex items-center justify-center w-full h-full">
                                    <button
                                        onClick={() => setCurrentCategory(cat)}
                                        className={`w-full h-full px-2 py-2 rounded-lg text-xs font-bold transition-all border break-words ${currentCategory === cat ? 'bg-purple-50 dark:bg-purple-900/20 dark:bg-purple-900/20/50 border-purple-600 text-purple-700 shadow-[0_2px_8px_-2px_rgba(168,85,247,0.4)]' : 'bg-white border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-purple-300 hover:bg-purple-50 dark:bg-purple-900/20 dark:bg-purple-900/20/20'}`}
                                    >
                                        {cat}
                                    </button>
                                    <span 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if(window.confirm(`ç¡®å®è¦æ°¸ä¹å é¤åç±»éé¡¹ "${cat}" åï¼ï¼å é¤åç±»ä¸ä¼å é¤å·²æç¬è®°ï¼`)) {
                                                const newCats = customCategories.filter(c => c !== cat);
                                                if (currentCategory === cat) setCurrentCategory(newCats.length ? newCats[0] : 'é»è®¤åç±»');
                                                setTimeout(() => setCustomCategories(newCats), 0);
                                            }
                                        }}
                                        className={`absolute -top-1 -right-1 bg-red-100 dark:bg-red-900/50 text-red-600 hover:bg-red-50 dark:bg-red-900/200 hover:text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] cursor-pointer transition-all font-bold shadow-sm ${currentCategory === cat ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                        title={`å é¤ ${cat}`}
                                    >
                                        Ã
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={customCategoryInput} 
                                onChange={(e) => setCustomCategoryInput(e.target.value)} 
                                placeholder="è¾å¥èªå®ä¹åç±»" 
                                className="flex-1 w-full p-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:border-purple-500" 
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
                                className="bg-purple-50 dark:bg-purple-900/20 dark:bg-purple-900/20 text-purple-600 px-3 py-2 rounded-lg text-sm font-bold border border-purple-200 hover:bg-purple-100 dark:bg-purple-900/50 transition whitespace-nowrap"
                            >
                                æ·»å 
                            </button>
                        </div>
                    </div>

                    <div className="relative border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-6 hover:border-indigo-400 hover:bg-indigo-100 dark:bg-indigo-900/50/30 focus-within:border-indigo-500 transition-all bg-gray-50 dark:bg-slate-900 text-center cursor-pointer group mb-5">
                        <input
                            type="file"
                            multiple
                            accept="image/*,.pdf,.pptx"
                            onChange={handleFileChange}
                            className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-4 py-4">
                            <div className="p-3.5 bg-white rounded-full shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                                <svg className="w-7 h-7 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <div className="text-gray-700 dark:text-gray-200">
                                <div className="space-y-1">
                                    <p className="font-bold">{selectedFiles.length > 0 ? 'ç»§ç»­ç¹å»æææ½æ·»å æä»¶' : 'ç¹å»æææ½ä¸ä¼ ï¼æ¯æå¤é'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">æ¯æ å¾ç / PDF / PPTX åå¹¶å¤ç</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* å·²éæä»¶åè¡¨åºå (å¯åç¬å é¤) */}
                    {selectedFiles.length > 0 && (
                        <div className="mb-5 space-y-2 max-h-48 overflow-y-auto pr-1">
                            {selectedFiles.map((file, index) => (
                                <div key={index} className="flex justify-between items-center bg-white border border-gray-200 dark:border-slate-700 rounded-lg p-3 shadow-sm hover:border-indigo-200 transition-colors">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 dark:bg-indigo-900/20 p-1.5 rounded">
                                            <svg className="w-5 h-5 text-indigo-500 dark:text-indigo-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{file.name}</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => removeSelectedFile(index)} 
                                        className="text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 dark:bg-red-900/20 transition-colors shrink-0 z-20 relative outline-none focus:ring-2 focus:ring-red-200"
                                        title="ç§»é¤æä»¶"
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
                                ? 'bg-gray-100 dark:bg-slate-700 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg transform hover:-translate-y-0.5'
                        }`}
                    >
                    {loading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            AI æ·±åº¦å¤çä¸­...
                        </>
                    ) : (
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            å¼å§æºè½åæ
                        </div>
                    )}
                    </button>
                    {error && (
                        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-xl flex items-start text-red-700 shadow-sm transition-all">
                            <svg className="w-5 h-5 mr-2.5 shrink-0 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-sm font-medium leading-relaxed">{error}</span>
                        </div>
                    )}
                </div>

                {/* File Preview Panel */}
                {(preview || currentFileUrl) && (
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative group hidden lg:block">
                        <h2 className="text-xs font-bold mb-3 text-gray-500 dark:text-gray-400 uppercase tracking-wider">åå§ææ¡£é¢è§</h2>
                        <div className="bg-gray-50 dark:bg-slate-900/50 rounded-xl overflow-hidden flex items-center justify-center min-h-[250px] border border-gray-200 dark:border-slate-700">
                            {(preview || (currentFileUrl && currentFileUrl.match(/\.(jpeg|jpg|gif|png)$/i))) ? (
                                <img src={preview || currentFileUrl} alt="Preview" className="max-w-full max-h-[400px] object-contain rounded-lg" />
                            ) : currentFileUrl ? (
                                <a href={currentFileUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center p-8 text-indigo-600 dark:text-indigo-400 hover:bg-white rounded-xl transition border border-transparent hover:border-indigo-100 dark:border-indigo-900/30 hover:shadow-sm">
                                    <svg className="w-12 h-12 mb-3 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    <span className="font-bold text-sm">æ¥çå®æ´åæä»¶</span>
                                </a>
                            ) : null}
                        </div>
                    </div>
                )}
            </div>
            )}

            {/* è¥è¿å¥æ²æµ¸æ¨¡å¼ï¼å¨æ­¤æ·»å é»è²æ¯ç»çèæ¯ */}
            {isFullscreen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[90] transition-opacity" onClick={() => setIsFullscreen(false)}></div>
            )}

            {/* å³ä¾§ï¼ç»æåº */}
            {(result || viewMode === 'detail') && (
                <div className={`flex flex-col gap-6 ${isFullscreen ? 'fixed inset-2 md:inset-6 z-[100] transition-all bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-0' : (viewMode === 'detail' ? 'lg:col-span-12' : 'lg:col-span-8')}`}>
                    <div className={`bg-white dark:bg-slate-800 p-0 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden relative ${isFullscreen ? 'h-full border-none shadow-none' : ''}`}>
                    {/* Header bar for result */}
                    <div className="flex justify-between items-start bg-gray-50 dark:bg-slate-900/80 px-8 py-5 border-b border-gray-200 dark:border-slate-700">
                        <div className="flex items-start space-x-3 flex-1 min-w-0 mr-4">
                            {viewMode === 'detail' && (
                                  <button onClick={() => { setViewMode(previousViewMode); if(previousViewMode==='history') fetchHistory(searchQuery); else if(previousViewMode==='community') fetchCommunityNotes(searchQuery); }} className="p-2 bg-gray-200 dark:bg-slate-600 dark:bg-gray-700 hover:bg-gray-300 rounded-lg text-gray-700 dark:text-gray-200 mr-2 transition-colors cursor-pointer" title="è¿ååè¡¨">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                            )}
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 dark:bg-indigo-900/50 rounded-lg text-indigo-700 dark:text-indigo-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <div className="flex-1 w-full">
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={currentTitle} 
                                        onChange={e => setCurrentTitle(e.target.value)} 
                                        className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 m-0 w-full bg-white border border-gray-300 dark:border-slate-600 rounded px-2 py-1 focus:outline-none focus:border-indigo-500" 
                                    />
                                ) : (
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 dark:text-gray-100 m-0">{currentTitle}</h2>
                                )}
                                  <div className="flex flex-wrap items-center gap-1.5 mt-2 w-full">
                                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 text-xs font-bold rounded whitespace-nowrap self-start mt-0.5">{selectedStyle}é£æ ¼</span>
                                        {isEditing ? (
                                            <>
                                                {customCategories.map(cat => (
                                                    <div 
                                                        key={cat} 
                                                        onClick={() => setCurrentCategory(cat)} 
                                                        className={`group relative flex items-center px-3 py-1 rounded-full cursor-pointer border text-xs font-bold transition-all ${currentCategory === cat ? 'bg-purple-100 dark:bg-purple-900/50 border-purple-300 text-purple-800 shadow-[0_2px_8px_-2px_rgba(168,85,247,0.4)]' : 'bg-white border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:bg-slate-900'}`}
                                                    >
                                                        <span>{cat}</span>
                                                        <span 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if(window.confirm(`ç¡®å®è¦æ°¸ä¹å é¤åç±»éé¡¹ "${cat}" åï¼ï¼å é¤åç±»ä¸ä¼å é¤å·²æç¬è®°ï¼`)) {
                                                                    const newCats = customCategories.filter(c => c !== cat);
                                                                    if (currentCategory === cat) setCurrentCategory(newCats.length ? newCats[0] : 'é»è®¤åç±»');
                                                                    setTimeout(() => setCustomCategories(newCats), 0);
                                                                }
                                                            }}
                                                            className="ml-1 w-3.5 h-3.5 flex items-center justify-center rounded-full text-red-500 hover:bg-red-100 dark:bg-red-900/50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                            title={`å é¤ ${cat}`}
                                                        >
                                                            Ã
                                                        </span>
                                                    </div>
                                                ))}
                                                <input 
                                                    type="text" 
                                                    placeholder="+ æ°å»ºåç±» (åè½¦)" 
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
                                                    className="w-28 text-xs px-3 py-1 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-900 border border-dashed border-gray-300 dark:border-slate-600 hover:border-purple-300 focus:border-purple-400 focus:bg-white focus:outline-none rounded-full transition-all placeholder:text-[10px] placeholder:leading-tight"
                                                />
                                            </>
                                        ) : (
                                          <span className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 dark:bg-purple-900/20 text-purple-700 text-xs font-bold rounded-full border border-purple-100 self-start mt-0.5">{currentCategory}</span>
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
                                  className={`px-4 py-2 border rounded-lg font-bold transition-all text-sm flex items-center shadow-sm ${isPublic ? 'bg-green-50 dark:bg-green-900/20 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 dark:bg-slate-900 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:bg-slate-700 dark:bg-gray-700'}`}
                                >
                                  {isPublic ? 'å·²å¬å¼ ð' : 'è®¾ä¸ºå¬å¼'}
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
                                    className="bg-indigo-50 dark:bg-indigo-900/20 dark:bg-indigo-900/20 border border-indigo-200 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:bg-indigo-900/50 dark:hover:bg-indigo-900/30-100 dark:bg-indigo-900/50 px-4 py-2 rounded-lg font-bold transition-all text-sm flex items-center shadow-sm"
                                >
                                    {isEditing ? 'ä¿å­' : 'ç¼è¾'}
                                </button>
                            )}
                            <button
                                onClick={() => setIsFullscreen(!isFullscreen)}
                                className={`px-4 py-2 border rounded-lg font-bold transition-all text-sm flex items-center shadow-sm ${isFullscreen ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/50' : 'bg-white text-gray-700 dark:text-gray-200 border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:bg-slate-900'}`}
                            >
                                {isFullscreen ? (
                                    <>
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                        è¿å
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                                        æ²æµ¸
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleExport}
                                className="bg-white border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:bg-slate-900 hover:text-gray-900 dark:text-gray-100 dark:text-gray-100 px-4 py-2 rounded-lg font-bold transition-all text-sm flex items-center shadow-sm hover:shadow"
                            >
                                <svg className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                å¯¼åº MD
                            </button>
                            {currentNoteId && isNoteOwner && (
                                <button
                                    onClick={handleDelete}
                                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-700 hover:bg-red-100 dark:bg-red-900/50 px-4 py-2 rounded-lg font-bold transition-all text-sm flex items-center shadow-sm ml-2"
                                >
                                    <svg className="w-4 h-4 text-red-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                                    å é¤
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
                                        placeholder="å¨è¿éä½¿ç¨ Markdown ç¼åä½ çç¬è®°..."
                                    />
                                </div>
                                {/* Preview Side */}
                                <div className={`flex flex-col rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden bg-white ${isFullscreen ? 'h-full' : 'h-[600px]'}`}>
                                    <div className="bg-gray-50 dark:bg-slate-900 px-4 py-3 border-b border-gray-200 dark:border-slate-700 flex items-center font-bold text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        <svg className="w-4 h-4 mr-2 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        å®æ¶é¢è§
                                    </div>
                                    <div className="p-6 overflow-y-auto flex-1 prose prose-indigo max-w-none prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-a:text-indigo-600 dark:text-indigo-400 prose-img:rounded-xl bg-white dark:bg-slate-800 w-full">
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm, remarkMath]} 
                                            rehypePlugins={[rehypeKatex]}
                                        >
                                            {(result || '*æ é¢è§åå®¹...*').replace(/\\\((.*?)\\\)/g, '$$$1$$').replace(/\\\[(.*?)\\\]/gs, '$$$$$1$$$$')}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="prose prose-indigo max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-a:text-indigo-600 dark:text-indigo-400 prose-img:rounded-xl">
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
