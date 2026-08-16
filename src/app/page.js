'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import EmailList from '@/components/EmailList';
import ReadingPane from '@/components/ReadingPane';
import ComposeModal from '@/components/ComposeModal';

// Brand Icons
const GithubIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4"></path></svg>
);

const LinkedinIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);

export default function Dashboard() {
  // Application Data State
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [currentFolder, setCurrentFolder] = useState('INBOX');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // UI Loading & Error Flags
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Compose / Form States
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [composeData, setComposeData] = useState({ fromPrefix: 'hello', to: '', cc: '', bcc: '', subject: '', attachments: [] });
  const [isSending, setIsSending] = useState(false);
  const editorRef = useRef(null);

  // Autocomplete Memory States
  const [recentContacts, setRecentContacts] = useState([]);
  const [recentSenders, setRecentSenders] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSenderSuggestions, setShowSenderSuggestions] = useState(false);

  // Initialize Memory from LocalStorage
  useEffect(() => {
    const cachedContacts = localStorage.getItem('mailspace_contacts');
    if (cachedContacts) setRecentContacts(JSON.parse(cachedContacts));
    const cachedSenders = localStorage.getItem('mailspace_senders');
    if (cachedSenders) setRecentSenders(JSON.parse(cachedSenders));
    else setRecentSenders(['hello', 'contact', 'query']);
  }, []);

  // Fetch emails when folder changes
  useEffect(() => {
    fetchEmails(1, currentFolder, true);
  }, [currentFolder]);

  // Data Fetching Logic
  const fetchEmails = async (pageNum = 1, folder = 'INBOX', reset = false) => {
    if (reset) setIsLoading(true);
    try {
      const res = await fetch(`/api/emails?label=${folder}&page=${pageNum}&limit=30`);
      const data = await res.json();
      if (data.success) {
        if (reset) {
          setEmails(data.emails);
          setSelectedIds(new Set());
          if (data.emails.length > 0) setSelectedEmail(data.emails[0]);
          else setSelectedEmail(null);
        } else {
          setEmails(prev => [...prev, ...data.emails]);
        }
        setHasMore(data.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (error) { console.error("Failed to fetch emails", error); }
    if (reset) setIsLoading(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync');
      const data = await res.json();
      if (!res.ok || !data.success || data.authError) {
        if (data.authError || data.error?.includes('Authorization Error') || data.error?.includes('invalid_grant')) {
          setAuthError(data.error || 'Gmail API Authorization Error: Unable to sync or retrieve emails from Gmail API');
        } else {
          setAuthError(data.error || 'Sync request returned an error');
        }
      } else {
        setAuthError(null);
      }
    } catch (err) {
      console.error("Sync request error:", err);
      setAuthError('Network error while connecting to sync API');
    }
    await fetchEmails(1, currentFolder, true);
    setIsSyncing(false);
  };

  const handleSelectEmail = async (email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      setEmails(emails.map(e => e.gmailId === email.gmailId ? { ...e, isRead: true } : e));
      fetch('/api/emails/mark-read', { method: 'POST', body: JSON.stringify({ gmailId: email.gmailId }) });
    }
  };

  // Action Logic
  const handleBulkAction = async (action) => {
    if (selectedIds.size === 0) return;
    setBulkActionLoading(true);
    const idsArray = Array.from(selectedIds);
    setEmails(prev => prev.filter(e => !selectedIds.has(e.gmailId)));
    if (selectedEmail && selectedIds.has(selectedEmail.gmailId)) setSelectedEmail(null);
    setSelectedIds(new Set());

    await fetch('/api/emails/bulk', { method: 'POST', body: JSON.stringify({ gmailIds: idsArray, action }) });
    setBulkActionLoading(false);
  };

  const handleReply = () => {
    if (!selectedEmail) return;
    const sender = selectedEmail.from.address;
    const subject = selectedEmail.subject.startsWith('Re:') ? selectedEmail.subject : `Re: ${selectedEmail.subject}`;
    
    setComposeData({ fromPrefix: 'hello', to: sender, cc: '', bcc: '', subject: subject, attachments: [] });
    setIsComposeOpen(true);
    
    setTimeout(() => {
      if (editorRef.current) {
        const dateStr = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(selectedEmail.dateReceived));
        editorRef.current.innerHTML = `<br/><br/><blockquote style="border-left: 2px solid #3b82f6; padding-left: 10px; color: #94a3b8; margin-left: 0;">On ${dateStr}, ${selectedEmail.from.name || sender} wrote:<br/>${selectedEmail.bodyHtml || selectedEmail.bodyText.replace(/\n/g, '<br/>')}</blockquote>`;
        editorRef.current.focus();
      }
    }, 100);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setIsSending(true);
    const fromPrefixClean = composeData.fromPrefix.toLowerCase().trim();
    const toAddressClean = composeData.to.toLowerCase().trim();
    
    const payload = {
      fromAddress: `${fromPrefixClean}@hemantpandey.in`,
      to: toAddressClean, cc: composeData.cc, bcc: composeData.bcc,
      subject: composeData.subject, bodyHtml: editorRef.current.innerHTML,
      attachments: composeData.attachments.map(({ filename, content }) => ({ filename, content }))
    };

    const res = await fetch('/api/send', { method: 'POST', body: JSON.stringify(payload) });
    if (res.ok) {
      if (!recentContacts.includes(toAddressClean)) {
        const newC = [...recentContacts, toAddressClean];
        setRecentContacts(newC); localStorage.setItem('mailspace_contacts', JSON.stringify(newC));
      }
      setIsComposeOpen(false);
      setComposeData({ fromPrefix: 'hello', to: '', cc: '', bcc: '', subject: '', attachments: [] });
      alert('Email sent successfully!');
    } else alert('Failed to send email.');
    setIsSending(false);
  };

  // Helper bindings for compose
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const parsedFiles = await Promise.all(files.map(async (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({ filename: file.name, content: reader.result.split(',')[1], size: (file.size / 1024 / 1024).toFixed(2) });
      });
    }));
    setComposeData(prev => ({ ...prev, attachments: [...prev.attachments, ...parsedFiles] }));
  };
  const removeAttachment = (idxToRemove) => setComposeData(prev => ({...prev, attachments: prev.attachments.filter((_, i) => i !== idxToRemove)}));
  const applyFormat = (command) => { document.execCommand(command, false, null); editorRef.current.focus(); };

  const filteredContacts = recentContacts.filter(contact => contact.toLowerCase().includes(composeData.to.toLowerCase().trim()));
  const filteredSenders = recentSenders.filter(sender => sender.toLowerCase().includes(composeData.fromPrefix.toLowerCase().trim()));

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-300 font-sans">
      {/* HEADER */}
      <header className="h-14 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between px-6 z-30 shrink-0 shadow-md">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-900/20 mr-3 overflow-hidden border border-slate-700">
            <User size={18} className="text-white" />
          </div>
          <div><h1 className="text-sm font-bold text-slate-100 flex items-center">Hemant Pandey <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-blue-900/30 text-blue-400 border border-blue-800/50">Workspace</span></h1></div>
        </div>
        <div className="flex items-center space-x-3">
          <a href="https://github.com" target="_blank" className="p-1.5 text-slate-400 hover:text-white transition-all"><GithubIcon size={18} /></a>
          <a href="https://linkedin.com" target="_blank" className="p-1.5 text-slate-400 hover:text-blue-400 transition-all"><LinkedinIcon size={18} /></a>
        </div>
      </header>

      {/* DASHBOARD LAYOUT */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar 
          currentFolder={currentFolder} setCurrentFolder={setCurrentFolder}
          setIsComposeOpen={setIsComposeOpen} handleSync={handleSync} isSyncing={isSyncing} 
        />
        <EmailList 
          emails={emails} isLoading={isLoading} page={page} hasMore={hasMore} currentFolder={currentFolder}
          selectedEmail={selectedEmail} handleSelectEmail={handleSelectEmail} fetchEmails={fetchEmails}
          selectedIds={selectedIds} setSelectedIds={setSelectedIds} handleBulkAction={handleBulkAction} bulkActionLoading={bulkActionLoading}
          authError={authError} setAuthError={setAuthError} handleSync={handleSync}
        />
        <ReadingPane 
          selectedEmail={selectedEmail} handleReply={handleReply} handleBulkAction={handleBulkAction} setSelectedIds={setSelectedIds} 
        />
        
        {isComposeOpen && (
          <ComposeModal 
            setIsComposeOpen={setIsComposeOpen} composeData={composeData} setComposeData={setComposeData}
            showSenderSuggestions={showSenderSuggestions} setShowSenderSuggestions={setShowSenderSuggestions} filteredSenders={filteredSenders}
            showSuggestions={showSuggestions} setShowSuggestions={setShowSuggestions} filteredContacts={filteredContacts}
            showCcBcc={showCcBcc} setShowCcBcc={setShowCcBcc} handleFileUpload={handleFileUpload} removeAttachment={removeAttachment}
            applyFormat={applyFormat} handleSendEmail={handleSendEmail} isSending={isSending} editorRef={editorRef}
          />
        )}
      </div>
    </div>
  );
}