import { useState } from 'react';
import DOMPurify from 'isomorphic-dompurify';
import { Reply, Archive, Trash2, Paperclip, FileText, Download, Mail } from 'lucide-react';

// Local Tooltip for the action buttons
function Tooltip({ children, text }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    let x = e.clientX + 15;
    let y = e.clientY + 15;
    if (x + 180 > window.innerWidth) x = e.clientX - 180; 
    if (y + 40 > window.innerHeight) y = e.clientY - 40;  
    setPos({ x, y });
  };

  return (
    <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onMouseMove={handleMouseMove} className="inline-flex">
      {children}
      {show && (
        <div style={{ top: pos.y, left: pos.x }} className="fixed z-[9999] px-2.5 py-1.5 bg-slate-800 text-xs font-medium text-slate-200 rounded-md shadow-xl border border-slate-700 pointer-events-none whitespace-nowrap">
          {text}
        </div>
      )}
    </div>
  );
}

export default function ReadingPane({ 
  selectedEmail, 
  handleReply, 
  handleBulkAction, 
  setSelectedIds 
}) {
  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(dateString));
  };

  if (!selectedEmail) {
    return (
      <main className="flex-1 bg-slate-950 flex flex-col relative z-0 hidden sm:flex items-center justify-center text-slate-500">
        <Mail className="w-16 h-16 text-slate-800 mb-4" />
        <p>Select a message to view</p>
      </main>
    );
  }

  return (
    <main className="flex-1 bg-slate-950 flex flex-col relative z-0 hidden sm:flex">
      {/* 1. ACTION BAR */}
      <div className="h-16 flex items-center justify-between px-8 border-b border-slate-800 bg-slate-900/50 shrink-0">
        <div className="flex space-x-2">
          <Tooltip text="Reply to Sender">
            <button onClick={handleReply} className="p-2 hover:bg-slate-800 active:scale-90 rounded-md text-slate-400 hover:text-blue-400 transition-all">
              <Reply size={18} />
            </button>
          </Tooltip>
          <Tooltip text="Move to Archive">
            <button onClick={() => { setSelectedIds(new Set([selectedEmail.gmailId])); handleBulkAction('archive'); }} className="p-2 hover:bg-slate-800 active:scale-90 rounded-md text-slate-400 hover:text-slate-200 transition-all">
              <Archive size={18} />
            </button>
          </Tooltip>
          <Tooltip text="Permanently Delete">
            <button onClick={() => { setSelectedIds(new Set([selectedEmail.gmailId])); handleBulkAction('trash'); }} className="p-2 hover:bg-red-900/30 active:scale-90 rounded-md text-slate-400 hover:text-red-400 transition-all">
              <Trash2 size={18} />
            </button>
          </Tooltip>
        </div>
      </div>
      
      {/* 2. EMAIL CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold text-slate-100 mb-6 tracking-tight">
            {selectedEmail.subject}
          </h1>
          
          {/* Sender Details */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800/80">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg mr-4">
                {(selectedEmail.from.name || selectedEmail.from.address).charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-200">
                  {selectedEmail.from.name} <span className="text-slate-500 font-normal ml-1">&lt;{selectedEmail.from.address}&gt;</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  To: {selectedEmail.to.map(t => t.name || t.address).join(', ') || 'me'}
                </div>
              </div>
            </div>
            <div className="text-xs text-slate-500 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              {formatDate(selectedEmail.dateReceived)}
            </div>
          </div>

          {/* Secure HTML Injection */}
          <div 
            className="prose prose-invert prose-blue max-w-none text-slate-300 text-sm leading-relaxed overflow-hidden" 
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selectedEmail.bodyHtml || selectedEmail.bodyText.replace(/\n/g, '<br />')) }} 
          />
          
          {/* 3. ATTACHMENTS VIEWER */}
          {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
            <div className="mt-12 pt-6 border-t border-slate-800">
              <h3 className="text-sm font-medium text-slate-400 mb-4 flex items-center">
                <Paperclip size={14} className="mr-2" /> 
                Attachments ({selectedEmail.attachments.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {selectedEmail.attachments.map((file, idx) => (
                  <div key={idx} className="bg-slate-900 border border-slate-700 p-3 rounded-lg flex items-center justify-between group hover:border-blue-500 transition-colors cursor-pointer">
                    <div className="flex items-center overflow-hidden">
                      <FileText size={20} className="text-blue-400 mr-3 shrink-0" />
                      <span className="text-xs text-slate-200 truncate">{file.filename || `Document_${idx+1}`}</span>
                    </div>
                    <Download size={16} className="text-slate-500 group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}