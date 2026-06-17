import { useState } from 'react';
import { X, Trash2, ChevronDown, Bold, Italic, Strikethrough, Paperclip, FileText } from 'lucide-react';

// Local Tooltip for the compose action buttons
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

export default function ComposeModal({
  setIsComposeOpen,
  composeData,
  setComposeData,
  showSenderSuggestions,
  setShowSenderSuggestions,
  filteredSenders,
  showSuggestions,
  setShowSuggestions,
  filteredContacts,
  showCcBcc,
  setShowCcBcc,
  handleFileUpload,
  removeAttachment,
  applyFormat,
  handleSendEmail,
  isSending,
  editorRef
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6 bg-black/40 backdrop-blur-sm">
      <div className="bg-slate-900 w-full sm:max-w-2xl rounded-xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-300 h-[80vh]">
        
        {/* MODAL HEADER */}
        <div className="bg-slate-800 px-4 py-3 flex justify-between items-center border-b border-slate-700">
          <span className="text-sm font-semibold text-slate-200">New Message</span>
          <Tooltip text="Discard Draft">
            <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-slate-100 p-1 rounded-md">
              <X size={18} />
            </button>
          </Tooltip>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSendEmail} className="flex flex-col flex-1 overflow-y-auto">
          
          {/* SMART FROM FIELD */}
          <div className="relative border-b border-slate-800 z-30">
            <div className="flex items-center px-4 py-2 bg-slate-950/30">
              <span className="text-slate-500 w-12 text-sm font-medium">From:</span>
              <div className="flex items-center flex-1">
                <input 
                  type="text" required value={composeData.fromPrefix} 
                  onFocus={() => setShowSenderSuggestions(true)} 
                  onBlur={() => setTimeout(() => setShowSenderSuggestions(false), 200)} 
                  onChange={(e) => setComposeData({...composeData, fromPrefix: e.target.value.replace(/[@\s]/g, '')})} 
                  className="bg-transparent text-sm text-blue-400 placeholder-slate-600 focus:outline-none font-semibold w-auto max-w-[150px] text-right" 
                />
                <span className="text-slate-400 text-sm ml-0.5 select-none">@hemantpandey.in</span>
              </div>
            </div>
            {/* Sender Dropdown */}
            {showSenderSuggestions && filteredSenders.length > 0 && (
              <div className="absolute left-16 right-4 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-h-44 overflow-y-auto divide-y divide-slate-700/50">
                {filteredSenders.map((sender, index) => (
                  <div key={index} onClick={() => setComposeData({...composeData, fromPrefix: sender})} className="px-4 py-2.5 text-xs text-slate-300 hover:bg-blue-600 hover:text-white cursor-pointer font-medium flex justify-between">
                    <span>{sender}<span className="text-slate-400 hover:text-white/70">@hemantpandey.in</span></span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SMART TO FIELD */}
          <div className="relative border-b border-slate-800 z-20 flex items-center pr-4">
            <div className="flex items-center px-4 py-3 bg-transparent flex-1">
              <span className="text-slate-500 w-12 text-sm font-medium">To:</span>
              <input 
                type="email" required placeholder="recipient@domain.com" 
                value={composeData.to} 
                onFocus={() => setShowSuggestions(true)} 
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
                onChange={(e) => setComposeData({...composeData, to: e.target.value})} 
                className="w-full bg-transparent text-sm text-slate-200 focus:outline-none" 
              />
            </div>
            <button type="button" onClick={() => setShowCcBcc(!showCcBcc)} className="text-xs font-medium text-slate-400 hover:text-blue-400">
              Cc / Bcc
            </button>
            {/* Contact Dropdown */}
            {showSuggestions && composeData.to && filteredContacts.length > 0 && (
              <div className="absolute left-16 right-4 top-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-h-44 overflow-y-auto divide-y divide-slate-700/50">
                {filteredContacts.map((contact, index) => (
                  <div key={index} onClick={() => setComposeData({...composeData, to: contact})} className="px-4 py-2.5 text-xs text-slate-300 hover:bg-blue-600 hover:text-white cursor-pointer">
                    {contact}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CC / BCC FIELDS */}
          {showCcBcc && (
            <>
              <div className="flex items-center border-b border-slate-800 px-4 py-2 bg-slate-950/20">
                <span className="text-slate-500 w-12 text-xs font-medium">Cc:</span>
                <input type="text" placeholder="email1@domain.com, email2@domain.com" value={composeData.cc} onChange={(e) => setComposeData({...composeData, cc: e.target.value})} className="w-full bg-transparent text-sm text-slate-300 focus:outline-none" />
              </div>
              <div className="flex items-center border-b border-slate-800 px-4 py-2 bg-slate-950/20">
                <span className="text-slate-500 w-12 text-xs font-medium">Bcc:</span>
                <input type="text" placeholder="Auto-BCCs to hellohemantpandey@gmail.com" value={composeData.bcc} onChange={(e) => setComposeData({...composeData, bcc: e.target.value})} className="w-full bg-transparent text-sm text-slate-300 focus:outline-none placeholder-slate-600" />
              </div>
            </>
          )}

          {/* SUBJECT */}
          <input type="text" placeholder="Subject Line" value={composeData.subject} onChange={(e) => setComposeData({...composeData, subject: e.target.value})} className="w-full bg-transparent border-b border-slate-800 px-4 py-3 text-sm text-slate-200 focus:outline-none font-medium" />

          {/* RICH TEXT TOOLBAR */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800 bg-slate-900/80">
            <Tooltip text="Bold"><button type="button" onClick={() => applyFormat('bold')} className="p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded"><Bold size={16} /></button></Tooltip>
            <Tooltip text="Italic"><button type="button" onClick={() => applyFormat('italic')} className="p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded"><Italic size={16} /></button></Tooltip>
            <Tooltip text="Strikethrough"><button type="button" onClick={() => applyFormat('strikeThrough')} className="p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded"><Strikethrough size={16} /></button></Tooltip>
            <div className="w-px h-4 bg-slate-700 mx-2"></div>
            <Tooltip text="Attach File">
              <label className="p-1.5 text-slate-400 hover:bg-slate-700 hover:text-slate-200 rounded cursor-pointer flex items-center">
                <Paperclip size={16} />
                <input type="file" multiple onChange={handleFileUpload} className="hidden" />
              </label>
            </Tooltip>
          </div>

          {/* THE EDITOR */}
          <div ref={editorRef} contentEditable className="w-full flex-1 bg-transparent px-4 py-4 text-sm text-slate-200 focus:outline-none overflow-y-auto leading-relaxed min-h-[150px]" data-placeholder="Write your message..." />

          {/* ATTACHMENTS TRAY */}
          {composeData.attachments.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-800 bg-slate-950/50 flex flex-wrap gap-2">
              {composeData.attachments.map((att, idx) => (
                <div key={idx} className="flex items-center bg-slate-800 rounded px-2 py-1 border border-slate-700">
                  <FileText size={12} className="text-slate-400 mr-2" />
                  <span className="text-xs text-slate-300 max-w-[150px] truncate">{att.filename}</span>
                  <span className="text-[10px] text-slate-500 ml-2 mr-2">{att.size}MB</span>
                  <button type="button" onClick={() => removeAttachment(idx)} className="text-slate-500 hover:text-red-400"><X size={12} /></button>
                </div>
              ))}
            </div>
          )}
          
          {/* SEND/DISCARD FOOTER */}
          <div className="bg-slate-950/80 px-4 py-3 flex justify-between items-center border-t border-slate-800">
            <button type="submit" disabled={isSending} className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white px-6 py-2 rounded-md text-sm font-semibold transition-all flex items-center disabled:opacity-50">
              {isSending ? 'Sending...' : 'Send Message'}
            </button>
            <Tooltip text="Discard Draft">
              <button type="button" onClick={() => setIsComposeOpen(false)} className="text-slate-500 hover:text-red-400 p-2 rounded-md">
                <Trash2 size={18} />
              </button>
            </Tooltip>
          </div>
        </form>
      </div>
    </div>
  );
}