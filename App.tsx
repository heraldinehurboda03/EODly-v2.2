
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ViewType, Report, ReportStatus, User } from './types';
import Dashboard from './components/Dashboard';
import CreateReport from './components/CreateReport';
import Stats from './components/Stats';
import { Auth, Logo } from './components/Auth';
import ExportCenter from './components/ExportCenter';
import HistoryView from './components/HistoryView';
import TrashBin from './components/TrashBin';

// Error Boundary for UI resilience
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Fix: Use explicit interfaces for Props and State to resolve 'Property does not exist' errors
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background-light dark:bg-background-dark">
          <Logo size="size-16" />
          <h1 className="text-2xl font-black mt-8 text-primary dark:text-white">Something went wrong.</h1>
          <p className="text-slate-500 mt-2 text-center max-w-xs">We encountered a runtime error. Please refresh or try again later.</p>
          <button onClick={() => window.location.reload()} className="mt-8 bg-primary text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest">Refresh App</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const LoadingScreen = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-background-light dark:bg-background-dark animate-pulse">
    <Logo size="size-16" />
    <p className="mt-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Initializing EODly...</p>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('SIGN_IN');
  const [reports, setReports] = useState<Report[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [toasts, setToasts] = useState<{ 
    id: number; 
    message: string; 
    type: 'success' | 'info' | 'error'; 
    action?: { label: string; onClick: () => void } 
  }[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    try {
      // 1. Load Reports Safely
      const savedReports = localStorage.getItem('eodly_reports');
      if (savedReports) {
        const parsedReports: Report[] = JSON.parse(savedReports);
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const cleanedReports = Array.isArray(parsedReports) ? parsedReports.filter(r => {
          if (r.isDeleted && r.deletedAt) {
            const deletedTime = new Date(r.deletedAt).getTime();
            return (now - deletedTime) < THIRTY_DAYS_MS;
          }
          return true;
        }) : [];
        setReports(cleanedReports);
      }

      // 2. Load Global User Directory Safely
      const savedUsers = localStorage.getItem('eodly_users');
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        setAllUsers(Array.isArray(parsedUsers) ? parsedUsers : []);
      }

      // 3. Load Persistent Session Safely
      const sessionUser = localStorage.getItem('eodly_session');
      if (sessionUser) {
        const parsedUser = JSON.parse(sessionUser);
        setCurrentUser(parsedUser);
        setIsAuthenticated(true);
        setCurrentView('HOME');
      }

      // 4. Load Theme Safely
      const savedTheme = localStorage.getItem('eodly_theme');
      if (savedTheme === 'dark') {
        setIsDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    } catch (e) {
      console.error("Initialization Error", e);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('eodly_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('eodly_theme', 'light');
    }
  };

  useEffect(() => {
    if (!isInitializing) {
      localStorage.setItem('eodly_reports', JSON.stringify(reports));
    }
  }, [reports, isInitializing]);

  const addToast = useCallback((
    message: string, 
    type: 'success' | 'info' | 'error' = 'success',
    action?: { label: string; onClick: () => void }
  ) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, action }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const handleAuth = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setCurrentView('HOME');
    localStorage.setItem('eodly_session', JSON.stringify(user));
    
    setAllUsers(prev => {
      if (prev.find(u => u.id === user.id)) return prev;
      const updated = [...prev, user];
      localStorage.setItem('eodly_users', JSON.stringify(updated));
      return updated;
    });
    
    addToast(`Welcome back, ${user.name}!`, 'success');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('SIGN_IN');
    localStorage.removeItem('eodly_session');
  };

  const handleAddReport = useCallback((data: any, isDraft: boolean = false) => {
    if (!currentUser) return;

    const reportId = `r-${Date.now()}`;
    
    const newReport: Report = {
      id: reportId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=001d3d&color=fff`,
      userMbti: currentUser.mbti,
      timestamp: new Date().toISOString(),
      date: data.date || new Date().toISOString().split('T')[0],
      status: ReportStatus.DONE,
      content: data.content || "",
      blockers: data.blockers || "",
      planForTomorrow: data.planForTomorrow || "",
      breaks: data.breaks || [],
      files: data.files || [],
      links: data.links || [],
      department: currentUser.department || 'Operations',
      workHours: { start: data.start || "--:-- --", end: data.end || "--:-- --" },
      optimizedSummary: data.optimizedSummary || "",
      isDeleted: false,
      isDraft: isDraft
    };
    
    setReports(prev => [newReport, ...prev]);
    addToast(isDraft ? 'Draft Saved' : 'EOD Dispatched!', 'success');
    if (!isDraft) setCurrentView('HISTORY');
  }, [currentUser, addToast]);

  const handleRestoreReport = useCallback((id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, isDeleted: false, deletedAt: undefined } : r));
    addToast('Report restored successfully.', 'success');
  }, [addToast]);

  const handleMoveToTrash = useCallback((id: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, isDeleted: true, deletedAt: new Date().toISOString() } : r));
    addToast('Report moved to Trash Bin.', 'info', {
      label: 'Undo',
      onClick: () => handleRestoreReport(id)
    });
  }, [addToast, handleRestoreReport]);

  const handleEmptyTrash = useCallback(() => {
    if (!currentUser) return;
    setReports(prev => prev.filter(r => !(r.isDeleted && r.userId === currentUser.id)));
    addToast('Trash emptied permanently.', 'success');
  }, [currentUser, addToast]);

  const activeReports = useMemo(() => reports.filter(r => !r.isDeleted), [reports]);
  const trashReports = useMemo(() => 
    reports.filter(r => r.isDeleted === true && r.userId === (currentUser?.id || "")), 
  [reports, currentUser]);

  const filteredHistory = useMemo(() => {
    const list = activeReports.filter(r => r.userId === currentUser?.id && !r.isDraft);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(r => 
      (r.date && r.date.includes(q)) || 
      (r.content && r.content.toLowerCase().includes(q)) ||
      (r.blockers && r.blockers.toLowerCase().includes(q))
    );
  }, [activeReports, currentUser, searchQuery]);

  const handleUpdateProfile = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    const newUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
    setAllUsers(newUsers);
    localStorage.setItem('eodly_users', JSON.stringify(newUsers));
    localStorage.setItem('eodly_session', JSON.stringify(updatedUser));
    addToast('Profile updated!', 'success');
  };

  const renderView = () => {
    if (isInitializing) return <LoadingScreen />;
    if (!isAuthenticated) {
      return <Auth onAuth={handleAuth} view={currentView === 'SIGN_UP' ? 'SIGN_UP' : 'SIGN_IN'} setView={setCurrentView} />;
    }
    if (!currentUser) {
      // Safety check: if authenticated but user is missing, force logout
      handleLogout();
      return <Auth onAuth={handleAuth} view="SIGN_IN" setView={setCurrentView} />;
    }

    switch(currentView) {
      case 'HOME': return <Dashboard reports={activeReports.filter(r => !r.isDraft)} allUsers={allUsers} onNudge={(name) => addToast(`Nudge sent to ${name}`, 'info')} currentUser={currentUser} onViewCreate={() => setCurrentView('CREATE')} onViewHistory={() => setCurrentView('HISTORY')} onViewStats={() => setCurrentView('STATS')} />;
      case 'CREATE': return <CreateReport currentUser={currentUser} onCancel={() => setCurrentView('HOME')} onSubmit={handleAddReport} reports={activeReports} onDeleteDraft={handleMoveToTrash} />;
      case 'HISTORY': return <HistoryView reports={filteredHistory} highlightQuery={searchQuery} onDelete={handleMoveToTrash} />;
      case 'TRASH': return (
        <TrashBin 
          reports={trashReports} 
          onRestore={handleRestoreReport} 
          onEmptyTrash={handleEmptyTrash}
          onBack={() => setCurrentView('HOME')} 
        />
      );
      case 'EXPORT': return <ExportCenter currentUser={currentUser} reports={activeReports.filter(r => !r.isDraft)} allUsers={allUsers} onExport={(fmt) => addToast(`Exporting as ${fmt}...`, 'info')} onBack={() => setCurrentView('HOME')} />;
      case 'SETTINGS': return <Settings user={currentUser} onSave={handleUpdateProfile} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />;
      case 'STATS': return <Stats reports={activeReports.filter(r => !r.isDraft)} />;
      case 'SIGN_IN':
      case 'SIGN_UP':
        // Already authenticated, but in an auth view: redirect home
        setCurrentView('HOME');
        return <LoadingScreen />;
      default: 
        return <Dashboard reports={activeReports.filter(r => !r.isDraft)} allUsers={allUsers} onNudge={(name) => addToast(`Nudge sent to ${name}`, 'info')} currentUser={currentUser} onViewCreate={() => setCurrentView('CREATE')} onViewHistory={() => setCurrentView('HISTORY')} onViewStats={() => setCurrentView('STATS')} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#f8fafc] dark:bg-background-dark text-primary dark:text-slate-100 flex overflow-hidden transition-colors duration-300">
        
        <div className="fixed top-24 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
          {toasts.map(toast => (
            <div key={toast.id} className={`pointer-events-auto p-4 rounded-2xl shadow-xl flex items-center justify-between gap-6 animate-in slide-in-from-right duration-300 ${
              toast.type === 'success' ? 'bg-green-600 text-white' : 
              toast.type === 'error' ? 'bg-red-600 text-white' : 
              'bg-[#0a1128] text-white'
            }`}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">{toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info'}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
              </div>
              {toast.action && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.action?.onClick();
                    setToasts(prev => prev.filter(t => t.id !== toast.id));
                  }}
                  className="bg-white/20 hover:bg-white/40 active:bg-white/50 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
          ))}
        </div>

        {isAuthenticated && currentUser && (
          <aside className="hidden lg:flex flex-col w-72 border-r border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 z-50 transition-colors duration-300">
            <div className="p-8 flex flex-col gap-8 h-full">
              <div className="flex items-center gap-3">
                <div className="bg-[#0a1128] dark:bg-white size-10 rounded-xl flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-white dark:text-[#0a1128] text-xl fill-icon rotate-[15deg]">bolt</span>
                </div>
                <h2 className="text-2xl font-black text-[#0a1128] dark:text-white tracking-tight leading-none">EODly</h2>
              </div>
              
              <nav className="flex-1">
                <ul className="flex flex-col gap-2">
                  <SidebarItem icon="grid_view" label="Dashboard" active={currentView === 'HOME'} onClick={() => setCurrentView('HOME')} />
                  <SidebarItem icon="add" label="New Report" active={currentView === 'CREATE'} onClick={() => setCurrentView('CREATE')} />
                  <SidebarItem icon="history" label="History" active={currentView === 'HISTORY'} onClick={() => setCurrentView('HISTORY')} />
                  <SidebarItem icon="file_export" label="Export" active={currentView === 'EXPORT'} onClick={() => setCurrentView('EXPORT')} />
                  <SidebarItem icon="delete" label="Trash Bin" active={currentView === 'TRASH'} onClick={() => setCurrentView('TRASH')} badge={trashReports.length > 0 ? trashReports.length : null} />
                  <SidebarItem icon="settings" label="Settings" active={currentView === 'SETTINGS'} onClick={() => setCurrentView('SETTINGS')} />
                </ul>
              </nav>

              <div className="mt-auto pt-8 border-t border-slate-300 dark:border-slate-800 flex flex-col gap-4">
                 <button onClick={handleLogout} className="flex items-center gap-3 text-red-500 font-bold text-xs px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all">
                    <span className="material-symbols-outlined text-base">logout</span> Sign Out
                 </button>
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1 flex flex-col min-h-screen relative overflow-y-auto hide-scrollbar">
          {isAuthenticated && currentUser && (
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-300 dark:border-slate-800 px-4 md:px-8 py-4 flex items-center justify-between transition-colors duration-300">
              <div className="flex items-center gap-3 flex-1">
                <button onClick={() => setIsMobileSidebarOpen(true)} className="lg:hidden p-1 text-primary dark:text-white hover:bg-primary/5 rounded-lg">
                  <span className="material-symbols-outlined text-[28px]">menu</span>
                </button>
                <div className="flex-1 max-w-xl relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                  <input 
                    type="text" 
                    placeholder="Search history by date or content..." 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (currentView !== 'HISTORY') setCurrentView('HISTORY');
                    }}
                    className="w-full bg-brand-gray dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold text-primary dark:text-white focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                  />
                </div>
              </div>
            </header>
          )}

          <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-8 lg:p-10">
            {renderView()}
          </main>

          {isAuthenticated && currentUser && (
            <nav className="lg:hidden fixed bottom-0 inset-x-0 h-20 bg-white dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 px-6 flex items-center justify-between z-40 transition-colors duration-300">
              <MobileNavItem active={currentView === 'HOME'} onClick={() => setCurrentView('HOME')} icon="grid_view" label="HOME" />
              <MobileNavItem active={currentView === 'HISTORY'} onClick={() => setCurrentView('HISTORY')} icon="history" label="HISTORY" />
              <div className="relative -top-8">
                <button onClick={() => setCurrentView('CREATE')} className="size-16 rounded-2xl bg-[#0a1128] dark:bg-white text-white dark:text-[#0a1128] flex items-center justify-center shadow-2xl active:scale-90 transition-all">
                  <span className="material-symbols-outlined text-[36px]">add</span>
                </button>
              </div>
              <MobileNavItem active={currentView === 'EXPORT'} icon="file_export" label="EXPORT" onClick={() => setCurrentView('EXPORT')} />
              <MobileNavItem active={currentView === 'SETTINGS'} icon="settings" label="SETTINGS" onClick={() => setCurrentView('SETTINGS')} />
            </nav>
          )}
        </div>

        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-[100] bg-[#0a1128]/20 backdrop-blur-sm animate-in fade-in lg:hidden" onClick={() => setIsMobileSidebarOpen(false)}>
            <aside className="w-4/5 h-full bg-white dark:bg-slate-900 p-8 flex flex-col gap-8 animate-in slide-in-from-left transition-colors duration-300 border-r border-slate-300 dark:border-transparent" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3">
                <div className="bg-[#0a1128] dark:bg-white size-10 rounded-xl flex items-center justify-center">
                   <span className="material-symbols-outlined text-white dark:text-[#0a1128] text-xl fill-icon rotate-[15deg]">bolt</span>
                </div>
                <h2 className="text-2xl font-black text-[#0a1128] dark:text-white tracking-tight leading-none">EODly</h2>
              </div>
              <ul className="flex flex-col gap-4">
                 <SidebarItem icon="home" label="Dashboard" active={currentView === 'HOME'} onClick={() => { setCurrentView('HOME'); setIsMobileSidebarOpen(false); }} />
                 <SidebarItem icon="add" label="New Report" active={currentView === 'CREATE'} onClick={() => { setCurrentView('CREATE'); setIsMobileSidebarOpen(false); }} />
                 <SidebarItem icon="history" label="History" active={currentView === 'HISTORY'} onClick={() => { setCurrentView('HISTORY'); setIsMobileSidebarOpen(false); }} />
                 <SidebarItem icon="file_export" label="Export" active={currentView === 'EXPORT'} onClick={() => { setCurrentView('EXPORT'); setIsMobileSidebarOpen(false); }} />
                 <SidebarItem icon="delete" label="Trash Bin" active={currentView === 'TRASH'} onClick={() => { setCurrentView('TRASH'); setIsMobileSidebarOpen(false); }} />
                 <SidebarItem icon="settings" label="Settings" active={currentView === 'SETTINGS'} onClick={() => { setCurrentView('SETTINGS'); setIsMobileSidebarOpen(false); }} />
                 <SidebarItem icon="logout" label="Sign Out" onClick={handleLogout} />
              </ul>
            </aside>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

const MobileNavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#0a1128] dark:text-white font-bold' : 'text-slate-400'}`}>
    <span className={`material-symbols-outlined text-[24px] ${active ? 'fill-icon' : ''}`}>{icon}</span>
    <span className="text-[9px] font-black uppercase tracking-widest leading-none mt-1">{label}</span>
  </button>
);

const SidebarItem = ({ icon, label, active, onClick, badge }: any) => (
  <li onClick={onClick} className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all cursor-pointer group ${active ? 'bg-[#0a1128] dark:bg-white text-white dark:text-[#0a1128] shadow-lg' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
     <div className="flex items-center gap-4">
        <span className={`material-symbols-outlined ${active ? 'fill-icon' : ''}`}>{icon}</span>
        <span className={`text-sm font-bold tracking-tight`}>{label}</span>
     </div>
     {badge && (
       <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-in zoom-in">{badge}</span>
     )}
  </li>
);

const Settings: React.FC<{ 
  user: User; 
  onSave: (user: User) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}> = ({ user, onSave, isDarkMode, onToggleTheme }) => {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [role, setRole] = useState(user.role || "");
  const [mbti, setMbti] = useState(user.mbti || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...user, name, email, role, mbti });
  };

  const MBTI_TYPES = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ];

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in fade-in duration-500 pb-32">
      <header className="mb-10 flex items-center gap-4">
         <div className="size-12 rounded-2xl bg-[#0a1128] dark:bg-white flex items-center justify-center text-white dark:text-[#0a1128] shadow-lg">
            <span className="material-symbols-outlined">settings</span>
         </div>
         <h2 className="text-3xl font-black text-[#0a1128] dark:text-white tracking-tight">App Settings</h2>
      </header>
      
      <div className="space-y-10">
        <section className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-sm border border-slate-300 dark:border-slate-700 transition-all">
           <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Appearance</h3>
           <div className="flex items-center justify-between p-6 bg-brand-gray dark:bg-slate-900/50 rounded-2xl border border-slate-300 dark:border-slate-700">
              <div className="flex items-center gap-4">
                 <div className="size-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-700">
                    <span className="material-symbols-outlined text-primary dark:text-white">{isDarkMode ? 'dark_mode' : 'light_mode'}</span>
                 </div>
                 <div>
                    <p className="text-sm font-bold text-primary dark:text-white">Dark Mode</p>
                    <p className="text-[10px] text-slate-400 font-medium">Switch between light and dark themes</p>
                 </div>
              </div>
              <button 
                onClick={onToggleTheme} 
                className={`w-14 h-8 rounded-full relative transition-all duration-300 border border-slate-300 dark:border-slate-600 ${isDarkMode ? 'bg-[#0a1128] dark:bg-white' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 size-6 rounded-full transition-all duration-300 ${isDarkMode ? 'right-1 bg-white dark:bg-[#0a1128]' : 'left-1 bg-white'}`}></div>
              </button>
           </div>
        </section>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-sm border border-slate-300 dark:border-slate-700 space-y-8 transition-all">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personal Profile</h3>
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Username</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-brand-gray dark:bg-slate-800 p-5 rounded-2xl text-primary dark:text-white font-bold border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#0a1128]/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full bg-brand-gray dark:bg-slate-800 p-5 rounded-2xl text-primary dark:text-white font-bold border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#0a1128]/10 transition-all"
            />
          </div>
          
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Role</label>
            <input 
              type="text" 
              value={role} 
              onChange={e => setRole(e.target.value)} 
              className="w-full bg-brand-gray dark:bg-slate-800 p-5 rounded-2xl text-primary dark:text-white font-bold border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#0a1128]/10 transition-all"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">MBTI Type</label>
            <div className="relative">
              <select 
                value={mbti} 
                onChange={e => setMbti(e.target.value)}
                className="w-full bg-brand-gray dark:bg-slate-800 p-5 rounded-2xl text-primary dark:text-white font-bold border border-slate-300 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#0a1128]/10 appearance-none cursor-pointer"
              >
                <option value="">Select MBTI</option>
                {MBTI_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>

          <button type="submit" className="w-full h-20 bg-[#0a1128] dark:bg-white text-white dark:text-[#0a1128] rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
            <span className="material-symbols-outlined">save</span>
            SAVE PROFILE CHANGES
          </button>
        </form>
      </div>
    </div>
  );
};

export default App;
