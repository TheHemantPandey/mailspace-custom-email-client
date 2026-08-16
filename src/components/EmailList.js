import { useState } from 'react';
import { Search, CheckSquare, Square, Archive, Trash2, RefreshCw, Paperclip, AlertTriangle } from 'lucide-react';
import { signIn } from 'next-auth/react';

export default function EmailList({
  emails,
  isLoading,
  page,
  hasMore,
  currentFolder,
  selectedEmail,
  handleSelectEmail,
  fetchEmails,
  selectedIds,
  setSelectedIds,
  handleBulkAction,
  bulkActionLoading,
  authError,
  setAuthError,
  handleSync
}) {
  const [searchQuery, setSearchQuery] = useState('');

  // Live Search Filtering Logic
  const filteredEmails = emails.filter(email => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(q) || 
      email.from?.name?.toLowerCase().includes(q) || 
      email.from?.address?.toLowerCase().includes(q) ||
      email.snippet?.toLowerCase().includes(q)
    );
  });

  // Bulk Selection Logic
  const toggleSelectAll = () => {
    if (selectedIds.size > 0 && selectedIds.size === filteredEmails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmails.map(e => e.gmailId)));
    }
  };

  const toggleSelectOne = (e, id) => {
    e.stopPropagation(); // Prevents opening the email when just clicking the checkbox
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' }).format(new Date(dateString));
  };

  return (
    <section className="w-full md:w-80 lg:w-[400px] border-r border-slate-800 bg-slate-900 flex flex-col relative z-10 shadow-2xl shadow-black/50 shrink-0">
      
      {/* 1. SEARCH BAR */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 bg-slate-900 shrink-0">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search mail..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full bg-slate-950 border border-slate-800 text-sm rounded-md pl-9 pr-4 py-2 text-slate-200 focus:outline-none focus:border-blue-500 transition-all" 
          />
        </div>
      </div>
      
      {/* 2. BULK ACTION TOOLBAR */}
      <div className="h-10 border-b border-slate-800/80 bg-slate-950/40 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center">
          <button onClick={toggleSelectAll} className="mr-3 text-slate-500 hover:text-blue-400 transition-colors">
            {selectedIds.size > 0 && selectedIds.size === filteredEmails.length ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
          </button>
          {selectedIds.size > 0 && (
            <span className="text-xs font-medium text-blue-400">{selectedIds.size} Selected</span>
          )}
        </div>
        {selectedIds.size > 0 && (
          <div className="flex space-x-3">
            <button onClick={() => handleBulkAction('archive')} disabled={bulkActionLoading} className="p-1 text-slate-500 hover:text-slate-300 transition-colors" title="Archive Selected"><Archive size={14}/></button>
            <button onClick={() => handleBulkAction('trash')} disabled={bulkActionLoading} className="p-1 text-slate-500 hover:text-red-400 transition-colors" title="Trash Selected"><Trash2 size={14}/></button>
          </div>
        )}
      </div>

      {/* 3. ERROR BANNER (FOR GMAIL API AUTH FAILURE) */}
      {authError && (
        <div className="mx-3 my-3 p-3 bg-red-950/80 border border-red-800/80 rounded-lg flex flex-col gap-2 shrink-0 text-red-200 text-xs shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center font-semibold text-red-300">
              <AlertTriangle size={15} className="mr-1.5 shrink-0 text-red-400" />
              <span>Gmail API Authorization Error</span>
            </div>
            {setAuthError && (
              <button 
                onClick={() => setAuthError(null)} 
                className="text-red-400 hover:text-red-200 text-xs px-1"
                title="Dismiss"
              >
                ✕
              </button>
            )}
          </div>
          <p className="text-[11px] text-red-300/90 leading-normal">
            Unable to sync or retrieve emails from Gmail API (invalid/expired refresh token or missing scopes). Displaying cached MongoDB emails.
          </p>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => signIn('google', { callbackUrl: window.location.href })}
              className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white font-medium text-[11px] rounded transition-colors shadow"
            >
              Re-authorize Gmail
            </button>
            {handleSync && (
              <button
                onClick={handleSync}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-[11px] rounded transition-colors border border-slate-700"
              >
                Retry Sync
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. SCROLLABLE EMAIL LIST */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {isLoading && page === 1 ? (
          <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center">
            <RefreshCw className="w-6 h-6 animate-spin mb-3 text-slate-600" /> Loading...
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No messages found.</div>
        ) : (
          <>
            {filteredEmails.map((email) => (
              <div 
                key={email.gmailId} 
                onClick={() => handleSelectEmail(email)}
                className={`p-4 border-b border-slate-800/50 cursor-pointer transition-all duration-300 active:bg-slate-800 flex ${selectedEmail?.gmailId === email.gmailId ? 'bg-blue-900/20 border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent hover:bg-slate-800/50'}`}
              >
                {/* Checkbox */}
                <div className="mr-3 mt-0.5" onClick={(e) => toggleSelectOne(e, email.gmailId)}>
                  {selectedIds.has(email.gmailId) ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} className="text-slate-600 hover:text-slate-400" />}
                </div>
                
                {/* Email Preview Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className={`text-sm truncate pr-4 ${!email.isRead ? 'text-slate-100 font-bold' : 'text-slate-400 font-medium'}`}>
                      {email.from.name || email.from.address.split('@')[0]}
                    </h4>
                    <span className="text-xs text-slate-500 shrink-0">{formatDate(email.dateReceived)}</span>
                  </div>
                  <h5 className={`text-sm mb-1 truncate ${!email.isRead ? 'text-blue-400 font-bold' : 'text-slate-300'}`}>{email.subject}</h5>
                  <p className={`text-xs line-clamp-2 leading-relaxed ${!email.isRead ? 'text-slate-300' : 'text-slate-500'}`}>{email.snippet}</p>
                  {email.attachments && email.attachments.length > 0 && <Paperclip className="w-3 h-3 text-slate-500 mt-2" />}
                </div>
              </div>
            ))}
            
            {/* PAGINATION LOAD MORE BUTTON */}
            {hasMore && !searchQuery && (
              <button 
                onClick={() => fetchEmails(page + 1, currentFolder, false)} 
                className="w-full p-4 text-xs font-medium text-blue-400 hover:bg-slate-800 transition-colors border-b border-slate-800"
              >
                Load Older Messages...
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}