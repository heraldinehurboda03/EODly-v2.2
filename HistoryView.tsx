
import React from 'react';
import { Report } from '../types';

interface HistoryViewProps {
  reports: Report[];
  highlightQuery?: string;
  onDelete?: (id: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ reports, highlightQuery, onDelete }) => {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20 max-w-6xl mx-auto">
       <div className="flex items-center gap-4 mb-4 px-1">
          <div className="bg-primary size-10 rounded-xl flex items-center justify-center shadow-lg border border-primary/20">
             <span className="material-symbols-outlined text-white text-xl fill-icon">history</span>
          </div>
          <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">EOD History</h1>
       </div>

       <div className="flex flex-col gap-8">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 opacity-30">
              <span className="material-symbols-outlined text-8xl">event_busy</span>
              <p className="mt-4 font-black uppercase tracking-widest text-sm">No Logs Found</p>
            </div>
          ) : (
            reports.map(report => (
              <HistoryCard key={report.id} report={report} highlight={highlightQuery} onDelete={onDelete} />
            ))
          )}
       </div>
    </div>
  );
};

const HighlightText: React.FC<{ text: string; highlight?: string }> = ({ text, highlight }) => {
  if (!highlight || !highlight.trim()) return <span>{text}</span>;
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() 
          ? <span key={i} className="bg-yellow-200 dark:bg-yellow-800 text-black px-0.5 rounded shadow-sm font-bold border border-yellow-300">{part}</span> 
          : part
      )}
    </span>
  );
};

const HistoryCard: React.FC<{ report: Report; highlight?: string; onDelete?: (id: string) => void }> = ({ report, highlight, onDelete }) => {
  const dateObj = new Date(report.date);
  const month = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = dateObj.getDate();
  const yearDay = `${dateObj.getFullYear()} ${dateObj.toLocaleString('default', { weekday: 'long' })}`;
  const timeSubmittedValue = new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onDelete) {
      onDelete(report.id);
    }
  };

  const hasAttachments = (report.links && report.links.filter(l => l.trim() !== '').length > 0) || (report.files && report.files.length > 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 shadow-sm border border-slate-300 dark:border-slate-700 transition-all hover:shadow-brand group animate-in slide-in-from-bottom-4 duration-300 relative">
       
       <button 
          onClick={handleDelete}
          className="absolute top-8 right-8 size-10 rounded-2xl bg-brand-gray dark:bg-slate-700 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100"
          title="Move to Trash"
       >
          <span className="material-symbols-outlined text-xl">delete</span>
       </button>

       <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1 space-y-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className="flex flex-col items-center justify-center bg-brand-gray dark:bg-slate-700 size-16 rounded-2xl shadow-sm border border-slate-300 dark:border-slate-600 shrink-0">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{month}</span>
                      <span className="text-2xl font-black text-primary dark:text-white leading-none">{day}</span>
                   </div>
                   <div className="space-y-3">
                      <h3 className="text-2xl font-black text-primary dark:text-white tracking-tight leading-none">
                        <HighlightText text={yearDay} highlight={highlight} />
                      </h3>
                      <div className="flex flex-wrap gap-2 items-center">
                         <span className="bg-[#f1f5f9] dark:bg-slate-700 text-primary dark:text-slate-300 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-slate-200 dark:border-transparent">
                            {timeSubmittedValue}
                         </span>
                         <span className="bg-[#f1f5f9] dark:bg-slate-700 text-primary dark:text-slate-300 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-slate-200 dark:border-transparent">
                            <HighlightText text={report.userName.toUpperCase()} highlight={highlight} />
                         </span>
                         {report.userMbti && (
                           <span className="bg-primary dark:bg-white text-white dark:text-primary text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-transparent shadow-sm">
                             {report.userMbti}
                           </span>
                         )}
                      </div>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <div className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">SHIFT LOG</h4>
                      <div className="flex flex-col gap-3">
                        <div className="bg-[#f8fafc] dark:bg-slate-700/50 rounded-2xl p-6 border border-slate-300 dark:border-slate-700 flex items-center gap-3 shadow-sm">
                           <span className="material-symbols-outlined text-blue-600 fill-icon text-lg">schedule</span>
                           <span className="text-sm font-black text-primary dark:text-white uppercase tracking-tight">{report.workHours.start} – {report.workHours.end}</span>
                        </div>
                        
                        {report.breaks && report.breaks.length > 0 && (
                          <div className="px-4 py-2">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Break Intervals</p>
                             <div className="flex flex-wrap gap-2">
                               {report.breaks.map((b) => (
                                 <span key={b.id} className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700/80 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                                   {b.start} - {b.end}
                                 </span>
                               ))}
                             </div>
                          </div>
                        )}
                      </div>
                   </div>

                   {hasAttachments && (
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">REFERENCES & ATTACHMENTS</h4>
                        <div className="flex flex-wrap gap-2">
                           {report.links?.filter(l => l.trim() !== '').map((link, idx) => (
                              <a 
                                key={idx} 
                                href={link.startsWith('http') ? link : `https://${link}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all"
                              >
                                 <span className="material-symbols-outlined text-sm">link</span>
                                 Open Link
                              </a>
                           ))}
                           {report.files?.map((file, idx) => (
                              <div 
                                key={idx} 
                                className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-600"
                              >
                                 <span className="material-symbols-outlined text-sm">description</span>
                                 {file.name}
                              </div>
                           ))}
                        </div>
                     </div>
                   )}
                </div>

                <div className="space-y-4">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
                      <span className="size-1.5 bg-blue-600 rounded-full"></span> ACCOMPLISHMENTS & PLAN
                   </h4>
                   <div className="bg-[#f8fafc] dark:bg-slate-700/50 rounded-[2rem] p-8 min-h-[160px] border border-slate-300 dark:border-slate-700 shadow-sm flex flex-col gap-6">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Achievements</span>
                        <p className="text-sm font-semibold text-primary/80 dark:text-slate-300 leading-relaxed italic">
                          • <HighlightText text={report.content} highlight={highlight} />
                        </p>
                      </div>

                      {report.planForTomorrow && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                           <span className="text-[10px] font-black text-green-600 uppercase block tracking-widest">Plan for Tomorrow</span>
                           <p className="text-sm font-semibold text-green-700 dark:text-green-400 leading-relaxed">
                             • <HighlightText text={report.planForTomorrow} highlight={highlight} />
                           </p>
                        </div>
                      )}

                      {report.blockers && (
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                           <span className="text-[10px] font-black text-red-500 uppercase block tracking-widest">Current Blockers</span>
                           <p className="text-sm font-semibold text-red-600 dark:text-red-400 leading-relaxed">
                             • <HighlightText text={report.blockers} highlight={highlight} />
                           </p>
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default HistoryView;
