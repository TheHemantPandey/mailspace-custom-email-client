'use client';

import { useState, useEffect } from 'react';
import { 
  Inbox, Send, File, Trash2, Archive, Star, 
  RefreshCw, Search, Mail, Clock, Plus, X, AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Compose Modal States
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
  const [isSending, setIsSending] = useState(false);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/emails?label=INBOX');
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails);
        if (data.emails.length > 0 && !selectedEmail) {
          setSelectedEmail(data.emails[0]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch emails", error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/sync');
      await fetchEmails();
    } catch (error) {
      console.error("Sync failed", error);
    }
    setIsSyncing(false);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(composeData),
      });
      
      if (res.ok) {
        setIsComposeOpen(false);
        setComposeData({ to: '', subject: '', body: '' }); // Reset form
        alert('Email sent successfully!');
      } else {
        alert('Failed to send email. Check console.');
      }
    } catch (error) {
      console.error('Send error:', error);
    }
    setIsSending(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' 
    }).format(date);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-300 font-sans relative">
      
      {/* 1. LEFT SIDEBAR */}
      <aside className="w-64 border-r border-slate-800 bg-slate-950/50 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Mail className="w-6 h-6 text-blue-500 mr-3" />
          <span className="text-lg font-bold text-slate-100 tracking-wide">Mailspace</span>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
          {/* New Compose Button */}
          <button 
            onClick={() => setIsComposeOpen(true)}
            className="w-full mb-4 bg-blue-600 hover:bg-blue-500 text-white py-3 px-4 rounded-xl flex items-center justify-center font-semibold shadow-lg shadow-blue-900/20 transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Compose
          </button>

          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full mb-6 border border-slate-700 hover:bg-slate-800 text-slate-300 py-2.5 px-4 rounded-lg flex items-center justify-center font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Inbox'}
          </button>

          <nav className="space-y-1">
            <NavItem icon={<Inbox size={18} />} label="Inbox" count={emails.length} active />
            <NavItem icon={<Star size={18} />} label="Starred" />
            <NavItem icon={<Send size={18} />} label="Sent" />
            <NavItem icon={<File size={18} />} label="Drafts" />
            <NavItem icon={<Archive size={18} />} label="Archive" />
            <NavItem icon={<Trash2 size={18} />} label="Trash" />
          </nav>
        </div>
      </aside>

      {/* 2. MIDDLE PANE: EMAIL LIST */}
      <section className="w-80 lg:w-96 border-r border-slate-800 bg-slate-900 flex flex-col relative z-10 shadow-2xl shadow-black/50">
        <div className="h-16 flex items-center px-4 border-b border-slate-800 bg-slate-900">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search emails..." 
              className="w-full bg-slate-950 border border-slate-800 text-sm rounded-md pl-9 pr-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center">
              <RefreshCw className="w-6 h-6 animate-spin mb-3 text-slate-600" />
              Loading your inbox...
            </div>
          ) : emails.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Your inbox is empty. Click sync to fetch!
            </div>
          ) : (
            emails.map((email) => (
              <div 
                key={email.gmailId}
                onClick={() => setSelectedEmail(email)}
                className={`p-4 border-b border-slate-800/50 cursor-pointer transition-all hover:bg-slate-800/50 ${selectedEmail?.gmailId === email.gmailId ? 'bg-blue-900/20 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <h4 className={`text-sm font-medium truncate pr-4 ${!email.isRead ? 'text-slate-100' : 'text-slate-400'}`}>
                    {email.from.name || email.from.address.split('@')[0]}
                  </h4>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(email.dateReceived)}
                  </span>
                </div>
                <h5 className={`text-sm mb-1 truncate ${!email.isRead ? 'text-blue-400 font-medium' : 'text-slate-300'}`}>
                  {email.subject}
                </h5>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {email.snippet}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 3. RIGHT PANE: READING VIEW */}
      <main className="flex-1 bg-slate-950 flex flex-col relative z-0">
        {selectedEmail ? (
          <>
            <div className="h-16 flex items-center justify-between px-8 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="flex space-x-3">
                <button className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors tooltip" title="Archive"><Archive size={18} /></button>
                <button className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-slate-200 transition-colors tooltip" title="Delete"><Trash2 size={18} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-semibold text-slate-100 mb-6 tracking-tight">
                  {selectedEmail.subject}
                </h1>
                
                <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-800/80">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/20 mr-4">
                      {(selectedEmail.from.name || selectedEmail.from.address).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-200">
                        {selectedEmail.from.name} <span className="text-slate-500 font-normal ml-1">&lt;{selectedEmail.from.address}&gt;</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center">
                        To: {selectedEmail.to.map(t => t.name || t.address).join(', ') || 'me'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
                    <Clock size={12} className="mr-1.5" />
                    {formatDate(selectedEmail.dateReceived)}
                  </div>
                </div>

                <div 
                  className="prose prose-invert prose-blue max-w-none text-slate-300 text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml || selectedEmail.bodyText.replace(/\n/g, '<br />') }}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <Mail className="w-16 h-16 text-slate-800 mb-4" />
            <p>Select a message to read</p>
          </div>
        )}
      </main>

      {/* 4. COMPOSE MODAL OVERLAY */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-slate-900 w-full max-w-xl rounded-t-xl rounded-bl-xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-10">
            
            {/* Modal Header */}
            <div className="bg-slate-800 px-4 py-3 flex justify-between items-center border-b border-slate-700">
              <span className="text-sm font-semibold text-slate-200">New Message</span>
              <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-slate-100 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendEmail} className="flex flex-col flex-1">
              <input 
                type="email" 
                required
                placeholder="To (Must be your verified email while testing)" 
                value={composeData.to}
                onChange={(e) => setComposeData({...composeData, to: e.target.value})}
                className="w-full bg-transparent border-b border-slate-800 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-slate-950/50"
              />
              <input 
                type="text" 
                placeholder="Subject" 
                value={composeData.subject}
                onChange={(e) => setComposeData({...composeData, subject: e.target.value})}
                className="w-full bg-transparent border-b border-slate-800 px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-slate-950/50"
              />
              <textarea 
                required
                placeholder="Write your message..." 
                value={composeData.body}
                onChange={(e) => setComposeData({...composeData, body: e.target.value})}
                className="w-full flex-1 bg-transparent px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none resize-none min-h-[250px]"
              />
              
              {/* Modal Footer */}
              <div className="bg-slate-950/50 px-4 py-3 flex justify-between items-center border-t border-slate-800">
                <button 
                  type="submit" 
                  disabled={isSending}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors flex items-center disabled:opacity-50"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsComposeOpen(false)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-2"
                  title="Discard Draft"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, count, active }) {
  return (
    <button className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all ${active ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
      <div className="flex items-center">
        <span className="mr-3">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      {count !== undefined && count > 0 && (
        <span className={`text-xs px-2 py-0.5 rounded-full ${active ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
          {count}
        </span>
      )}
    </button>
  );
}