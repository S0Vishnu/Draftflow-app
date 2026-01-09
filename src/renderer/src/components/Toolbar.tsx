
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
    onNavigate
}) => {
    // Helper to rebuild path up to index
    const getPathAtIndex = (parts: string[], index: number) => {
        // We need to be careful with separators. 
        // Assuming forward slashes for internal consistency or getting separator from original string if possible.
        // But currentPath string likely uses a consistent separator or mixture.
        // Safer way: re-join with '/' as JS handles it usually, or try to detect.
        // If currentPath starts with '/', we need to preserve it.
        // Actually, let's just use the parts slice.
        const slice = parts.slice(0, index + 1);
        let joined = slice.join('/');
        // Fix for Windows drive letters which might look like "C:" -> "C:/"
        // If the first part was "C:", join('/') gives "C:/Users"... which is fine.
        // But if currentPath started with slash "/Users", split gives ["", "Users"]?
        // Let's rely on the input path structure.

        // Better yet: use the original separators? 
        // Simplification: Construct path and let main process normalize if needed, 
        // or just use "/" since Node/Electron usually handles it.

        // Edge case: If path starts with '/' (Mac/Linux root), split('/') gives ['', 'Users', '...']
        // internal map index will be 0 -> empty string.
        if (slice.length === 1 && slice[0] === '') return '/';

        // If original had leading slash and split produced empty first element
        if (parts[0] === '' && slice.length > 1) {
            return slice.join('/'); // "/Users"
        }

        if (index === 0 && parts[0].includes(':')) return parts[0] + '/'; // Windows Root C:/

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
                    <HomeIcon
                        size={14}
                        className="crumb-home clickable"
                        onClick={onOpenWorkspace} // Mapping Home icon to Open Workspace for now, or could be user home
                    />
                    {currentPath ?
                        currentPath.split(/[/\\]/).map((part, i, arr) => {
                            if (!part && i === 0) return null; // Skip empty leading split for unix paths, manually handled?
                            // Actually, let's just render what we have but calculate path correctly.
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
                        })
                        : <span className="crumb-part ml-2">No Workspace Open</span>
                    }
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
