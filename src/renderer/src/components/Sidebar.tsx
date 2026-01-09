
import React from 'react';
import { Home as HomeIcon, Folder, Settings, LogOut } from 'lucide-react';
import { User } from 'firebase/auth';

interface SidebarProps {
    isOpen: boolean;
    user: User | null | undefined;
    onOpenFolder: () => void;
    onSignOut: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, user, onOpenFolder, onSignOut }) => {
    return (
        <aside className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
            <div className="sidebar-content">
                <div className="sidebar-top">
                    <button className="side-btn active" title="Home"><HomeIcon size={22} /></button>
                    <button className="side-btn" onClick={onOpenFolder} title="Open Folder"><Folder size={22} /></button>
                </div>
                <div className="sidebar-bottom">
                    <button className="side-btn" title="Settings"><Settings size={22} /></button>
                    <button className="side-btn" onClick={onSignOut} title="Sign Out">
                        <LogOut size={20} />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
