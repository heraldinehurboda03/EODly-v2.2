
import React, { useMemo } from 'react';
import { Report, ReportStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StatsProps {
  reports: Report[];
}

const Stats: React.FC<StatsProps> = ({ reports = [] }) => {
  const chartData = useMemo(() => {
    const days: Record<string, { name: string; date: string; completed: number; blocked: number }> = {};
    const today = new Date();
    for(let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const iso = d.toISOString().split('T')[0];
        days[iso] = { 
            name: d.toLocaleDateString('en-US', { weekday: 'short' }), 
            date: iso, 
            completed: 0, 
            blocked: 0 
        };
    }
    
    if (Array.isArray(reports)) {
      reports.forEach(r => {
        if (r && r.date && days[r.date]) {
          if (r.status === ReportStatus.DONE) days[r.date].completed++;
          if (r.status === ReportStatus.BLOCKED) days[r.date].blocked++;
        }
      });
    }
    
    return Object.values(days);
  }, [reports]);

  const statsOverview = useMemo(() => {
    const safeReports = Array.isArray(reports) ? reports : [];
    const total = safeReports.length;
    const done = safeReports.filter(r => r.status === ReportStatus.DONE).length;
    const blocked = safeReports.filter(r => r.status === ReportStatus.BLOCKED).length;
    return {
      rate: total > 0 ? Math.round((done / total) * 100) : 0,
      blocked,
      count: total
    };
  }, [reports]);

  return (
    <div className="flex flex-col gap-8 animate-in slide-in-from-right duration-500 pb-20">
       <header className="px-1">
          <h2 className="text-3xl font-black tracking-tight text-brand-navy dark:text-white leading-none">Team Performance</h2>
          <p className="text-sm text-secondary font-medium mt-2 uppercase tracking-widest opacity-80 leading-none">Productivity Comparison</p>
       </header>

       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         <StatMetric label="Submission Rate" value={`${statsOverview.rate}%`} trend="+2% avg" color="text-green-600" />
         <StatMetric label="Total Logs" value={statsOverview.count.toString()} trend="Global" color="text-brand-navy dark:text-white" />
         <StatMetric label="Hurdles Found" value={statsOverview.blocked.toString()} trend="-12% weekly" color="text-red-500" />
         <StatMetric label="Team Velocity" value="8.8" trend="Peak Flow" color="text-secondary" />
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-8 bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-brand transition-colors duration-300">
            <div className="flex justify-between items-start mb-10">
               <div>
                  <h3 className="text-lg font-black text-brand-navy dark:text-white leading-none">Weekly Productivity</h3>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-2">EOD Status Comparison</p>
               </div>
            </div>
            <div className="h-80 w-full min-h-[300px]">
              {reports.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                    <Tooltip cursor={{fill: 'currentColor', opacity: 0.05}} contentStyle={{borderRadius: '24px', border: 'none', background: 'white', color: '#001d3d', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '16px'}} />
                    <Bar dataKey="completed" fill="#001d3d" radius={[8, 8, 0, 0]} barSize={32} className="dark:fill-brand-teal" />
                    <Bar dataKey="blocked" fill="#ef4444" radius={[8, 8, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <span className="material-symbols-outlined text-5xl">bar_chart_off</span>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-4">Insufficient data for chart</p>
                </div>
              )}
            </div>
          </section>

          <div className="lg:col-span-4 flex flex-col gap-6">
             <section className="bg-brand-navy dark:bg-brand-teal p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden group transition-all border border-slate-700/50">
                <span className="material-symbols-outlined absolute -bottom-10 -right-10 text-[180px] opacity-10 rotate-[25deg] fill-icon">bolt</span>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Team Synergy</h4>
                <p className="text-3xl font-black leading-tight mb-4 relative z-10">Maximize your <br/>operational flow.</p>
                <div className="w-full h-1 bg-white/20 rounded-full mb-2">
                   <div className="w-[85%] h-full bg-white rounded-full"></div>
                </div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Goal: Zero blockers</p>
             </section>

             <section className="bg-brand-gray dark:bg-slate-700/50 p-8 rounded-[2rem] flex-1 flex flex-col justify-center transition-colors border border-slate-200 dark:border-slate-700">
                <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-4 leading-none">Analytics Insight</h4>
                <p className="text-sm font-bold text-brand-navy dark:text-white leading-relaxed italic">
                  "Track the blocked reports ratio to identify team infrastructure needs early."
                </p>
             </section>
          </div>
       </div>
    </div>
  );
};

const StatMetric = ({ label, value, trend, color }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-brand flex flex-col gap-1 transition-all hover:translate-y-[-4px] duration-300">
    <p className="text-[10px] font-black text-slate-300 dark:text-slate-500 uppercase tracking-widest leading-none">{label}</p>
    <p className={`text-3xl font-black ${color || "text-primary dark:text-white"}`}>{value || "0"}</p>
    <p className={`text-[10px] font-black opacity-40 uppercase tracking-widest mt-1 leading-none`}>{trend || ""}</p>
  </div>
);

export default Stats;
