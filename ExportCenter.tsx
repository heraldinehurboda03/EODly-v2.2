
import React, { useState, useMemo } from 'react';
import { Report, User } from '../types';

interface ExportCenterProps {
  currentUser: User;
  reports: Report[];
  allUsers: User[];
  onExport: (format: string) => void;
  onBack: () => void;
}

const ExportCenter: React.FC<ExportCenterProps> = ({ currentUser, reports, allUsers, onExport, onBack }) => {
  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'Excel' | 'Google Docs'>('PDF');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [isRangeMode, setIsRangeMode] = useState(false);
  
  const today = new Date();
  const [startDate, setStartDate] = useState<string>(today.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(today.toISOString().split('T')[0]);

  const filteredReports = useMemo(() => {
    let list = reports.filter(r => !r.isDraft);
    if (selectedUserId !== 'all') {
      list = list.filter(r => r.userId === selectedUserId);
    }
    
    list = list.filter(r => {
      if (isRangeMode) {
        return r.date >= startDate && r.date <= endDate;
      }
      return r.date === startDate;
    });
    return list;
  }, [reports, selectedUserId, startDate, endDate, isRangeMode]);

  const orderedUsers = useMemo(() => {
    const others = allUsers.filter(u => u.id !== currentUser.id);
    const me = allUsers.find(u => u.id === currentUser.id);
    return me ? [me, ...others] : others;
  }, [allUsers, currentUser]);

  const handleDownload = () => {
    if (filteredReports.length === 0) {
      alert("No submitted EOD records found for the selected date(s).");
      return;
    }

    const exportDateRange = isRangeMode ? `${startDate}_to_${endDate}` : startDate;
    
    if (selectedFormat === 'Excel') {
      const filename = `EODly_Report_${exportDateRange}.csv`;
      const headers = ["Date", "Member", "MBTI", "Shift Start", "Shift End", "Break Log", "Achievements", "Blockers", "Plan for Tomorrow", "Links", "Files"];
      
      const csvRows = [
        headers.join(","),
        ...filteredReports.map(r => {
          const breakLog = r.breaks?.map(b => `${b.start}-${b.end}`).join(" | ") || "None";
          const links = r.links?.join(" | ") || "None";
          const files = r.files?.map(f => f.name).join(" | ") || "None";
          
          // Escape quotes for CSV safety
          const escape = (str: string = "") => `"${str.replace(/"/g, '""')}"`;
          
          return [
            r.date,
            escape(r.userName),
            r.userMbti || "N/A",
            r.workHours.start,
            r.workHours.end,
            escape(breakLog),
            escape(r.content),
            escape(r.blockers),
            escape(r.planForTomorrow),
            escape(links),
            escape(files)
          ].join(",");
        })
      ];

      // Add UTF-8 BOM for Excel compatibility
      const blob = new Blob(["\ufeff" + csvRows.join("\n")], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (selectedFormat === 'Google Docs') {
        const filename = `EODly_GoogleDoc_${exportDateRange}.html`;
        let content = `<html><body style="font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; max-width: 800px; margin: 0 auto;">`;
        content += `<h1 style="color: #001d3d; text-align: center; border-bottom: 2px solid #001d3d; padding-bottom: 10px;">EODly Team Summary</h1>`;
        content += `<p style="text-align: right; color: #666;"><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</p>`;
        filteredReports.forEach(r => {
           content += `<div style="margin-bottom: 40px; border: 1px solid #eee; padding: 25px; border-radius: 12px; background: #fafafa;">`;
           content += `<h2 style="color: #001d3d; margin-top: 0;">${r.userName} (${r.userMbti || 'N/A'})</h2>`;
           content += `<p><strong>Date:</strong> ${r.date} | <strong>Shift:</strong> ${r.workHours.start} - ${r.workHours.end}</p>`;
           content += `<h3 style="border-left: 4px solid #001d3d; padding-left: 10px;">Achievements</h3><p>${r.content}</p>`;
           if (r.blockers) content += `<h3 style="border-left: 4px solid #ef4444; padding-left: 10px; color: #ef4444;">Blockers</h3><p>${r.blockers}</p>`;
           if (r.planForTomorrow) content += `<h3 style="border-left: 4px solid #10b981; padding-left: 10px; color: #10b981;">Plan for Tomorrow</h3><p>${r.planForTomorrow}</p>`;
           if (r.links && r.links.length > 0) content += `<h3>Links</h3><p>${r.links.map(l => `<a href="${l}">${l}</a>`).join('<br/>')}</p>`;
           if (r.files && r.files.length > 0) content += `<h3>Attachments</h3><p>${r.files.map(f => f.name).join(', ')}</p>`;
           content += `</div>`;
        });
        content += `</body></html>`;

        const blob = new Blob([content], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
    } else {
      // PDF Export
      const filename = `EODly_PDF_Report_${exportDateRange}.html`;
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <title>EODly Export - ${exportDateRange}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a202c; line-height: 1.5; background: #f8fafc; }
              .container { max-width: 900px; margin: 0 auto; background: white; padding: 50px; border-radius: 30px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
              .header { border-bottom: 4px solid #001d3d; padding-bottom: 20px; margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
              .header h2 { margin: 0; color: #001d3d; font-size: 32px; font-weight: 900; }
              .header .range { font-weight: 800; font-size: 14px; color: #5e888d; text-transform: uppercase; }
              .report-card { border: 1px solid #e2e8f0; border-radius: 20px; padding: 30px; margin-bottom: 30px; background: #ffffff; }
              .meta-row { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
              .pill { background: #f1f5f9; color: #001d3d; padding: 6px 14px; border-radius: 99px; font-size: 11px; font-weight: 800; text-transform: uppercase; border: 1px solid #e2e8f0; }
              .section-title { font-size: 10px; font-weight: 900; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; margin: 20px 0 8px 0; }
              .content { font-size: 14px; color: #334155; white-space: pre-wrap; background: #fcfcfc; padding: 15px; border-radius: 12px; border: 1px solid #f1f5f9; }
              @media print {
                body { background: white; padding: 0; }
                .container { box-shadow: none; border-radius: 0; padding: 0; }
                .report-card { page-break-inside: avoid; border: 1px solid #eee; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>EODly Export</h2>
                <div class="range">Period: ${startDate} ${isRangeMode ? 'to ' + endDate : ''}</div>
              </div>
              ${filteredReports.map(r => `
                <div class="report-card">
                  <div class="meta-row">
                    <span class="pill">${r.date}</span>
                    <span class="pill">${r.userName}</span>
                    <span class="pill">MBTI: ${r.userMbti || 'N/A'}</span>
                    <span class="pill">Shift: ${r.workHours.start} - ${r.workHours.end}</span>
                  </div>
                  <div class="section-title">Key Accomplishments</div>
                  <div class="content">${r.content}</div>
                  ${r.blockers ? `
                    <div class="section-title" style="color: #ef4444">Current Blockers</div>
                    <div class="content" style="color: #b91c1c; background: #fff5f5;">${r.blockers}</div>
                  ` : ''}
                  ${r.planForTomorrow ? `
                    <div class="section-title" style="color: #10b981">Plan for Tomorrow</div>
                    <div class="content" style="color: #065f46; background: #f0fdf4;">${r.planForTomorrow}</div>
                  ` : ''}
                  ${(r.links && r.links.filter(l => l.trim() !== '').length > 0) ? `
                    <div class="section-title">Reference Links</div>
                    <div class="content">${r.links.filter(l => l.trim() !== '').map(l => `<a href="${l.startsWith('http') ? l : 'https://' + l}" style="color: #3b82f6; text-decoration: none;">${l}</a>`).join('<br/>')}</div>
                  ` : ''}
                  ${(r.files && r.files.length > 0) ? `
                    <div class="section-title">Attachments</div>
                    <div class="content">${r.files.map(f => f.name).join(', ')}</div>
                  ` : ''}
                </div>
              `).join('')}
              <div style="text-align: center; color: #94a3b8; font-size: 10px; font-weight: 800; margin-top: 50px; text-transform: uppercase; letter-spacing: 2px;">
                Generated by EODly Dashboard &bull; ${new Date().toLocaleDateString()}
              </div>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    onExport(selectedFormat);
  };

  const daysInMonth = useMemo(() => {
    const d = new Date(startDate || today.toISOString());
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    return { firstDay, lastDate, year, month };
  }, [startDate]);

  const handleDayClick = (day: number) => {
    const dateStr = `${daysInMonth.year}-${(daysInMonth.month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    if (!isRangeMode) {
      setStartDate(dateStr);
    } else {
       if (dateStr < startDate) { setEndDate(startDate); setStartDate(dateStr); }
       else { setEndDate(dateStr); }
    }
  };

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto">
       <header className="flex items-center gap-4 px-1">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-primary dark:text-white">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">Export Control</h1>
       </header>

       <section className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-10 shadow-sm border border-slate-300 dark:border-slate-700">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">SELECT DATE RANGE</h3>
             <button onClick={() => setIsRangeMode(!isRangeMode)} className={`size-10 rounded-full flex items-center justify-center transition-all ${isRangeMode ? 'bg-[#0a1128] text-white rotate-45 shadow-lg' : 'bg-brand-gray text-slate-400'}`}>
                <span className="material-symbols-outlined">add</span>
             </button>
          </div>
          
          <div className="grid grid-cols-7 gap-3 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest mb-6">
             {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}
             {Array.from({length: daysInMonth.firstDay}).map((_, i) => <div key={`e-${i}`} />)}
             {Array.from({length: daysInMonth.lastDate}).map((_, i) => {
               const day = i + 1;
               const dateStr = `${daysInMonth.year}-${(daysInMonth.month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
               const selected = dateStr === startDate || (isRangeMode && dateStr === endDate);
               const inRange = isRangeMode && dateStr > startDate && dateStr < endDate;
               return (
                 <button key={day} onClick={() => handleDayClick(day)} className={`h-12 w-full rounded-2xl font-black transition-all ${selected ? 'bg-[#0a1128] dark:bg-white text-white dark:text-[#0a1128]' : inRange ? 'bg-[#0a1128]/5 dark:bg-white/10 text-primary dark:text-white' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-400'}`}>
                   {day}
                 </button>
               );
             })}
          </div>

          <div className="flex justify-center gap-4 bg-[#f1f5f9] dark:bg-slate-700/50 p-3 rounded-2xl">
             <div className="flex flex-col gap-1 items-center px-4">
                <span className="text-[8px] font-black text-slate-400 uppercase">Start</span>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent text-[11px] font-black uppercase tracking-widest rounded-xl text-primary dark:text-white border-none outline-none" />
             </div>
             {isRangeMode && (
               <>
                 <span className="text-slate-300 font-black self-center">→</span>
                 <div className="flex flex-col gap-1 items-center px-4">
                    <span className="text-[8px] font-black text-slate-400 uppercase">End</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent text-[11px] font-black uppercase tracking-widest rounded-xl text-primary dark:text-white border-none outline-none" />
                 </div>
               </>
             )}
          </div>
       </section>

       <section>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">FILTER PERSONNEL</h3>
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2">
             <PersonnelFilterButton active={selectedUserId === 'all'} onClick={() => setSelectedUserId('all')} icon="group" label="ALL MEMBERS" />
             {orderedUsers.map(user => (
               <PersonnelFilterButton 
                  key={user.id} 
                  active={selectedUserId === user.id} 
                  onClick={() => setSelectedUserId(user.id)} 
                  label={user.name.split(' ')[0].toUpperCase()}
                  initials={user.name.split(' ').map(n => n[0]).join('')}
               />
             ))}
          </div>
       </section>

       <section>
          <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 px-1">EXPORT FORMAT</h3>
          <div className="grid grid-cols-3 gap-6">
             <FormatCard active={selectedFormat === 'PDF'} onClick={() => setSelectedFormat('PDF')} icon="picture_as_pdf" label="PDF REPORT" />
             <FormatCard active={selectedFormat === 'Excel'} onClick={() => setSelectedFormat('Excel')} icon="table_chart" label="EXCEL CSV" />
             <FormatCard active={selectedFormat === 'Google Docs'} onClick={() => setSelectedFormat('Google Docs')} icon="description" label="GOOGLE DOCS" />
          </div>
       </section>

       <button onClick={handleDownload} className="w-full h-20 rounded-[2rem] bg-[#0a1128] dark:bg-white text-white dark:text-[#0a1128] font-black text-sm uppercase tracking-[0.25em] shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-[0.98]">
         <span className="material-symbols-outlined text-2xl">download</span>
         COMPILE & DOWNLOAD RECORDS
       </button>
    </div>
  );
};

const FormatCard = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[2.5rem] transition-all border-2 ${active ? 'bg-[#0a1128] dark:bg-white border-[#0a1128] dark:border-white text-white dark:text-[#0a1128] shadow-xl' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-300'}`}>
     <span className={`material-symbols-outlined text-4xl ${active ? 'fill-icon' : ''}`}>{icon}</span>
     <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const PersonnelFilterButton = ({ active, onClick, icon, initials, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 border-2 ${active ? 'bg-[#0a1128] dark:bg-white text-white dark:text-[#0a1128] border-[#0a1128] dark:border-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'}`}>
     {initials ? <div className="size-8 rounded-full bg-[#0a1128] dark:bg-slate-600 text-white flex items-center justify-center text-[10px] font-black">{initials}</div> : <span className="material-symbols-outlined text-xl">{icon}</span>}
     {label}
  </button>
);

export default ExportCenter;
