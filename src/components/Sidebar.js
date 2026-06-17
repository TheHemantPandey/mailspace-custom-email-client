import { Inbox, Send, Star, File, Trash2, Plus, RefreshCw, Code, User, Briefcase } from 'lucide-react';

function NavItem({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 active:scale-[0.98] ${active ? 'bg-blue-600/10 text-blue-400 font-medium' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'}`}>
      <div className="flex items-center">
        <span className="mr-3">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
    </button>
  );
}

export default function Sidebar({ currentFolder, setCurrentFolder, setIsComposeOpen, handleSync, isSyncing }) {
  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-950/50 flex flex-col z-20 hidden md:flex shrink-0 justify-between">
      <div>
        <div className="p-4">
          <button 
            onClick={() => setIsComposeOpen(true)} 
            className="w-full mb-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white py-3 px-4 rounded-xl flex items-center justify-center font-semibold shadow-lg shadow-blue-900/20 transition-all"
          >
            <Plus className="w-5 h-5 mr-2" /> Compose
          </button>
          
          <button 
            onClick={handleSync} 
            disabled={isSyncing} 
            className="w-full mb-6 border border-slate-700 hover:bg-slate-800 active:scale-95 text-slate-300 py-2.5 px-4 rounded-lg flex items-center justify-center font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin text-blue-400' : ''}`} /> 
            {isSyncing ? 'Syncing...' : 'Sync Inbox'}
          </button>
          
          <nav className="space-y-1">
            <NavItem icon={<Inbox size={18} />} label="Inbox" active={currentFolder === 'INBOX'} onClick={() => setCurrentFolder('INBOX')} />
            <NavItem icon={<Send size={18} />} label="Sent" active={currentFolder === 'SENT'} onClick={() => setCurrentFolder('SENT')} />
            <NavItem icon={<Star size={18} />} label="Starred" active={currentFolder === 'STARRED'} onClick={() => setCurrentFolder('STARRED')} />
            <NavItem icon={<File size={18} />} label="Drafts" active={currentFolder === 'DRAFT'} onClick={() => setCurrentFolder('DRAFT')} />
            <NavItem icon={<Trash2 size={18} />} label="Trash" active={currentFolder === 'TRASH'} onClick={() => setCurrentFolder('TRASH')} />
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800/60 bg-slate-900/30">
        <div className="text-[10px] text-slate-500 space-y-2">
          <p className="font-semibold text-slate-400 uppercase tracking-wider mb-2">Developer Profile</p>
          <p className="flex items-center"><Code size={12} className="mr-2 text-blue-400" /> Full-Stack MERN Developer</p>
          <p className="flex items-center"><User size={12} className="mr-2 text-blue-400" /> B.Tech CSE @ YMCA</p>
          <p className="flex items-center"><Briefcase size={12} className="mr-2 text-blue-400" /> Available on Fiverr</p>
          <p className="mt-3 pt-3 border-t border-slate-800 text-slate-600">&copy; 2026 Hemant Pandey</p>
        </div>
      </div>
    </aside>
  );
}