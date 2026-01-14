
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, MessageSquare, LayoutGrid, UserCircle, Settings, 
  Search, Bell, LogOut, Sun, Moon, Monitor, ShieldCheck,
  Plus, Send, Paperclip, Phone, Video, X, Menu, BookOpen,
  UserPlus, Trash2, Edit3, MoreVertical, Chrome, Mail, 
  CheckCircle2, AlertCircle, Calendar, User as UserIcon
} from 'lucide-react';
import { User, Group, Message, Note, Theme, AppTab, UserRole } from './types';
import { setCookie, getCookie, calculateAdminPassword, generateId, isValidEmail } from './utils';

// Persistence Keys
const USERS_STORAGE_KEY = 'u_verse_db_users';
const GROUPS_STORAGE_KEY = 'u_verse_db_groups';

// Default Placeholder Avatar Component
const Avatar = ({ src, className = "w-10 h-10", name = "" }: { src?: string, className?: string, name?: string }) => {
  if (!src) {
    return (
      <div className={`${className} bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-full overflow-hidden border border-gray-300 dark:border-gray-600`}>
        <UserIcon className="w-1/2 h-1/2 text-gray-400" />
      </div>
    );
  }
  return <img src={src} className={`${className} rounded-full object-cover border border-gray-100 dark:border-gray-800`} alt={name} />;
};

export default function App() {
  // Database State (Simulated)
  const [users, setUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem(USERS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [
      { id: 'u1', name: 'Ansh Yadav', username: 'anshyadav', email: 'ansh@uverse.com', role: 'admin', isLoggedIn: false, createdAt: '2025-01-01', authMethod: 'manual', friends: [] },
    ];
  });

  const [groups, setGroups] = useState<Group[]>(() => {
    const stored = localStorage.getItem(GROUPS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [
      { id: 'g1', name: 'Computer Science 101', description: 'Core principles of computing.', members: ['u1'], creatorId: 'u1', isPrivate: false },
    ];
  });

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authStep, setAuthStep] = useState<'selection' | 'google_redirect' | 'manual_signup' | 'manual_login'>('selection');

  // UI State
  const [activeTab, setActiveTab] = useState<AppTab>('feed');
  const [theme, setTheme] = useState<Theme>('system');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile default closed
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isCalling, setIsCalling] = useState<{ type: 'voice' | 'video', user: string } | null>(null);

  // Sync with Storage
  useEffect(() => localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users)), [users]);
  useEffect(() => localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups)), [groups]);

  // Initialization
  useEffect(() => {
    const savedTheme = getCookie('u-verse-theme') as Theme || 'system';
    setTheme(savedTheme);
    const sessionToken = getCookie('u-verse-session');
    if (sessionToken) {
      const user = users.find(u => u.id === sessionToken);
      if (user) setCurrentUser(user);
    }
  }, []);

  // Theme Side-Effect
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    setCookie('u-verse-theme', theme);
  }, [theme]);

  // --- Auth Actions ---

  const handleGoogleLogin = () => {
    setIsAuthLoading(true);
    setAuthStep('google_redirect');
    // Simulate redirection delay
    setTimeout(() => {
      const mockGoogleData = {
        name: "Google Student",
        email: `student_${Math.floor(Math.random() * 1000)}@gmail.com`,
        dob: "2005-06-15",
      };
      
      const existing = users.find(u => u.email === mockGoogleData.email);
      if (existing) {
        setCurrentUser(existing);
        setCookie('u-verse-session', existing.id);
        setIsAuthLoading(false);
      } else {
        // Since Google users skip password/additional details (except username check), 
        // we'll proceed to username creation
        setGoogleFlowData(mockGoogleData);
        setIsAuthLoading(false);
      }
    }, 2000);
  };

  const [googleFlowData, setGoogleFlowData] = useState<{name: string, email: string, dob: string} | null>(null);

  const registerUser = (userData: Partial<User>) => {
    const newUser: User = {
      id: generateId(),
      name: userData.name || '',
      username: userData.username || '',
      email: userData.email || '',
      dob: userData.dob,
      friends: [],
      role: 'student',
      isLoggedIn: true,
      createdAt: new Date().toISOString(),
      authMethod: userData.authMethod || 'manual',
      password: userData.password,
    };
    setUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setCookie('u-verse-session', newUser.id);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCookie('u-verse-session', '', -1);
    setActiveTab('feed');
  };

  // --- UI Components ---

  const AuthScreen = () => {
    const [formData, setFormData] = useState({ 
      email: '', password: '', username: '', name: '', dob: '' 
    });
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [loginError, setLoginError] = useState('');

    const checkUsername = (val: string) => {
      setFormData(f => ({ ...f, username: val }));
      if (!val) { setUsernameStatus('idle'); return; }
      setUsernameStatus('checking');
      setTimeout(() => {
        const taken = users.some(u => u.username.toLowerCase() === val.toLowerCase());
        setUsernameStatus(taken ? 'taken' : 'available');
      }, 400);
    };

    const handleManualLogin = () => {
      const user = users.find(u => u.email === formData.email && u.password === formData.password);
      if (user) {
        setCurrentUser(user);
        setCookie('u-verse-session', user.id);
      } else {
        setLoginError('Invalid email or password.');
      }
    };

    if (isAuthLoading) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-6 text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6"></div>
          <h2 className="text-2xl font-bold dark:text-white">Redirecting to Google OAuth...</h2>
          <p className="text-gray-500 mt-2">Connecting to secure authentication services</p>
        </div>
      );
    }

    if (googleFlowData) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
          <div className="max-w-md w-full glass p-8 rounded-[2rem] shadow-2xl border dark:border-gray-800">
            <h2 className="text-3xl font-black mb-2 dark:text-white">Almost there!</h2>
            <p className="text-gray-500 mb-8">Choose a unique username to complete your profile.</p>
            <div className="space-y-6">
              <div className="relative">
                <input 
                  className={`w-full px-5 py-4 rounded-2xl border dark:bg-gray-900/50 dark:border-gray-700 dark:text-white outline-none transition-all ${usernameStatus === 'taken' ? 'border-red-500' : usernameStatus === 'available' ? 'border-green-500' : ''}`}
                  placeholder="Choose username"
                  value={formData.username}
                  onChange={e => checkUsername(e.target.value)}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {usernameStatus === 'checking' && <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                  {usernameStatus === 'available' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {usernameStatus === 'taken' && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              <button 
                disabled={usernameStatus !== 'available'}
                onClick={() => registerUser({ ...googleFlowData, username: formData.username, authMethod: 'google' })}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold disabled:opacity-50 hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 transition-all"
              >
                Complete Registration
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
        <div className="max-w-md w-full glass p-8 rounded-[2rem] shadow-2xl border dark:border-gray-800">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-500/40">
              <LayoutGrid className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-black text-center dark:text-white mb-2">U Verse</h1>
          <p className="text-gray-500 text-center mb-10 font-medium">Empowering Student Communities</p>

          <div className="space-y-4">
            {authStep === 'selection' && (
              <>
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center gap-4 py-4 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-2xl font-bold dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-all shadow-sm"
                >
                  <Chrome className="w-6 h-6 text-indigo-600" />
                  Sign in with Google
                </button>
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">or</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800"></div>
                </div>
                <button 
                  onClick={() => setAuthStep('manual_signup')}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all"
                >
                  Create Account with Email
                </button>
                <button 
                  onClick={() => setAuthStep('manual_login')}
                  className="w-full py-3 text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                >
                  Already have an account? Login
                </button>
              </>
            )}

            {(authStep === 'manual_signup' || authStep === 'manual_login') && (
              <div className="space-y-4">
                {authStep === 'manual_signup' && (
                  <input 
                    className="w-full px-5 py-4 rounded-2xl border dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                )}
                <input 
                  className="w-full px-5 py-4 rounded-2xl border dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none"
                  placeholder="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
                <input 
                  className="w-full px-5 py-4 rounded-2xl border dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none"
                  placeholder="Password (Min 8 chars)"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
                {authStep === 'manual_signup' && (
                  <>
                    <div className="relative">
                      <input 
                        className="w-full px-5 py-4 rounded-2xl border dark:bg-gray-900 dark:border-gray-700 dark:text-white outline-none"
                        placeholder="Choose Username"
                        value={formData.username}
                        onChange={e => checkUsername(e.target.value)}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                        {usernameStatus === 'available' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                        {usernameStatus === 'taken' && <AlertCircle className="w-5 h-5 text-red-500" />}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-2 text-gray-500 text-sm">
                      <Calendar className="w-4 h-4" />
                      <input 
                        type="date" 
                        className="bg-transparent border-none outline-none dark:text-white"
                        value={formData.dob}
                        onChange={e => setFormData({...formData, dob: e.target.value})}
                      />
                    </div>
                  </>
                )}
                
                {loginError && <p className="text-red-500 text-sm font-medium">{loginError}</p>}

                <button 
                  onClick={authStep === 'manual_signup' ? () => registerUser(formData) : handleManualLogin}
                  disabled={authStep === 'manual_signup' && (formData.password.length < 8 || !isValidEmail(formData.email) || usernameStatus !== 'available')}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                >
                  {authStep === 'manual_signup' ? 'Join U Verse' : 'Login Now'}
                </button>
                <button 
                  onClick={() => { setAuthStep('selection'); setLoginError(''); }}
                  className="w-full py-2 text-gray-500 font-bold hover:underline"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const Header = () => (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 glass border-b dark:border-gray-800 h-16 md:h-20">
      <div className="flex items-center gap-3">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl md:hidden">
          <Menu className="w-6 h-6 dark:text-gray-400" />
        </button>
        <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">U Verse</h1>
      </div>
      
      <div className="hidden md:flex flex-1 max-w-xl mx-8 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search people or groups..."
          className="w-full pl-12 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl relative hover:bg-gray-200 transition-all">
          <Bell className="w-5 h-5 dark:text-gray-400" />
        </button>
        <button onClick={() => setActiveTab('profile')} className="p-0.5 border-2 border-indigo-600 rounded-full">
          <Avatar src={currentUser?.profilePic} className="w-8 h-8 md:w-10 md:h-10" />
        </button>
      </div>
    </header>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t dark:border-gray-800 md:hidden px-2 pb-safe">
      <div className="flex justify-around items-center h-16">
        {[
          { id: 'feed', icon: BookOpen },
          { id: 'chats', icon: MessageSquare },
          { id: 'groups', icon: LayoutGrid },
          { id: 'friends', icon: Users },
          { id: 'settings', icon: Settings },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as AppTab)}
            className={`p-3 rounded-2xl transition-all ${activeTab === item.id ? 'text-indigo-600' : 'text-gray-400'}`}
          >
            <item.icon className="w-6 h-6" />
          </button>
        ))}
      </div>
    </nav>
  );

  const Sidebar = () => (
    <aside className={`fixed top-20 left-0 bottom-0 z-30 glass border-r dark:border-gray-800 transition-all duration-300 overflow-hidden hidden md:block ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <div className="flex flex-col h-full p-4 gap-2">
        {[
          { id: 'feed', icon: BookOpen, label: 'Feed' },
          { id: 'chats', icon: MessageSquare, label: 'Chats' },
          { id: 'groups', icon: LayoutGrid, label: 'Groups' },
          { id: 'friends', icon: Users, label: 'Friends' },
          { id: 'profile', icon: UserCircle, label: 'Profile' },
          { id: 'settings', icon: Settings, label: 'Settings' },
          ...(currentUser?.role === 'admin' ? [{ id: 'admin', icon: ShieldCheck, label: 'Admin Panel' }] : [])
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as AppTab)}
            className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
          >
            <item.icon className="w-6 h-6 flex-shrink-0" />
            {isSidebarOpen && <span className="font-bold whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
        <button 
          onClick={handleLogout}
          className="mt-auto flex items-center gap-4 p-3.5 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut className="w-6 h-6 flex-shrink-0" />
          {isSidebarOpen && <span className="font-bold">Sign Out</span>}
        </button>
      </div>
    </aside>
  );

  const FeedView = () => (
    <div className="max-w-3xl mx-auto p-4 md:p-8 pb-32">
       <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl md:text-3xl font-black dark:text-white">Academic Feed</h2>
        <button className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg md:px-6 md:py-3 md:flex md:items-center md:gap-2">
          <Plus className="w-6 h-6" />
          <span className="hidden md:inline font-bold">New Post</span>
        </button>
      </div>
      
      <div className="space-y-6">
        {users.slice(0, 3).map((user, idx) => (
          <div key={idx} className="glass p-5 rounded-[2rem] border dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <Avatar src={user.profilePic} className="w-10 h-10" />
              <div>
                <p className="font-bold text-sm dark:text-white">{user.name}</p>
                <p className="text-xs text-gray-500">@{user.username}</p>
              </div>
            </div>
            <div className="h-48 bg-gray-100 dark:bg-gray-800 rounded-2xl mb-4 flex items-center justify-center text-gray-400 font-medium italic p-8 text-center">
              "Working on my research for the semester. Shared some notes in the AI Lab group!"
            </div>
            <div className="flex gap-4">
              <button className="text-indigo-600 text-sm font-bold">Like</button>
              <button className="text-gray-500 text-sm font-bold">Comment</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const FriendsView = () => {
    // Dynamic List excluding self
    const otherUsers = users.filter(u => u.id !== currentUser?.id);
    
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32">
        <h2 className="text-2xl md:text-3xl font-black dark:text-white mb-8">People at U Verse</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {otherUsers.map(user => (
            <div key={user.id} className="flex items-center justify-between p-4 glass border dark:border-gray-800 rounded-[1.5rem] hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              <div className="flex items-center gap-4">
                <Avatar src={user.profilePic} className="w-14 h-14" />
                <div>
                  <p className="font-bold dark:text-white">{user.name}</p>
                  <p className="text-sm text-gray-500">@{user.username}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setActiveTab('chats'); setActiveChatId(user.id); }}
                  className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
                <button className="p-3 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded-xl">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
          {otherUsers.length === 0 && (
            <div className="col-span-full py-20 text-center text-gray-500 italic">
              No other students joined yet.
            </div>
          )}
        </div>
      </div>
    );
  };

  const AdminPanelView = () => {
    const [isAuthed, setIsAuthed] = useState(false);
    const [pwd, setPwd] = useState('');

    if (!isAuthed) {
      return (
        <div className="max-w-md mx-auto mt-20 glass p-8 rounded-[2rem] border-2 border-red-500/20 text-center">
          <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black mb-8 dark:text-white">Admin Authorization</h2>
          <input 
            type="password"
            placeholder="Security Pin"
            className="w-full px-5 py-4 rounded-2xl border dark:bg-gray-900 dark:text-white text-center text-2xl font-black mb-4 outline-none"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
          />
          <button 
            onClick={() => pwd === calculateAdminPassword() ? setIsAuthed(true) : alert('Wrong pin')}
            className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-xl shadow-red-500/20"
          >
            Enter Command Center
          </button>
        </div>
      );
    }

    return (
      <div className="p-4 md:p-8 pb-32">
        <h2 className="text-2xl md:text-3xl font-black dark:text-white mb-8">System Management</h2>
        <div className="glass rounded-3xl overflow-hidden border dark:border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-xs">Student</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-xs">Auth/Email</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-xs">DOB</th>
                  <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-widest text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-800">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.profilePic} className="w-10 h-10" />
                        <div>
                          <p className="font-bold dark:text-white">{u.name}</p>
                          <p className="text-xs text-gray-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium dark:text-gray-300">{u.email}</span>
                        <span className="text-[10px] uppercase font-black text-indigo-500 tracking-widest">{u.authMethod}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{u.dob || 'N/A'}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          if (u.id === currentUser?.id) return;
                          setUsers(prev => prev.filter(usr => usr.id !== u.id));
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const MainContent = () => {
    switch(activeTab) {
      case 'feed': return <FeedView />;
      case 'friends': return <FriendsView />;
      case 'admin': return <AdminPanelView />;
      case 'profile': return <div className="p-8 text-center text-gray-500">Profile customization coming soon!</div>;
      case 'chats': return <div className="p-8 text-center text-gray-500">Chats interface optimized for mobile in dev.</div>;
      case 'settings': return (
        <div className="max-w-2xl mx-auto p-8 space-y-6">
           <h2 className="text-3xl font-black dark:text-white">Settings</h2>
           <div className="glass p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold dark:text-white">Dark Mode</span>
                <select 
                  value={theme}
                  onChange={e => setTheme(e.target.value as Theme)}
                  className="bg-gray-100 dark:bg-gray-800 p-2 rounded-xl text-sm dark:text-white"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
           </div>
           <button onClick={handleLogout} className="w-full py-4 bg-red-100 dark:bg-red-900/20 text-red-600 font-bold rounded-2xl">Sign Out</button>
        </div>
      );
      default: return <FeedView />;
    }
  };

  if (!currentUser) return <AuthScreen />;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="flex-1 flex pt-16 md:pt-20">
        <Sidebar />
        <main className={`flex-1 transition-all duration-300 md:ml-20 ${isSidebarOpen ? 'md:ml-64' : ''}`}>
          <MainContent />
          <footer className="py-12 text-center text-gray-400 text-sm glass border-t dark:border-gray-800 pb-24 md:pb-12">
            <div dangerouslySetInnerHTML={{ __html: `All rights reserved. U Verse 2026© <br> Developed by Ansh Yadav.` }} />
          </footer>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
