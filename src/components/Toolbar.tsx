
import React from 'react';
import {
    ChevronLeft, ChevronRight, Home as HomeIcon, ChevronRight as ChevronRightIcon,
    FolderPlus, FilePlus, List, LayoutGrid
} from 'lucide-react';

interface ToolbarProps {
    currentPath: string | null;
    historyIndex: number;
    historyLength: number;
    viewMode: 'list' | 'grid';
    onNavigateBack: () => void;
    onNavigateForward: () => void;
    onOpenWorkspace: () => void;
    onCreateFolder: () => void;
    onCreateFile: () => void;
    setViewMode: (mode: 'list' | 'grid') => void;
    onNavigate: (path: string) => void;
    rootDir: string | null;
}

const Toolbar: React.FC<ToolbarProps> = ({
    currentPath,
    historyIndex,
    historyLength,
    viewMode,
    onNavigateBack,
    onNavigateForward,
    onOpenWorkspace,
    onCreateFolder,
    onCreateFile,
    setViewMode,
    onNavigate,
    rootDir
}) => {
    // Helper to rebuild path up to index
    const getPathAtIndex = (parts: string[], index: number) => {
        const slice = parts.slice(0, index + 1);
        let joined = slice.join('/');

        if (slice.length === 1 && slice[0] === '') return '/';
        if (parts[0] === '' && slice.length > 1) {
            return slice.join('/');
        }
        if (index === 0 && parts[0].includes(':')) return parts[0] + '/';

        return joined;
    };

    return (
        <div className="toolbar">
            <div className="path-breadcrumbs">
                <div className="nav-arrows">
                    <button className="nav-btn" onClick={onNavigateBack} disabled={historyIndex <= 0}>
                        <ChevronLeft size={16} />
                    </button>
                    <button className="nav-btn" onClick={onNavigateForward} disabled={historyIndex >= historyLength - 1}>
                        <ChevronRight size={16} />
                    </button>
                </div>
                <div className="divider-v"></div>
                <div className="breadcrumbs-list">
                    {/* Home/Root Icon */}
                    <HomeIcon
                        size={14}
                        className={`crumb-home ${!currentPath ? '' : 'clickable'}`}
                        onClick={onOpenWorkspace}
                    />

                    {(() => {
                        // Normalize paths for comparison (handle Windows backslashes)
                        const normCurrent = currentPath ? currentPath.replace(/\\/g, '/') : '';
                        const normRoot = rootDir ? rootDir.replace(/\\/g, '/') : '';

                        // Check if current path is inside root (case insensitive check for Windows could be added, but robust startswith is okay for now)
                        if (normCurrent && normRoot && normCurrent.startsWith(normRoot)) {
                            // Calculate relative path parts
                            const relative = normCurrent.slice(normRoot.length);
                            const parts = relative.split('/').filter(p => p);

                            // Always show Root Folder Name first
                            // Use the actual rootDir string for display name to preserve original casing
                            const rootName = normRoot.split('/').pop() || normRoot;

                            return (
                                <>
                                    <ChevronRightIcon size={12} className="crumb-sep" />
                                    <span
                                        className={`crumb-part ${parts.length > 0 ? 'clickable' : ''}`}
                                        onClick={() => parts.length > 0 && onNavigate(rootDir || normRoot)}
                                        title={rootDir || normRoot}
                                    >
                                        {rootName}
                                    </span>

                                    {parts.map((part, i) => {
                                        const relativePart = parts.slice(0, i + 1).join('/');
                                        // Reconstruct absolute path
                                        // Use normRoot to be safe with separators
                                        const partPath = `${normRoot}/${relativePart}`;
                                        const isLast = i === parts.length - 1;

                                        return (
                                            <React.Fragment key={i}>
                                                <ChevronRightIcon size={12} className="crumb-sep" />
                                                <span
                                                    className={`crumb-part ${!isLast ? 'clickable' : ''}`}
                                                    onClick={() => !isLast && onNavigate(partPath)}
                                                >
                                                    {part}
                                                </span>
                                            </React.Fragment>
                                        );
                                    })}
                                </>
                            );
                        }

                        // Fallback / Absolute Path Mode
                        return currentPath ? currentPath.split(/[/\\]/).map((part, i, arr) => {
                            if (!part && i === 0) return null;
                            const fullPath = getPathAtIndex(arr, i);
                            const isLast = i === arr.length - 1;

                            return (
                                <React.Fragment key={i}>
                                    <ChevronRightIcon size={12} className="crumb-sep" />
                                    <span
                                        className={`crumb-part ${!isLast ? 'clickable' : ''}`}
                                        onClick={() => !isLast && onNavigate(fullPath)}
                                    >
                                        {part || '/'}
                                    </span>
                                </React.Fragment>
                            );
                        }) : <span className="crumb-part ml-2">No Workspace Open</span>;
                    })()}
                </div>
                <style>{`
                    .clickable { cursor: pointer; transition: color 0.2s; }
                    .clickable:hover { color: var(--accent); text-decoration: underline; }
                `}</style>
            </div>

            <div className="actions-group">
                {!currentPath ? (
                    <button className="primary-btn" onClick={onOpenWorkspace}>Open Workspace</button>
                ) : (
                    <>
                        <button className="action-btn" onClick={onCreateFolder}><FolderPlus size={16} /> New Folder</button>
                        <button className="action-btn" onClick={onCreateFile}><FilePlus size={16} /> New File</button>
                        <div className="divider-v"></div>
                        <button className={`icon-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><List size={18} /></button>
                        <button className={`icon-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={18} /></button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Toolbar;
