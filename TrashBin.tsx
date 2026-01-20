
import React, { useState } from 'react';
import { Report } from '../types';

interface TrashBinProps {
  reports: Report[];
  onRestore: (id: string) => void;
  onEmptyTrash: () => void;
  onBack: () => void;
}

const TrashBin: React.FC<TrashBinProps> = ({ reports, onRestore, onEmptyTrash, onBack }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  const handleRestoreClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    onRestore(id);
  };

  const handleEmptyConfirmed = () => {
    onEmptyTrash();
    setShowConfirmModal(false);
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div className="flex items-center gap-5">
             <button 
                onClick={onBack} 
                className="size-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-primary dark:text-white shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-90"
                title="Go Back"
             >
                <span className="material-symbols-outlined text-2xl">arrow_back</span>
             </button>
             <div>
                <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight leading-none">Trash Bin</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                  Items are purged automatically after 30 days
                </p>
             </div>
          </div>

          {reports.length > 0 && (
            <button 
              onClick={() => setShowConfirmModal(true)}
              className="px-6 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all flex items-center justify-center gap-3 shadow-sm active:scale-95 font-black text-[10px] uppercase tracking-widest"
            >
              <span className="material-symbols-outlined text-xl">delete_forever</span>
              Empty Trash
            </button>
          )}
       </header>

       <div className="flex flex-col gap-4">
          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-40 opacity-20 text-center animate-in zoom-in">
              <span className="material-symbols-outlined text-[120px] mb-6">delete_sweep</span>
              <p className="font-black text-lg uppercase tracking-widest">Trash is empty</p>
              <p className="text-[10px] font-bold mt-2 uppercase opacity-60">Deleted records stay here for 30 days unless restored.</p>
            </div>
          ) : (
            reports.map(report => (
              <div 
                 key={report.id} 
                 className="bg-white dark:bg-slate-800 p-7 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between group hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-600 transition-all animate-in slide-in-from-right duration-300"
              >
                 <div className="flex items-center gap-6 overflow-hidden">
                   <div className="size-16 rounded-[1.25rem] bg-brand-gray dark:bg-slate-700 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-600 shrink-0">
                     <span className="material-symbols-outlined text-3xl">
                       {report.isDraft ? 'edit_note' : 'history'}
                     </span>
                   </div>
                   <div className="overflow-hidden">
                     <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{report.date}</span>
                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${
                          report.isDraft 
                            ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800'
                        }`}>
                           {report.isDraft ? 'Draft' : 'Log'}
                        </span>
                     </div>
                     <p className="text-sm font-bold text-primary dark:text-white truncate italic max-w-lg opacity-80">"{report.content}"</p>
                   </div>
                 </div>
                 
                 <div className="flex gap-4 shrink-0 ml-6">
                   <button 
                     onClick={(e) => handleRestoreClick(e, report.id)} 
                     type="button"
                     className="px-6 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 font-black text-[10px] uppercase tracking-widest" 
                     title="Restore to History"
                   >
                     <span className="material-symbols-outlined text-xl">settings_backup_restore</span>
                     Restore
                   </button>
                 </div>
              </div>
            ))
          )}
       </div>

       {showConfirmModal && (
          <div className="fixed inset-0 z-[100] bg-[#0a1128]/80 backdrop-blur-xl flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-10 animate-in zoom-in duration-300 shadow-2xl border border-slate-200 dark:border-slate-700 text-center">
                <div className="size-20 rounded-[2rem] bg-red-50 dark:bg-red-950/20 text-red-600 mx-auto mb-6 flex items-center justify-center shadow-lg">
                   <span className="material-symbols-outlined text-4xl">warning</span>
                </div>
                <h2 className="text-3xl font-black text-[#0a1128] dark:text-white mb-3">Permanently delete?</h2>
                <p className="text-sm text-slate-400 font-medium px-4 mb-10 leading-relaxed">
                  You are about to clear all items in your trash. This action <span className="text-red-500 font-bold uppercase tracking-widest text-[10px]">cannot be undone</span>.
                </p>
                <div className="grid grid-cols-2 gap-4">
                   <button 
                      onClick={() => setShowConfirmModal(false)} 
                      className="h-16 rounded-2xl border border-slate-200 dark:border-slate-800 text-primary dark:text-white text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
                   >
                      Keep Items
                   </button>
                   <button 
                      onClick={handleEmptyConfirmed}
                      className="h-16 rounded-2xl bg-red-600 text-white text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all hover:bg-red-700"
                   >
                      Yes, Empty Trash
                   </button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default TrashBin;
