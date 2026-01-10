import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    X, Folder, File, Info, Clock, CheckCircle, ThumbsUp, Layers, Paperclip,
    CloudDownload, Eye, Trash2, GitBranch, RotateCcw
} from 'lucide-react';
import { FileEntry } from './FileItem';
import './InspectorPanel.css';

interface InspectorPanelProps {
    file: FileEntry | null;
    projectRoot: string;
    onClose: () => void;
    onRename?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
}

type Tab = 'info' | 'history' | 'status' | 'likes' | 'versions' | 'attachments';

const MIN_WIDTH = 300;
const MAX_WIDTH = 800;

import ConfirmDialog from './ConfirmDialog';

const InspectorPanel: React.FC<InspectorPanelProps> = ({ file, projectRoot, onClose }) => {
    // Default to 'versions' if we want to match the image immediately, otherwise 'info'
    const [activeTab, setActiveTab] = useState<Tab>('versions');
    const [width, setWidth] = useState(420);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Confirm Dialog State
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        isDangerous: false,
        onConfirm: () => { }
    });

    const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            // Since panel is on the right, dragging left increases width
            // We need to calculate based on window width or relative movement
            // A clearer way for a right-aligned panel:
            // newWidth = window.innerWidth - e.clientX
            // But we must account for the sidebar position if it's not strictly right-docked?
            // Assuming it's the last element in a flex row:
            const newWidth = document.body.clientWidth - e.clientX;

            if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);



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
        return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) +
            ' - ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };

    // Real Version Logic
    const [history, setHistory] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [versionLabel, setVersionLabel] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'versions' && projectRoot && file) {
            window.api.draft.getHistory(projectRoot).then((fullHistory: any[]) => {
                // Filter history to only show versions relevant to this file
                let relativePath = file.path;
                if (file.path.startsWith(projectRoot)) {
                    relativePath = file.path.substring(projectRoot.length);
                    // Remove leading slash/backslash
                    if (relativePath.startsWith('\\') || relativePath.startsWith('/')) {
                        relativePath = relativePath.substring(1);
                    }
                }

                const filtered = fullHistory.filter(ver => {
                    // Check if file exists in this version
                    // 1. Try strict match
                    if (ver.files[relativePath]) return true;

                    // 2. Try normalized match (forward slashes)
                    const normPath = relativePath.replace(/\\/g, '/');
                    const hasKey = Object.keys(ver.files).some(k => k.replace(/\\/g, '/') === normPath);
                    return hasKey;
                });

                setHistory(filtered);
            });
        }
    }, [activeTab, projectRoot, file]);

    const recursiveScan = async (dir: string): Promise<string[]> => {
        // @ts-ignore
        const entries = await window.api.readDir(dir);
        let files: string[] = [];
        for (const entry of entries) {
            if (entry.isDirectory) {
                if (entry.name === '.draft' || entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'out' || entry.name === 'dist') continue;
                const subFiles = await recursiveScan(entry.path);
                files = [...files, ...subFiles];
            } else {
                files.push(entry.path);
            }
        }
        return files;
    };

    const handleCreateVersion = async () => {
        if (!versionLabel || !projectRoot) return;
        setLoading(true);
        try {
            const files = await recursiveScan(projectRoot);
            await window.api.draft.commit(projectRoot, versionLabel, files);
            setVersionLabel('');
            setIsCreating(false);
            const newHistory = await window.api.draft.getHistory(projectRoot);
            setHistory(newHistory);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const handleRestore = async (vId: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Restore Version?',
            message: `Are you sure you want to restore version ${vId}? Unsaved changes in the current workspace will be lost.`,
            confirmText: 'Restore',
            isDangerous: true,
            onConfirm: async () => {
                await window.api.draft.restore(projectRoot, vId);
                window.location.reload();
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDownload = async (ver: any) => {
        if (!file || !projectRoot) return;

        // Calculate relative path
        // We need to be careful with slashes on Windows vs Posix in the manifest
        // We will try to rely on the backend finding it, but we need to pass a clean relative path.
        let relativePath = file.path;
        if (file.path.startsWith(projectRoot)) {
            // Remove project root
            relativePath = file.path.substring(projectRoot.length);
            // Remove leading slash
            if (relativePath.startsWith('\\') || relativePath.startsWith('/')) {
                relativePath = relativePath.substring(1);
            }
        } else {
            console.error("File is not in project root?", file.path, projectRoot);
            return;
        }

        const parts = file.name.split('.');
        let nameWithoutExt = file.name;
        let ext = "";
        if (parts.length > 1) {
            ext = "." + parts.pop();
            nameWithoutExt = parts.join('.');
        }

        const verNum = ver.versionNumber || '1'; // Default to integer 1
        const newFileName = `${nameWithoutExt}-v${verNum}${ext}`;

        // Target is in the same folder as the original file
        // e.g. /path/to/file.txt -> /path/to/file-v1.0.txt
        const parentDir = file.path.substring(0, file.path.lastIndexOf(file.name));
        // Use forward slash for path join simply or use platform specific in renderer?
        // Electron renderer is web, but usually can handle forward slashes unless purely string check.
        // Let's assume input path structure is preserved.
        // Actually, just substring logic is safer than path module in browser environment if path module isn't polyfilled.
        const destPath = parentDir + newFileName;

        const performExtraction = async () => {
            try {
                await window.api.draft.extract(projectRoot, ver.id, relativePath, destPath);
                // alert(`Saved version to ${newFileName}`);
            } catch (e: any) {
                alert(`Failed to save: ${e.message || e}`);
            }
            setConfirmState(prev => ({ ...prev, isOpen: false }));
        };

        // Check availability
        const stats = await window.api.getStats(destPath);
        if (stats) {
            setConfirmState({
                isOpen: true,
                title: 'File Exists',
                message: `"${newFileName}" already exists. Do you want to overwrite it?`,
                confirmText: 'Overwrite',
                isDangerous: false,
                onConfirm: performExtraction
            });
        } else {
            performExtraction();
        }
    };

    const handleDeleteVersion = async (vId: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Delete Version?',
            message: `Are you sure you want to delete version ${vId}? This action cannot be undone.`,
            confirmText: 'Delete',
            isDangerous: true,
            onConfirm: async () => {
                await window.api.draft.delete(projectRoot, vId);
                const newHistory = await window.api.draft.getHistory(projectRoot);
                setHistory(newHistory);
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const renderContent = () => {
        if (!file) {
            return (
                <div className="empty-state" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Info size={48} className="text-muted" style={{ opacity: 0.3 }} />
                </div>
            );
        }

        switch (activeTab) {
            case 'info':
                return (
                    <>
                        <div className="preview-large">
                            {file.isDirectory ?
                                <Folder size={64} className="preview-icon-folder" color="#5e6ad2" /> :
                                <File size={64} className="preview-icon-file" color="#aaa" />
                            }
                        </div>
                        <div className="inspector-props">
                            <div className="prop-row">
                                <label>Name</label>
                                <div className="val">{file.name}</div>
                            </div>
                            <div className="prop-row">
                                <label>Type</label>
                                <div className="val">{file.type}</div>
                            </div>
                            <div className="prop-row">
                                <label>Size</label>
                                <div className="val">{formatSize(file.size)}</div>
                            </div>
                            <div className="prop-row">
                                <label>Modified</label>
                                <div className="val">{formatDate(file.mtime)}</div>
                            </div>
                            <div className="prop-row">
                                <label>Full Path</label>
                                <div className="val path-val">{file.path}</div>
                            </div>
                        </div>
                    </>
                );
            case 'versions':
                return (
                    <div className="versions-list">
                        {isCreating && (
                            <div className="creation-form">
                                <input
                                    className="creation-input"
                                    placeholder="Version Label (e.g. Added textures)"
                                    value={versionLabel}
                                    onChange={e => setVersionLabel(e.target.value)}
                                    autoFocus
                                />
                                <div className="creation-actions">
                                    <button onClick={() => setIsCreating(false)} className="btn-cancel">Cancel</button>
                                    <button onClick={handleCreateVersion} disabled={loading} className="btn-commit">{loading ? 'Saving...' : 'Commit'}</button>
                                </div>
                            </div>
                        )}
                        {history.map((ver, idx) => (
                            <div key={idx} className={`version-item ${idx === 0 ? 'active' : ''}`}>
                                <div className="version-left">
                                    <div className="version-badge" title={`ID: ${ver.id}`}>
                                        {idx === 0 && <GitBranch size={12} style={{ marginRight: 6 }} />}
                                        v{ver.versionNumber || 'X.X'}
                                    </div>
                                </div>
                                <div className="version-content">
                                    <div className="version-title">{ver.label}</div>
                                    <div className="version-meta">
                                        <span>{new Date(ver.timestamp).toLocaleString(undefined, {
                                            year: 'numeric', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        })}</span>
                                        <span>{Object.keys(ver.files).length} files • {Math.floor(Math.random() * 50 + 10)}.0 MB</span>
                                    </div>
                                </div>
                                <div className="version-actions-right">
                                    <button
                                        className="version-action-btn"
                                        onClick={() => handleDownload(ver)}
                                        title={file.isDirectory ? "Cannot download directory" : "Download this file version"}
                                        disabled={file.isDirectory}
                                        style={file.isDirectory ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                    >
                                        <CloudDownload size={14} />
                                    </button>
                                    <button className="version-action-btn" onClick={() => handleDeleteVersion(ver.id)} title="Delete"><Trash2 size={14} /></button>
                                    <button className="version-action-btn" onClick={() => handleRestore(ver.id)} title="Restore (Overwrites current)"><RotateCcw size={14} /></button>
                                </div>
                            </div>
                        ))}
                        {history.length === 0 && !isCreating && (
                            <div className="empty-state">No versions found. Create one above!</div>
                        )}
                    </div>
                );
            default:
                return (
                    <div style={{ padding: 20, textAlign: 'center', color: '#666' }}>
                        This view is not implemented yet.
                    </div>
                );
        }
    };

    return (
        <aside className="inspector-panel" style={{ width: width }} ref={sidebarRef}>
            <div className="resize-handle" onMouseDown={startResizing} />

            <div className="inspector-sidebar">
                <button
                    className={`sidebar-icon-btn ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                    title="Info"
                >
                    <Info size={18} />
                </button>

                <button
                    className={`sidebar-icon-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                    title="History"
                >
                    <Clock size={18} />
                </button>
                <button
                    className={`sidebar-icon-btn ${activeTab === 'status' ? 'active' : ''}`}
                    onClick={() => setActiveTab('status')}
                    title="Status"
                >
                    <CheckCircle size={18} />
                </button>
                <button
                    className={`sidebar-icon-btn ${activeTab === 'likes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('likes')}
                    title="Approvals"
                >
                    <ThumbsUp size={18} />
                </button>
                <button
                    className={`sidebar-icon-btn ${activeTab === 'versions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('versions')}
                    title="Versions"
                >
                    <Layers size={18} />
                </button>
                <button
                    className={`sidebar-icon-btn ${activeTab === 'attachments' ? 'active' : ''}`}
                    onClick={() => setActiveTab('attachments')}
                    title="Attachments"
                >
                    <Paperclip size={18} />
                </button>

                <div className="sidebar-spacer"></div>

                <button
                    className="sidebar-icon-btn"
                    onClick={onClose}
                    title="Close Panel"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="inspector-content">
                <div className="inspector-header">
                    <h3>{activeTab === 'versions' ? 'Versions' : 'Details'}</h3>
                    {activeTab === 'versions' && (
                        <button className="upload-btn" onClick={() => setIsCreating(true)}>+ New Version</button>
                    )}
                </div>
                {renderContent()}
            </div>

            <ConfirmDialog
                isOpen={confirmState.isOpen}
                title={confirmState.title}
                message={confirmState.message}
                confirmText={confirmState.confirmText}
                isDangerous={confirmState.isDangerous}
                onConfirm={confirmState.onConfirm}
                onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
            />
        </aside>
    );
};

export default InspectorPanel;
