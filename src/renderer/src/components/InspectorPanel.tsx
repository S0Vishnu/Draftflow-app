import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
    X, Folder, File, Info, CheckCircle, Layers, Paperclip,
    CloudDownload, Trash2, GitBranch, RotateCcw, Plus, CheckSquare, Image as ImageIcon
} from 'lucide-react';
import { FileEntry } from './FileItem';
import './InspectorPanel.css';
import ConfirmDialog from './ConfirmDialog';

interface InspectorPanelProps {
    file: FileEntry | null;
    projectRoot: string;
    onClose: () => void;
    onRename?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
}

type Tab = 'info' | 'tasks' | 'versions' | 'attachments';

const MIN_WIDTH = 300;
const MAX_WIDTH = 800;

interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

interface AttachmentItem {
    id: string;
    type: 'image';
    path: string; // Internal path e.g. "attachments/..."
    name: string;
    createdAt: number;
}

const InspectorPanel: React.FC<InspectorPanelProps> = ({ file, projectRoot, onClose }) => {
    const [activeTab, setActiveTab] = useState<Tab>('versions');
    const [width, setWidth] = useState(420);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Tasks & Attachments State
    const [todos, setTodos] = useState<TodoItem[]>([]);
    const [newTodo, setNewTodo] = useState('');
    const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
    const [previewImage, setPreviewImage] = useState<string | null>(null);


    // Version State
    const [history, setHistory] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [versionLabel, setVersionLabel] = useState('');
    const [loading, setLoading] = useState(false);

    // Confirm Dialog State
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirm',
        isDangerous: false,
        onConfirm: () => { }
    });

    // Helper to get relative path
    const getRelativePath = useCallback(() => {
        if (!file || !projectRoot) return null;
        if (file.path.startsWith(projectRoot)) {
            let rel = file.path.substring(projectRoot.length);
            if (rel.startsWith('\\') || rel.startsWith('/')) rel = rel.substring(1);
            return rel;
        }
        return file.path;
    }, [file, projectRoot]);

    // Load Metadata
    useEffect(() => {
        if (!file || !projectRoot) return;

        const load = async () => {
            const relPath = getRelativePath();
            if (!relPath) return;

            try {
                // @ts-ignore
                const meta = await window.api.draft.getMetadata(projectRoot, relPath);
                if (meta) {
                    setTodos(meta.tasks || []);
                    setAttachments(meta.attachments || []);
                } else {
                    setTodos([]);
                    setAttachments([]);
                }
            } catch (e) {
                console.error("Failed to load metadata", e);
            }
        };
        load();
    }, [file, projectRoot, getRelativePath]);

    // Save Helpers
    const persistMetadata = async (newTodos: TodoItem[], newAttachments: AttachmentItem[]) => {
        const relPath = getRelativePath();
        if (!relPath || !projectRoot) return;

        try {
            // @ts-ignore
            await window.api.draft.saveMetadata(projectRoot, relPath, {
                tasks: newTodos,
                attachments: newAttachments
            });
        } catch (e) {
            console.error("Failed to save metadata", e);
        }
    };

    const saveTodos = (newTodos: TodoItem[]) => {
        setTodos(newTodos);
        persistMetadata(newTodos, attachments);
    };

    const saveAttachments = (newAttach: AttachmentItem[]) => {
        setAttachments(newAttach);
        persistMetadata(todos, newAttach);
    };

    // --- Logic for Tabs ---

    // Resize
    const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
        mouseDownEvent.preventDefault();
        setIsResizing(true);
    }, []);

    useEffect(() => {
        if (!isResizing) return;
        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = document.body.clientWidth - e.clientX;
            if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setWidth(newWidth);
        };
        const handleMouseUp = () => setIsResizing(false);
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

    // Versions
    useEffect(() => {
        if (activeTab === 'versions' && projectRoot && file) {
            // @ts-ignore
            window.api.draft.getHistory(projectRoot).then((fullHistory: any[]) => {
                const relPath = getRelativePath();
                if (!relPath) return;

                const filtered = fullHistory.filter(ver => {
                    if (ver.files[relPath]) return true;
                    // Normalized match
                    const normPath = relPath.replace(/\\/g, '/');
                    const hasKey = Object.keys(ver.files).some(k => k.replace(/\\/g, '/') === normPath);
                    return hasKey;
                });
                setHistory(filtered);
            });
        }
    }, [activeTab, projectRoot, file, getRelativePath]);

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
            // @ts-ignore
            await window.api.draft.commit(projectRoot, versionLabel, files);
            setVersionLabel('');
            setIsCreating(false);
            // @ts-ignore
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
                // @ts-ignore
                await window.api.draft.restore(projectRoot, vId);
                window.location.reload();
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDownload = async (ver: any) => {
        if (!file || !projectRoot) return;
        const relativePath = getRelativePath();
        if (!relativePath) return;

        const parts = file.name.split('.');
        let nameWithoutExt = file.name;
        let ext = "";
        if (parts.length > 1) {
            ext = "." + parts.pop();
            nameWithoutExt = parts.join('.');
        }

        const verNum = ver.versionNumber || '1';
        const newFileName = `${nameWithoutExt}-v${verNum}${ext}`;
        const parentDir = file.path.substring(0, file.path.lastIndexOf(file.name));
        const destPath = parentDir + newFileName;

        const performExtraction = async () => {
            try {
                // @ts-ignore
                await window.api.draft.extract(projectRoot, ver.id, relativePath, destPath);
            } catch (e: any) {
                alert(`Failed to save: ${e.message || e}`);
            }
            setConfirmState(prev => ({ ...prev, isOpen: false }));
        };

        // Check availability
        // @ts-ignore
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
                // @ts-ignore
                await window.api.draft.delete(projectRoot, vId);
                // @ts-ignore
                const newHistory = await window.api.draft.getHistory(projectRoot);
                setHistory(newHistory);
                setConfirmState(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Todo Logic
    const addTodo = () => {
        if (!newTodo.trim()) return;
        const item: TodoItem = {
            id: Date.now().toString(),
            text: newTodo.trim(),
            completed: false,
            createdAt: Date.now()
        };
        saveTodos([...todos, item]);
        setNewTodo('');
    };

    const toggleTodo = (id: string) => {
        const newList = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
        saveTodos(newList);
    };

    const deleteTodo = (id: string) => {
        saveTodos(todos.filter(t => t.id !== id));
    };

    // Attachment Logic
    const handleAddAttachment = async () => {
        if (!projectRoot) {
            alert("No project root found.");
            return;
        }

        // @ts-ignore
        const filePath = await window.api.openFile({
            filters: [
                { name: 'Images', extensions: ['jpg', 'png', 'gif', 'jpeg', 'webp', 'svg'] },
                { name: 'All Files', extensions: ['*'] }
            ]
        });

        if (filePath) {
            // @ts-ignore
            const result = await window.api.draft.saveAttachment(projectRoot, filePath);

            if (result.success) {
                const newAttach: AttachmentItem = {
                    id: Date.now().toString(),
                    type: 'image',
                    path: result.path,
                    name: filePath.split(/[/\\]/).pop() || 'image',
                    createdAt: Date.now()
                };
                saveAttachments([...attachments, newAttach]);
            } else {
                alert('Failed to save attachment');
            }
        }
    };

    const resolveAttachmentPath = (attPath: string) => {
        let fullPath = attPath;
        if (attPath.startsWith('attachments/')) {
            fullPath = `${projectRoot}/.draft/${attPath}`;
        }

        // Normalize slashes
        fullPath = fullPath.replace(/\\/g, '/');

        // Ensure absolute paths start with / for file:// protocol
        // e.g. C:/... -> /C:/... -> file:///C:/...
        if (!fullPath.startsWith('/')) {
            fullPath = '/' + fullPath;
        }

        return `file://${fullPath}`;
    };

    const deleteAttachment = (id: string) => {
        saveAttachments(attachments.filter(a => a.id !== id));
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
            case 'tasks':
                return (
                    <div className="tasks-container" style={{ padding: 20 }}>
                        <div className="add-task-row" style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                            <input
                                type="text"
                                className="creation-input"
                                placeholder="Add a new task..."
                                value={newTodo}
                                onChange={e => setNewTodo(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addTodo()}
                                style={{ marginBottom: 0 }}
                            />
                            <button className="btn-commit" onClick={addTodo}><Plus size={16} /></button>
                        </div>

                        <div className="tasks-list">
                            {todos.length === 0 && <div className="text-muted" style={{ textAlign: 'center', fontSize: 13 }}>No tasks yet.</div>}
                            {todos.map(todo => (
                                <div key={todo.id} className="task-item" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, background: '#1a1b20', padding: 8, borderRadius: 6 }}>
                                    <button
                                        onClick={() => toggleTodo(todo.id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: todo.completed ? '#4a5db5' : '#666', padding: 0 }}
                                    >
                                        {todo.completed ? <CheckSquare size={18} /> : <div style={{ width: 16, height: 16, border: '2px solid #666', borderRadius: 3 }}></div>}
                                    </button>
                                    <span style={{ flex: 1, textDecoration: todo.completed ? 'line-through' : 'none', color: todo.completed ? '#666' : '#eee', fontSize: 13 }}>
                                        {todo.text}
                                    </span>
                                    <button onClick={() => deleteTodo(todo.id)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 4 }} className="task-delete-btn">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
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
            case 'attachments':
                return (
                    <div className="attachments-container" style={{ padding: 20 }}>
                        <div style={{ marginBottom: 20 }}>
                            <button className="upload-btn" onClick={handleAddAttachment} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px' }}>
                                <Plus size={16} /> Add Image Reference
                            </button>
                        </div>

                        <div className="attachments-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                            gap: 12
                        }}>
                            {attachments.length === 0 && <div className="text-muted" style={{ gridColumn: '1/-1', textAlign: 'center', fontSize: 13 }}>No attachments yet.</div>}
                            {attachments.map(att => (
                                <div
                                    key={att.id}
                                    className="attachment-item"
                                    style={{
                                        position: 'relative',
                                        aspectRatio: '1',
                                        background: '#1a1b20',
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        border: '1px solid #2a2b36',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setPreviewImage(resolveAttachmentPath(att.path))}
                                >
                                    {att.type === 'image' && (
                                        <img
                                            src={resolveAttachmentPath(att.path)}
                                            alt={att.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                    )}
                                    <div className="attachment-overlay"
                                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                                    >
                                        <button onClick={(e) => { e.stopPropagation(); deleteAttachment(att.id); }} style={{ position: 'absolute', background: 'crimson', border: 'none', color: '#fff', borderRadius: 4, padding: 6, cursor: 'pointer', top: 6, right: 6 }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div style={{
                                        position: 'absolute', bottom: 0, left: 0, right: 0,
                                        background: 'rgba(0,0,0,0.8)', color: '#fff',
                                        fontSize: 10, padding: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                    }}>
                                        {att.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default:
                return null;
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
                    className={`sidebar-icon-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tasks')}
                    title="Tasks"
                >
                    <CheckCircle size={18} />
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
                    <h3>
                        {activeTab === 'versions' ? 'Versions' :
                            activeTab === 'tasks' ? 'Tasks' :
                                activeTab === 'attachments' ? 'Attachments' : 'Details'}
                    </h3>
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

            {previewImage && (
                <div
                    className="image-preview-modal"
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 9999,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'fadeIn 0.2s ease'
                    }}
                    onClick={() => setPreviewImage(null)}
                >
                    <button
                        onClick={() => setPreviewImage(null)}
                        style={{
                            position: 'absolute', top: 20, right: 20,
                            background: 'none', border: 'none', color: 'white', cursor: 'pointer'
                        }}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={previewImage}
                        alt="Preview"
                        style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                        onClick={e => e.stopPropagation()}
                    />
                </div>
            )}
        </aside>
    );
};

export default InspectorPanel;
