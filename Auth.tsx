
import React, { useState } from 'react';
import { ViewType, User } from '../types';

interface AuthProps {
  onAuth: (user: User) => void;
  view: 'SIGN_IN' | 'SIGN_UP';
  setView: (view: ViewType) => void;
}

export const Logo: React.FC<{ size?: string }> = ({ size = "size-20" }) => (
  <div className={`bg-primary ${size} rounded-[2rem] flex items-center justify-center shadow-lg shadow-primary/30 animate-in zoom-in duration-700`}>
    <span className="material-symbols-outlined text-white text-5xl fill-icon rotate-[15deg]">bolt</span>
  </div>
);

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP'
];

export const Auth: React.FC<AuthProps> = ({ onAuth, view, setView }) => {
  const [selectedMBTI, setSelectedMBTI] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isSignIn = view === 'SIGN_IN';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    const usersStr = localStorage.getItem('eodly_users') || '[]';
    const users: User[] = JSON.parse(usersStr);

    if (isSignIn) {
      const user = users.find(u => u.email === email);
      if (user) {
        onAuth(user);
      } else {
        alert('User not found. Please sign up.');
      }
    } else {
      if (!username || !selectedMBTI) {
        alert('Please fill in all fields and select your MBTI type');
        return;
      }
      if (users.find(u => u.email === email)) {
        alert('User already exists. Please sign in.');
        return;
      }

      const newUser: User = {
        id: `u-${Date.now()}`,
        name: username,
        email: email,
        role: 'Team Member',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=001d3d&color=fff`,
        department: 'Engineering',
        mbti: selectedMBTI
      };

      users.push(newUser);
      localStorage.setItem('eodly_users', JSON.stringify(users));
      onAuth(newUser);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 animate-in fade-in duration-500 overflow-y-auto bg-background-light dark:bg-background-dark transition-colors duration-300">
      <div className="flex flex-col items-center gap-4 mb-12">
        <Logo />
        <div className="text-center">
          <h1 className="text-5xl font-black text-primary dark:text-white tracking-tight">EODly</h1>
          <p className="text-xs font-bold text-secondary tracking-[0.2em] mt-2 uppercase">Wrap it up, level up</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-6">
        {!isSignIn && (
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your_name"
              className="w-full bg-brand-gray dark:bg-slate-800 border-none rounded-auth py-4 px-6 text-primary dark:text-white font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Email Address</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@company.com"
            className="w-full bg-brand-gray dark:bg-slate-800 border-none rounded-auth py-4 px-6 text-primary dark:text-white font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
          />
        </div>

        <div className="flex flex-col gap-2 relative">
          <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="........"
              className="w-full bg-brand-gray dark:bg-slate-800 border-none rounded-auth py-4 px-6 text-primary dark:text-white font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />
            <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 cursor-pointer transition-colors ${showPassword ? 'text-primary' : 'text-slate-300'}`}
            >
                {showPassword ? 'visibility' : 'visibility_off'}
            </button>
          </div>
        </div>

        {!isSignIn && (
          <div className="flex flex-col gap-4 my-2">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-[1px] bg-slate-100 dark:bg-slate-700"></div>
              <span className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest shrink-0">Select your MBTI</span>
              <div className="flex-1 h-[1px] bg-slate-100 dark:bg-slate-700"></div>
            </div>
            <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1 hide-scrollbar">
              {MBTI_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedMBTI(type)}
                  className={`py-3 rounded-2xl text-[10px] font-black tracking-wider transition-all border outline-none ${
                    selectedMBTI === type 
                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                    : 'bg-brand-gray dark:bg-slate-800 text-primary dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}

        <button 
          type="submit"
          className="w-full bg-primary text-white py-5 rounded-auth font-black text-sm tracking-widest shadow-xl shadow-primary/20 active:scale-[0.98] transition-all outline-none"
        >
          {isSignIn ? 'Sign In' : 'Create Account'}
        </button>

        <div className="mt-8 text-center pb-8">
          <p className="text-sm font-bold text-slate-300 dark:text-slate-500">
            {isSignIn ? "Don't have an account?" : "Already have an account?"}{' '}
            <button 
              type="button"
              onClick={() => setView(isSignIn ? 'SIGN_UP' : 'SIGN_IN')}
              className="text-secondary hover:text-primary dark:hover:text-white transition-colors underline underline-offset-4 decoration-2"
            >
              {isSignIn ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
