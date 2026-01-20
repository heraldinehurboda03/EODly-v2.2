
import React from 'react';
import { Report, User } from '../types';

interface DashboardProps {
  reports: Report[];
  allUsers: User[];
  onNudge: (name: string) => void;
  currentUser: User;
  onViewCreate: () => void;
  onViewHistory: () => void;
  onViewStats: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ reports, currentUser, onViewCreate, onViewHistory, onViewStats }) => {
  const archiveCount = reports.filter(r => r.userId === currentUser.id).length;
  
  // Calculate a mock success rate based on reports
  const totalReports = reports.length;
  const successRate = totalReports > 0 ? Math.round((reports.filter(r => r.status === 'DONE').length / totalReports) * 100) : 100;

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-20">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0d9488] to-[#22c55e] rounded-[2.5rem] p-10 text-white shadow-xl shadow-teal-500/10 border border-teal-600/20">
         <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-6">
               <div className="size-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <span className="material-symbols-outlined text-4xl">sync</span>
               </div>
               <div>
                  <h1 className="text-4xl font-black tracking-tight leading-none mb-2">In sync, {currentUser.name.split(' ')[0]}.</h1>
                  <p className="text-white/80 font-medium">Your schedule, your rules. Results delivered.</p>
               </div>
            </div>
            <button onClick={onViewCreate} className="bg-[#0a1128] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:scale-105 active:scale-95 transition-all border border-slate-700/50">
               <span className="material-symbols-outlined">add</span> Log Shift
            </button>
         </div>
         <div className="absolute top-0 right-0 p-10 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[200px] rotate-[-15deg]">bolt</span>
         </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <MetricCard label="SHIFT ARCHIVE" value={archiveCount.toString()} />
         <MetricCard label="SUCCESS RATE" value={`${successRate}%`} color="text-orange-500" />
         <div onClick={onViewStats} className="cursor-pointer group">
            <MetricCard label="TEAM STATS" value="View Stats" color="text-green-600" className="group-hover:bg-green-50 dark:group-hover:bg-green-950/20 transition-all border-green-300 dark:border-green-800" />
         </div>
      </div>

      {/* Recent Activity / Feed Summary */}
      <div className="space-y-6">
         <div className="flex items-center justify-between px-2">
            <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight leading-none">Recent Shifts</h3>
            <button onClick={onViewHistory} className="text-[10px] font-black text-[#0a1128] dark:text-white uppercase tracking-widest flex items-center gap-2 group">
               ALL LOGS <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
         </div>
         
         <div className="flex flex-col gap-4">
            {reports.slice(0, 3).map(report => (
               <div key={report.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-300 dark:border-slate-700 shadow-sm flex items-center gap-6">
                  <img src={report.userAvatar} className="size-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700" alt="" />
                  <div className="flex-1">
                     <div className="flex justify-between items-center mb-1">
                        <h4 className="font-black text-primary dark:text-white">{report.userName}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{report.date}</span>
                     </div>
                     <p className="text-sm text-slate-500 font-medium line-clamp-1 italic">"{report.content}"</p>
                  </div>
               </div>
            ))}
            {reports.length === 0 && (
               <div className="py-20 text-center opacity-30 flex flex-col items-center">
                  <span className="material-symbols-outlined text-6xl">history_toggle_off</span>
                  <p className="mt-4 font-black uppercase tracking-widest text-xs">No Recent Logs Found</p>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, color = "text-[#0a1128] dark:text-white", className = "" }: any) => (
  <div className={`bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col gap-2 ${className}`}>
     <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">{label}</p>
     <p className={`text-4xl font-black ${color} truncate`}>{value}</p>
  </div>
);

export default Dashboard;
