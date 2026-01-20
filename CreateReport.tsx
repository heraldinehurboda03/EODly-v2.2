
import React, { useState, useRef, useMemo } from 'react';
import { BreakInterval, User, Report } from '../types';
import { optimizeEODContent } from '../services/gemini';

interface CreateReportProps {
  currentUser: User;
  onCancel: () => void;
  onSubmit: (data: any, isDraft?: boolean) => void;
  reports: Report[];
  onDeleteDraft: (id: string) => void;
}

const TIME_OPTIONS = [
  "--:-- --", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM",
  "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM", "06:00 PM",
  "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM", "12:00 AM"
];

const CreateReport: React.FC<CreateReportProps> = ({ currentUser, onSubmit, reports, onDeleteDraft }) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'DRAFTS'>('NEW');
  // Form State
  const [content, setContent] = useState('');
  const [blockers, setBlockers] = useState('');
  const [plan, setPlan] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('--:-- --');
  const [endTime, setEndTime] = useState('--:-- --');
  const [breaks, setBreaks] = useState<BreakInterval[]>([]);
  const [links, setLinks] = useState<string[]>(['']);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [emailPreview, setEmailPreview] = useState('');
  const [attachments, setAttachments] = useState<{name: string, type: string}[]>([]);
  const [showSyncModal, setShowSyncModal] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const drafts = useMemo(() => reports.filter(r => r.isDraft && r.userId === currentUser.id && !r.isDeleted), [reports, currentUser]);

  const handleAIOptimize = async () => {
    if (!formRef.current?.reportValidity()) return;
    setIsOptimizing(true);
    const optimized = await optimizeEODContent(
      content, 
      blockers, 
      plan, 
      currentUser, 
      { start: startTime, end: endTime }, 
      breaks.map(b => ({ start: b.start, end: b.end })),
      date,
      links.filter(l => l.trim() !== ''),
      attachments
    );
    setEmailPreview(optimized);
    setIsOptimizing(false);
  };

  const handleDispatchClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current?.reportValidity()) return;
    setShowSyncModal(true);
  };

  const handleSaveDraft = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formRef.current?.reportValidity()) return;
    onSubmit({
      content,
      blockers,
      planForTomorrow: plan,
      date,
      start: startTime,
      end: endTime,
      breaks,
      links: links.filter(l => l.trim().length > 0),
      files: attachments,
      optimizedSummary: emailPreview
    }, true);
    resetForm();
  };

  const handleSubmitAction = () => {
    onSubmit({
      content,
      blockers,
      planForTomorrow: plan,
      date,
      start: startTime,
      end: endTime,
      breaks,
      links: links.filter(l => l.trim().length > 0),
      files: attachments,
      optimizedSummary: emailPreview
    }, false);
    
    resetForm();
    setShowSyncModal(false);
  };

  const resetForm = () => {
    setContent('');
    setBlockers('');
    setPlan('');
    setBreaks([]);
    setLinks(['']);
    setStartTime('--:-- --');
    setEndTime('--:-- --');
    setEmailPreview('');
    setAttachments([]);
  };

  const handleSyncToGmail = () => {
    const subject = `EOD Report | ${currentUser.name} – ${date}`;
    const body = emailPreview || content;
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
    handleSubmitAction();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newAttachments = Array.from(files).map((f: File) => ({ name: f.name, type: f.type || 'local' }));
      setAttachments(prev => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-6 animate-in slide-in-from-bottom duration-500 pb-20 max-w-6xl mx-auto">
       <div className="flex items-center gap-2 bg-brand-gray dark:bg-slate-800 p-1.5 rounded-2xl w-fit transition-colors duration-300 border border-slate-300 dark:border-slate-700">
          <button 
            onClick={() => setActiveTab('NEW')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'NEW' ? 'bg-[#0a1128] dark:bg-white text-white dark:text-[#0a1128] shadow-md' : 'text-slate-400 hover:text-primary dark:hover:text-white'}`}
          >
            New Entry
          </button>
          <button 
            onClick={() => setActiveTab('DRAFTS')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'DRAFTS' ? 'bg-[#0a1128] dark:bg-white text-white dark:text-[#0a1128] shadow-md' : 'text-slate-400 hover:text-primary dark:hover:text-white'}`}
          >
            My Drafts
            {drafts.length > 0 && (
              <span className="absolute -top-1 -right-1 size-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">{drafts.length}</span>
            )}
          </button>
       </div>

       {activeTab === 'NEW' ? (
         <form ref={formRef} onSubmit={handleDispatchClick} className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in">
             <div className="lg:col-span-8 space-y-8">
               <section className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-sm transition-colors border border-slate-300 dark:border-slate-700">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">1. SHIFT CONTEXT</h3>

                 <div className="mb-8">
                    <label className="text-xs font-bold text-slate-400 block mb-3">Report Date</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        required 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)} 
                        className="w-full bg-brand-gray dark:bg-slate-700/80 p-5 rounded-2xl text-primary dark:text-white font-bold border border-slate-300 dark:border-slate-600 outline-none appearance-none cursor-pointer"
                      />
                      <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">calendar_today</span>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                   <div>
                      <label className="text-xs font-bold text-slate-400 block mb-3">Start Time</label>
                      <div className="relative">
                        <select required value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full bg-brand-gray dark:bg-slate-700/80 p-5 rounded-2xl text-primary dark:text-white font-bold border border-slate-300 dark:border-slate-600 outline-none appearance-none cursor-pointer">
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">schedule</span>
                      </div>
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-400 block mb-3">End Time</label>
                      <div className="relative">
                        <select required value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full bg-brand-gray dark:bg-slate-700/80 p-5 rounded-2xl text-primary dark:text-white font-bold border border-slate-300 dark:border-slate-600 outline-none appearance-none cursor-pointer">
                          {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">schedule</span>
                      </div>
                   </div>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">BREAK INTERVALS</span>
                   <button type="button" onClick={() => setBreaks([...breaks, { id: Date.now().toString(), start: '--:-- --', end: '--:-- --' }])} className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg uppercase tracking-widest border border-blue-200 dark:border-transparent">+ ADD BREAK</button>
                 </div>
                 <div className="mt-4 space-y-3">
                   {breaks.map((b, i) => (
                      <div key={b.id} className="flex gap-4 items-center animate-in slide-in-from-right duration-200">
                         <select value={b.start} onChange={e => {
                           const nb = [...breaks]; nb[i].start = e.target.value; setBreaks(nb);
                         }} className="flex-1 bg-brand-gray dark:bg-slate-700/50 p-3 rounded-xl border border-slate-300 dark:border-slate-600 text-xs text-primary dark:text-white cursor-pointer">
                           {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                         <span className="text-slate-300 font-bold">→</span>
                         <select value={b.end} onChange={e => {
                           const nb = [...breaks]; nb[i].end = e.target.value; setBreaks(nb);
                         }} className="flex-1 bg-brand-gray dark:bg-slate-700/50 p-3 rounded-xl border border-slate-300 dark:border-slate-600 text-xs text-primary dark:text-white cursor-pointer">
                           {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                         </select>
                         <button type="button" onClick={() => setBreaks(prev => prev.filter(br => br.id !== b.id))} className="text-red-400 hover:text-red-500 transition-colors material-symbols-outlined">delete</button>
                      </div>
                   ))}
                 </div>
               </section>

               <section className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-sm transition-colors border border-slate-300 dark:border-slate-700">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">2. PERFORMANCE UPDATE</h3>
                 <div className="space-y-8">
                   <div>
                     <label className="text-xs font-bold text-slate-400 block mb-3">Key Accomplishments</label>
                     <textarea required value={content} onChange={e => setContent(e.target.value)} placeholder="What did you achieve during this cycle?" className="w-full h-40 bg-brand-gray dark:bg-slate-700/80 p-6 rounded-2xl border border-slate-300 dark:border-slate-600 text-primary dark:text-white outline-none resize-none placeholder-slate-400" />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div>
                       <label className="text-xs font-bold text-red-500 block mb-3">Blockers</label>
                       <textarea value={blockers} onChange={e => setBlockers(e.target.value)} className="w-full h-24 bg-brand-gray dark:bg-slate-700/80 p-4 rounded-xl border border-slate-300 dark:border-slate-600 text-primary dark:text-white outline-none resize-none" />
                     </div>
                     <div>
                       <label className="text-xs font-bold text-green-600 block mb-3">Plan for Tomorrow</label>
                       <textarea value={plan} onChange={e => setPlan(e.target.value)} className="w-full h-24 bg-brand-gray dark:bg-slate-700/80 p-4 rounded-xl border border-slate-300 dark:border-slate-600 text-primary dark:text-white outline-none resize-none" />
                     </div>
                   </div>
                 </div>
               </section>

               <section className="bg-white dark:bg-slate-800 rounded-[2rem] p-8 shadow-sm transition-colors border border-slate-300 dark:border-slate-700">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8">QUICK ATTACH</h3>
                 <div className="space-y-4">
                   {links.map((l, i) => (
                      <div key={i} className="flex gap-2 items-center">
                         <span className="material-symbols-outlined text-blue-600">link</span>
                         <input value={l} onChange={e => {
                           const nl = [...links]; nl[i] = e.target.value; setLinks(nl);
                         }} placeholder="Paste URL or link context..." className="flex-1 bg-brand-gray dark:bg-slate-700/50 p-3 rounded-xl border border-slate-300 dark:border-slate-600 text-xs text-primary dark:text-white" />
                         <button type="button" onClick={() => {
                             const nl = links.filter((_, idx) => idx !== i);
                             setLinks(nl.length ? nl : ['']);
                         }} className="material-symbols-outlined text-red-400 hover:text-red-500 text-base">close</button>
                      </div>
                   ))}
                   
                   {attachments.length > 0 && (
                     <div className="flex flex-wrap gap-2 py-2">
                       {attachments.map((file, idx) => (
                         <div key={idx} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 animate-in zoom-in duration-200">
                           <span className="material-symbols-outlined text-sm text-slate-400">description</span>
                           <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 max-w-[150px] truncate">{file.name}</span>
                           <button type="button" onClick={() => removeAttachment(idx)} className="material-symbols-outlined text-xs text-red-400 hover:text-red-500">close</button>
                         </div>
                       ))}
                     </div>
                   )}

                   <div className="flex gap-4">
                      <button type="button" onClick={() => setLinks([...links, ''])} className="size-12 rounded-2xl bg-brand-gray dark:bg-slate-700 flex items-center justify-center text-primary dark:text-white border border-slate-300 dark:border-slate-600 hover:bg-primary/5 transition-all shadow-sm">
                          <span className="material-symbols-outlined">add</span>
                      </button>
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="h-12 px-6 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-blue-200 dark:border-transparent shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-all">
                         <span className="material-symbols-outlined text-lg">attach_file</span> ATTACH FILES
                      </button>
                      <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                   </div>
                 </div>
               </section>

               <div className="flex flex-col md:flex-row gap-4 mt-8">
                 <button 
                  type="button" 
                  onClick={handleSaveDraft}
                  className="flex-1 h-16 rounded-2xl bg-slate-200 dark:bg-slate-700 text-primary dark:text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-300 dark:hover:bg-slate-600 transition-all active:scale-95 shadow-lg shadow-slate-500/10"
                 >
                    <span className="material-symbols-outlined text-xl">save_as</span>
                    Save as Draft
                 </button>
                 <button type="button" onClick={handleAIOptimize} disabled={isOptimizing} className="flex-1 h-16 rounded-2xl border-2 border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group active:scale-95 shadow-lg shadow-blue-500/10">
                    <span className={`material-symbols-outlined text-xl ${isOptimizing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`}>bolt</span>
                    {isOptimizing ? 'Optimizing...' : 'AI Optimize'}
                 </button>
                 <button type="submit" className="flex-[2] h-16 rounded-2xl bg-primary dark:bg-white text-white dark:text-primary font-black text-sm tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] border border-slate-700/30 hover:bg-primary/95">
                    <span className="material-symbols-outlined">send</span>
                    Dispatch Report
                 </button>
               </div>
             </div>

             <div className="lg:col-span-4">
               <div className="sticky top-24 bg-[#0a1128] p-8 rounded-[2.5rem] text-white min-h-[600px] flex flex-col shadow-2xl overflow-hidden border border-slate-700">
                 <div className="flex items-center gap-2 mb-8 border-b border-white/10 pb-4 relative z-10">
                   <span className="material-symbols-outlined fill-icon text-white">bolt</span>
                   <h3 className="text-[10px] font-black uppercase tracking-[0.2em]">GEMINI OPTIMIZED SUMMARY</h3>
                 </div>
                 <div className="flex-1 overflow-y-auto hide-scrollbar text-sm leading-relaxed text-white/80 font-medium relative z-10 italic">
                   {emailPreview ? <div className="whitespace-pre-wrap">{emailPreview}</div> : (
                      <div className="flex flex-col items-center justify-center h-full text-center opacity-30 px-6 gap-4">
                         <span className="material-symbols-outlined text-4xl">auto_fix_high</span>
                         <p className="uppercase tracking-[0.15em] font-black text-[9px]">Select 'AI Optimize' to polish your report.</p>
                      </div>
                   )}
                 </div>
               </div>
             </div>
         </form>
       ) : (
         <div className="space-y-6 animate-in fade-in">
           {drafts.length === 0 ? (
             <div className="py-32 flex flex-col items-center justify-center opacity-30 text-center">
                <span className="material-symbols-outlined text-7xl mb-4">edit_off</span>
                <p className="font-black uppercase tracking-widest text-sm">No Unsent Drafts</p>
                <button onClick={() => setActiveTab('NEW')} className="mt-4 text-xs font-black text-blue-600 underline">Start a new one</button>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {drafts.map(draft => (
                  <div key={draft.id} className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-6 group relative">
                    <button 
                      onClick={() => onDeleteDraft(draft.id)}
                      className="absolute top-8 right-8 size-10 rounded-2xl bg-brand-gray dark:bg-slate-700 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-brand-gray dark:bg-slate-700 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined">edit_square</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{draft.date}</p>
                        <h4 className="text-lg font-black text-primary dark:text-white leading-none">Shift Draft</h4>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 italic line-clamp-3">"{draft.content}"</p>
                    <button 
                      onClick={() => {
                        setContent(draft.content);
                        setBlockers(draft.blockers || '');
                        setPlan(draft.planForTomorrow || '');
                        setDate(draft.date);
                        setStartTime(draft.workHours.start);
                        setEndTime(draft.workHours.end);
                        setBreaks(draft.breaks || []);
                        setLinks(draft.links || ['']);
                        setEmailPreview(draft.optimizedSummary || '');
                        setAttachments(draft.files || []);
                        setActiveTab('NEW');
                      }}
                      className="w-full py-4 rounded-2xl bg-primary dark:bg-white text-white dark:text-primary text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                    >
                      Resume Entry
                    </button>
                  </div>
                ))}
             </div>
           )}
         </div>
       )}

       {showSyncModal && (
          <div className="fixed inset-0 z-[100] bg-[#0a1128]/80 backdrop-blur-xl flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-10 animate-in zoom-in duration-300 shadow-2xl border border-slate-200 dark:border-slate-700">
                <h2 className="text-3xl font-black text-[#0a1128] dark:text-white text-center mb-2">Dispatch Confirmation</h2>
                <div className="flex flex-col items-center gap-2 mb-10">
                   <p className="text-sm text-slate-400 text-center font-medium px-4">Choose how you would like to complete your report session.</p>
                   <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="material-symbols-outlined text-slate-400 text-base">alternate_email</span>
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">{currentUser.email}</span>
                   </div>
                </div>
                {/* MODIFIED: Visual changed from rectangles to side-by-side squares */}
                <div className="grid grid-cols-2 gap-4">
                   <button onClick={handleSyncToGmail} className="aspect-square flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center group shadow-sm active:scale-[0.98]">
                      <div className={`size-14 rounded-2xl bg-brand-gray dark:bg-slate-700 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform text-red-500 border border-slate-100 dark:border-slate-600`}>G</div>
                      <span className="text-[10px] font-black text-[#0a1128] dark:text-white uppercase tracking-widest">Sync to Gmail</span>
                   </button>
                   <button onClick={handleSubmitAction} className="aspect-square flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center group shadow-sm active:scale-[0.98]">
                      <div className={`size-14 rounded-2xl bg-brand-gray dark:bg-slate-700 flex items-center justify-center font-black text-xl group-hover:scale-110 transition-transform text-green-500 border border-slate-100 dark:border-slate-600`}>
                        <span className="material-symbols-outlined text-3xl">check_circle</span>
                      </div>
                      <span className="text-[10px] font-black text-[#0a1128] dark:text-white uppercase tracking-widest">Submit App</span>
                   </button>
                </div>
                <button onClick={() => setShowSyncModal(false)} className="w-full mt-10 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] hover:text-[#0a1128] dark:hover:text-white transition-colors">Cancel & Edit</button>
             </div>
          </div>
       )}
    </div>
  );
};

export default CreateReport;
