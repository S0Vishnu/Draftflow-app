
import React, { useRef, useEffect } from 'react';
import { Folder, File, Edit2, Trash2 } from 'lucide-react';

export interface FileEntry {
    name: string;
    isDirectory: boolean;
    path: string;
    size?: number;
    mtime?: Date;
    type?: string;
    latestVersion?: string;
}

interface FileItemProps {
    file: FileEntry;
    viewMode: 'list' | 'grid';
    selected: boolean;
    renaming: boolean;
    renameValue: string;
    onSelect: (e: React.MouseEvent) => void;
    onNavigate: () => void;
    onRenameChange: (val: string) => void;
    onRenameSubmit: () => void;
    onRenameCancel: () => void;
    onContextMenu: (e: React.MouseEvent) => void;
    onVersionClick: (e: React.MouseEvent) => void;
}

const FileItem: React.FC<FileItemProps> = ({
    file,
    viewMode,
    selected,
    renaming,
    renameValue,
    onSelect,
    onNavigate,
    onRenameChange,
    onRenameSubmit,
    onRenameCancel,
    onContextMenu,
    onVersionClick
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (renaming && inputRef.current) {
            inputRef.current.focus();
            const name = inputRef.current.value;
            if (file.isDirectory) {
                inputRef.current.select();
            } else {
                // Select only the name part, excluding extension
                const lastDotIndex = name.lastIndexOf('.');
                if (lastDotIndex > 0) {
                    inputRef.current.setSelectionRange(0, lastDotIndex);
                } else {
                    inputRef.current.select();
                }
            }
        }
    }, [renaming, file.isDirectory]);

    // Formatters
    const formatSize = (bytes?: number) => {
        if (bytes === undefined) return '--';
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const formatDate = (date?: Date) => {
        if (!date) return '--';
        return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // --- List View Render ---
    if (viewMode === 'list') {
        return (
            <div
                className={`list-row ${selected ? 'selected' : ''}`}
                data-path={file.path}
                onClick={onSelect}
                onDoubleClick={onNavigate}
                onContextMenu={onContextMenu}
            >
                <div className="col col-icon" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    {file.isDirectory ?
                        <Folder size={24} className="folder-icon" /> :
                        <div style={{ position: 'relative', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                             <File size={28} strokeWidth={1.5} style={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                             <span style={{ 
                                 position: 'absolute', 
                                 bottom: 6, 
                                 left: 0, 
                                 right: 0, 
                                 textAlign: 'center', 
                                 fontSize: 7, 
                                 fontWeight: 800, 
                                 color: '#3b82f6',
                                 textTransform: 'uppercase',
                                 pointerEvents: 'none',
                                 lineHeight: 1
                             }}>
                                {file.name.includes('.') ? file.name.split('.').pop()?.slice(0, 4) : ''}
                             </span>
                        </div>
                    }
                </div>

                <div className="col col-name">
                    {renaming ? (
                        <div className="rename-box" onClick={e => e.stopPropagation()}>
                            <input
                                ref={inputRef}
                                value={renameValue}
                                onChange={(e) => onRenameChange(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onRenameSubmit();
                                    if (e.key === 'Escape') onRenameCancel();
                                }}
                                onBlur={onRenameCancel}
                            />
                        </div>
                    ) : (
                        (() => {
                            // If directory or no extension, use standard overflow
                            if (file.isDirectory || file.name.lastIndexOf('.') === -1) {
                                return <span className="name-text" title={file.name}>{file.name}</span>;
                            }
                            // Split name and extension
                            const lastDot = file.name.lastIndexOf('.');
                            const namePart = file.name.substring(0, lastDot);
                            const extPart = file.name.substring(lastDot);
                            return (
                                <div className="name-text-container" title={file.name} style={{ display: 'flex', overflow: 'hidden', alignItems: 'center', flex: 1, minWidth: 0 }}>
                                    <span style={{ 
                                        whiteSpace: 'nowrap', 
                                        overflow: 'hidden', 
                                        textOverflow: 'ellipsis', 
                                        flexShrink: 1 
                                    }}>
                                        {namePart}
                                    </span>
                                    <span style={{ 
                                        whiteSpace: 'nowrap', 
                                        flexShrink: 0 
                                    }}>
                                        {extPart}
                                    </span>
                                </div>
                            );
                        })()
                    )}
                </div>

                <div className="col col-version">
                    {file.latestVersion ? (
                        <span 
                            className="version-badge-list" 
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(e); // Ensure it's selected too
                                onVersionClick(e);
                            }}
                            style={{ cursor: 'pointer' }}
                            title="Click to view details"
                        >
                            v{file.latestVersion}
                        </span>
                    ) : ''}
                </div>

                <div className="col col-date">{formatDate(file.mtime)}</div>
                <div className="col col-size">{!file.isDirectory ? formatSize(file.size) : '--'}</div>
                <div className="col col-type">{file.type || 'Unknown'}</div>
            </div>
        );
    }

    // --- Grid View Render ---
    return (
        <div
            className={`grid-card ${selected ? 'selected' : ''}`}
            data-path={file.path}
            onClick={onSelect}
            onDoubleClick={onNavigate}
            onContextMenu={onContextMenu}
        >
            <div className="card-icon">
                {file.latestVersion && (
                    <div 
                        className="version-indicator-tile"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect(e); // Ensure selected
                            onVersionClick(e);
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Click to view details"
                    >
                        v{file.latestVersion}
                    </div>
                )}
                {file.isDirectory ?
                    <Folder size={56} className="folder-icon-large" /> :
                    <div style={{ position: 'relative', width: 56, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                         <File size={56} strokeWidth={1.5} style={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
                         <span style={{ 
                             position: 'absolute', 
                             bottom: 8, 
                             left: 12, 
                             fontSize: 8, 
                             fontWeight: 800, 
                             color: '#3b82f6',
                             textTransform: 'uppercase',
                             pointerEvents: 'none',
                             lineHeight: 1
                         }}>
                            {file.name.includes('.') ? file.name.split('.').pop()?.slice(0, 4) : ''}
                         </span>
                    </div>
                }
            </div>

            <div className="card-name">
                {renaming ? (
                    <div className="rename-box-grid" onClick={e => e.stopPropagation()}>
                        <input
                            ref={inputRef}
                            value={renameValue}
                            onChange={(e) => onRenameChange(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onRenameSubmit();
                                if (e.key === 'Escape') onRenameCancel();
                            }}
                            onBlur={onRenameCancel}
                        />
                    </div>
                ) : (
                    <span title={file.name}>{file.name}</span>
                )}
            </div>
        </div>
    );
};

export default FileItem;
