import React, { useState, useEffect, useRef } from 'react';
import { useAuthState, useSignOut } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { FileEntry } from '../components/FileItem';

// Components
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Toolbar from '../components/Toolbar';
import FileList from '../components/FileList';
import InspectorPanel from '../components/InspectorPanel';
import ContextMenu from '../components/ContextMenu';
import ConfirmDialog from '../components/ConfirmDialog';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Styles
import './AuthShared.css';
import Footer from '../components/Footer';

const Home = () => {
    const [user] = useAuthState(auth);
    const [signOut] = useSignOut(auth);
    const navigate = useNavigate();

    // Layout
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [isPreviewOpen, setPreviewOpen] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);

    // Data
    const [currentPath, setCurrentPath] = useState<string | null>(() => localStorage.getItem('lastPath') || null);
    const [rootDir, setRootDir] = useState<string | null>(() => localStorage.getItem('rootDir') || null);
    const [files, setFiles] = useState<FileEntry[]>([]);

    useEffect(() => {
        if (currentPath) {
            localStorage.setItem('lastPath', currentPath);
            loadDirectory(currentPath);
        }
    }, [currentPath]);

    useEffect(() => {
        if (rootDir) localStorage.setItem('rootDir', rootDir);
        else localStorage.removeItem('rootDir');
    }, [rootDir]);

    // UIState
    const [viewMode, setViewMode] = useState<'list' | 'grid'>(() =>
        (localStorage.getItem('viewMode') as 'list' | 'grid') || 'grid'
    );

    useEffect(() => {
        localStorage.setItem('viewMode', viewMode);
    }, [viewMode]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof FileEntry, direction: 'asc' | 'desc' } | null>(null);

    // Selection
    const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
    const [lastSelectedPath, setLastSelectedPath] = useState<string | null>(null);

    // Box Selection State
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionBox, setSelectionBox] = useState<{ x: number, y: number, width: number, height: number } | null>(null);
    const selectionStart = useRef<{ x: number, y: number } | null>(null);
    const initialSelection = useRef<Set<string>>(new Set());

    // History
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Actions
    const [renamingFile, setRenamingFile] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    // Creation
    const [isCreating, setIsCreating] = useState<'folder' | 'file' | null>(null);
    const [creationName, setCreationName] = useState('');

    // Context Menu
    const [contextMenu, setContextMenu] = useState<{
        x: number;
        y: number;
        target?: FileEntry;
    } | null>(null);

    // Clipboard
    const [appClipboard, setAppClipboard] = useState<{
        paths: string[];
        op: 'copy' | 'cut';
    } | null>(null);

    // Dialogs
    const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean, targets: FileEntry[] }>({ isOpen: false, targets: [] });

    // Computed
    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const [activeFile, setActiveFile] = useState<FileEntry | null>(null);

    useEffect(() => {
        if (selectedPaths.size === 1) {
            const path = Array.from(selectedPaths)[0];
            const file = files.find(f => f.path === path) || null;
            setActiveFile(file);
        } else {
            setActiveFile(null);
        }
    }, [selectedPaths, files]);

    // Watcher
    useEffect(() => {
        if (!currentPath) return;

        // Start watching the current directory
        window.api.watchDir(currentPath).catch(err => console.error("Watcher error:", err));

        let timeout: NodeJS.Timeout;
        const unsubscribe = window.api.onFileChange((data) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                refreshDirectory();
            }, 300); // 300ms debounce
        });

        return () => {
            clearTimeout(timeout);
            unsubscribe();
        };
    }, [currentPath]);

    const handleSignOut = () => {
        signOut();
        navigate('/');
    };

    // Data Loading
    const fetchStats = async (entry: FileEntry): Promise<FileEntry> => {
        try {
            const stats = await window.api.getStats(entry.path);
            if (stats) {
                return {
                    ...entry,
                    size: stats.size,
                    mtime: new Date(stats.mtime),
                    type: stats.isDirectory ? 'Folder' : (entry.name.split('.').pop()?.toUpperCase() || 'File') + ' File'
                };
            }
        } catch (e) { console.error(e); }
        return entry;
    };

    const loadDirectory = async (path: string) => {
        if (!path) return;
        setIsLoading(true);
        try {
            const entries = await window.api.readDir(path);
            let processed = await Promise.all(entries.map(fetchStats));

            if (sortConfig) {
                processed = sortFiles(processed, sortConfig);
            } else {
                processed.sort((a, b) => {
                    if (a.isDirectory === b.isDirectory) return a.name.localeCompare(b.name);
                    return a.isDirectory ? -1 : 1;
                });
            }

            setFiles(processed);
            setCurrentPath(path);
            setSelectedPaths(new Set());
            setLastSelectedPath(null);
            setIsCreating(null);
        } catch (error: any) {
            console.error("Failed to load directory", error);

            // Check for ENOENT (Folder deleted)
            if (error.code === 'ENOENT' || error.message?.includes('ENOENT') || error.message?.includes('no such file')) {
                toast.error("Folder not found. Navigating to parent.");
                const parent = path.split(/[/\\]/).slice(0, -1).join('/') || '/'; // Simple parent calc
                // Check if we hit root or empty
                if (!parent || parent === path) {
                    setCurrentPath(null);
                    // Actually we can try to go home? 
                    // But we don't know user home easily without IPC.
                    // Let's just set null and show empty state or Sidebar will handle it.
                } else {
                    navigateTo(parent);
                }
            } else {
                toast.error('Failed to load directory');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const sortFiles = (fileList: FileEntry[], config: { key: keyof FileEntry, direction: 'asc' | 'desc' }) => {
        return [...fileList].sort((a, b) => {
            if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
            let valA = a[config.key] || '';
            let valB = b[config.key] || '';
            if (valA < valB) return config.direction === 'asc' ? -1 : 1;
            if (valA > valB) return config.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const handleDoubleClick = (path: string) => {
        const file = files.find(f => f.path === path);
        if (!file) return;

        if (file.isDirectory) {
            navigateTo(path);
        } else {
            window.api.openPath(path);
        }
    };

    const handleSort = (key: keyof FileEntry) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        setFiles(prev => sortFiles(prev, { key, direction }));
    };

    const refreshDirectory = () => { if (currentPath) loadDirectory(currentPath); };

    // Navigation
    const handleOpenFolder = async () => {
        const path = await window.api.openFolder();
        if (path) {
            setRootDir(path); // Set the root directory for breadcrumbs
            setHistory([path]);
            setHistoryIndex(0);
            loadDirectory(path);
        }
    };

    const navigateTo = (path: string) => {
        if (path === currentPath) return;
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(path);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        loadDirectory(path);
    };

    const navigateBack = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            loadDirectory(history[newIndex]);
        }
    };

    const navigateForward = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            loadDirectory(history[newIndex]);
        }
    };

    // Selection
    const handleSelectFile = (e: React.MouseEvent, file: FileEntry) => {
        e.stopPropagation();

        let newSelection = new Set(selectedPaths);
        if (e.ctrlKey) {
            if (newSelection.has(file.path)) {
                newSelection.delete(file.path);
            } else {
                newSelection.add(file.path);
            }
            setLastSelectedPath(file.path);
        } else if (e.shiftKey && lastSelectedPath) {
            const lastIndex = filteredFiles.findIndex(f => f.path === lastSelectedPath);
            const currentIndex = filteredFiles.findIndex(f => f.path === file.path);
            if (lastIndex !== -1 && currentIndex !== -1) {
                const start = Math.min(lastIndex, currentIndex);
                const end = Math.max(lastIndex, currentIndex);
                newSelection = new Set();
                for (let i = start; i <= end; i++) {
                    newSelection.add(filteredFiles[i].path);
                }
            }
        } else {
            newSelection = new Set([file.path]);
            setLastSelectedPath(file.path);
        }

        setSelectedPaths(newSelection);
        // Removed auto-preview logic as requested
    };

    // Box Selection
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        if (!contentRef.current) return;

        // Clear selection if not Ctrl
        if (!e.ctrlKey) {
            setSelectedPaths(new Set());
            initialSelection.current = new Set();
        } else {
            initialSelection.current = new Set(selectedPaths);
        }

        const rect = contentRef.current.getBoundingClientRect();
        const scrollLeft = contentRef.current.scrollLeft;
        const scrollTop = contentRef.current.scrollTop;

        const x = e.clientX - rect.left + scrollLeft;
        const y = e.clientY - rect.top + scrollTop;

        setIsSelecting(true);
        selectionStart.current = { x, y };
        setSelectionBox({ x, y, width: 0, height: 0 });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isSelecting || !selectionStart.current || !contentRef.current) return;

            const rect = contentRef.current.getBoundingClientRect();
            const scrollLeft = contentRef.current.scrollLeft;
            const scrollTop = contentRef.current.scrollTop;

            const currentX = e.clientX - rect.left + scrollLeft;
            const currentY = e.clientY - rect.top + scrollTop;

            const startX = selectionStart.current.x;
            const startY = selectionStart.current.y;

            // Update Visual Box (Absolute coordinates relative to content area)
            setSelectionBox({
                x: Math.min(startX, currentX),
                y: Math.min(startY, currentY),
                width: Math.abs(currentX - startX),
                height: Math.abs(currentY - startY)
            });

            // Calculate Intersection (Viewport coordinates)
            // Box in Viewport
            const boxLeft = Math.min(startX, currentX) - scrollLeft + rect.left;
            const boxTop = Math.min(startY, currentY) - scrollTop + rect.top;
            const boxRight = boxLeft + Math.abs(currentX - startX);
            const boxBottom = boxTop + Math.abs(currentY - startY);

            const selRect = {
                left: boxLeft,
                top: boxTop,
                right: boxRight,
                bottom: boxBottom
            };

            const newSelection = new Set(initialSelection.current);
            const items = contentRef.current.querySelectorAll('[data-path]');

            items.forEach((item) => {
                const itemRect = item.getBoundingClientRect();
                const path = item.getAttribute('data-path');

                const intersects = !(
                    selRect.left > itemRect.right ||
                    selRect.right < itemRect.left ||
                    selRect.top > itemRect.bottom ||
                    selRect.bottom < itemRect.top
                );

                if (intersects && path) {
                    newSelection.add(path);
                }
            });

            setSelectedPaths(newSelection);
        };

        const handleMouseUp = () => {
            if (isSelecting) {
                setIsSelecting(false);
                setSelectionBox(null);
                selectionStart.current = null;
            }
        };

        if (isSelecting) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isSelecting]);

    // Context Menu
    const handleContextMenu = (e: React.MouseEvent, file?: FileEntry) => {
        e.preventDefault();
        e.stopPropagation();
        if (file) {
            if (!selectedPaths.has(file.path)) {
                setSelectedPaths(new Set([file.path]));
                setLastSelectedPath(file.path);
            }
            setContextMenu({ x: e.clientX, y: e.clientY, target: file });
        } else {
            setContextMenu({ x: e.clientX, y: e.clientY });
        }
    };

    const closeContextMenu = () => setContextMenu(null);

    const getSelectedFiles = () => files.filter(f => selectedPaths.has(f.path));

    const confirmDelete = async (targets: FileEntry[]) => {
        const confirmed = await window.api.confirm({
            message: `Are you sure you want to delete ${targets.length} item(s)? This action cannot be undone.`,
            title: 'Delete Items',
            type: 'warning',
            buttons: ['Delete', 'Cancel']
        });

        if (confirmed) {
            handleDeleteConfirm(targets);
        }
    };

    const handleDeleteConfirm = async (targets: FileEntry[]) => {
        try {
            let successCount = 0;
            for (const t of targets) {
                const success = await window.api.deleteEntry(t.path);
                if (success) successCount++;
            }
            if (successCount > 0) {
                toast.success(`Deleted ${successCount} item(s)`);
            }
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete items');
        }
    };

    const startRenaming = (e: React.MouseEvent | undefined, file: FileEntry) => {
        e?.stopPropagation();
        setRenamingFile(file.path);
        setRenameValue(file.name);
        setIsCreating(null);
    };

    const cancelRenaming = () => {
        setRenamingFile(null);
        setRenameValue('');
    };

    const handleRenameSubmit = async () => {
        if (!renamingFile || !currentPath || !renameValue) return;
        const newPath = `${currentPath}/${renameValue}`;
        const success = await window.api.renameEntry(renamingFile, newPath);
        if (success) {
            setRenamingFile(null);
            refreshDirectory();
            toast.success('Renamed successfully');
        }
        else toast.error("Failed to rename.");
    };

    const getUniqueName = (baseName: string, isFolder: boolean) => {
        let name = baseName;
        let counter = 1;
        while (files.find(f => f.name === name)) {
            name = `${baseName} (${counter})`;
            counter++;
        }
        return name;
    };

    const initCreateFolder = () => {
        if (!currentPath) return;
        setIsCreating('folder');
        setCreationName(getUniqueName('New Folder', true));
        setRenamingFile(null);
        setSelectedPaths(new Set());
    };

    const initCreateFile = () => {
        if (!currentPath) return;
        setIsCreating('file');
        setCreationName(getUniqueName('New Text Document.txt', false));
        setRenamingFile(null);
        setSelectedPaths(new Set());
    };

    const cancelCreation = () => {
        setIsCreating(null);
        setCreationName('');
    };

    const submitCreation = async () => {
        if (!currentPath || !isCreating || !creationName.trim()) {
            cancelCreation();
            return;
        }
        const targetPath = `${currentPath}/${creationName.trim()}`;
        const success = isCreating === 'folder'
            ? await window.api.createFolder(targetPath)
            : await window.api.createFile(targetPath);

        if (success) {
            setIsCreating(null);
            refreshDirectory();
            toast.success(`Created ${isCreating}`);
        } else {
            toast.error("Failed to create item");
        }
    };

    const handleDelete = async (e: React.MouseEvent | undefined, entry: FileEntry) => {
        e?.stopPropagation();
        confirmDelete([entry]);
    };

    const menuActions = {
        open: () => {
            const targets = getSelectedFiles();
            if (targets.length === 1) {
                if (targets[0].isDirectory) navigateTo(targets[0].path);
                else window.api.openPath(targets[0].path);
            }
        },
        preview: () => {
            const targets = getSelectedFiles();
            if (targets.length === 1) setPreviewOpen(true);
        },
        rename: () => {
            const targets = getSelectedFiles();
            if (targets.length === 1) startRenaming(undefined, targets[0]);
        },
        delete: () => {
            const targets = getSelectedFiles();
            if (targets.length > 0) confirmDelete(targets);
        },
        copy: () => {
            const paths = Array.from(selectedPaths);
            if (paths.length) setAppClipboard({ paths, op: 'copy' });
        },
        cut: () => {
            const paths = Array.from(selectedPaths);
            if (paths.length) setAppClipboard({ paths, op: 'cut' });
        },
        paste: async () => {
            if (!appClipboard || !currentPath) return;
            for (const src of appClipboard.paths) {
                const srcName = src.split(/[/\\]/).pop() || 'unknown';
                let dest = `${currentPath}/${srcName}`;

                // Collision handling
                if (appClipboard.op === 'copy') {
                    // If file exists, find unique name
                    // Pattern: name (N).ext
                    let finalName = srcName;
                    let counter = 1;

                    const nameParts = srcName.split('.');
                    const ext = nameParts.length > 1 ? `.${nameParts.pop()}` : '';
                    const base = nameParts.join('.');

                    while (files.find(f => f.name === finalName)) {
                        finalName = `${base} (${counter})${ext}`;
                        counter++;
                    }
                    dest = `${currentPath}/${finalName}`;
                    await window.api.copyEntry(src, dest);
                }
                else {
                    // Cut/Move
                    await window.api.renameEntry(src, dest);
                }
            }
            if (appClipboard.op === 'cut') setAppClipboard(null);
            refreshDirectory();
            toast.success(`Pasted ${appClipboard.paths.length} item(s)`);
        },
        newFolder: () => initCreateFolder(),
        newFile: () => initCreateFile(),
        refresh: () => refreshDirectory(),
        showInExplorer: () => {
            const targets = getSelectedFiles();
            if (targets.length === 1) window.api.showInFolder(targets[0].path);
        }
    };

    const handleInspectorClose = () => setPreviewOpen(false);

    const getContextMenuOptions = () => {
        if (!contextMenu) return [];
        if (contextMenu.target) {
            const isMulti = selectedPaths.size > 1;
            return [
                { label: 'Open', action: menuActions.open, disabled: isMulti },
                { label: 'Open Details', action: menuActions.preview, disabled: isMulti },
                { label: 'Show in Explorer', action: menuActions.showInExplorer, disabled: isMulti },
                { label: 'Rename', action: menuActions.rename, shortcut: 'F2', disabled: isMulti },
                { label: 'Cut', action: menuActions.cut, shortcut: 'Ctrl+X' },
                { label: 'Copy', action: menuActions.copy, shortcut: 'Ctrl+C' },
                { label: 'Delete', action: menuActions.delete, shortcut: 'Del', danger: true },
            ];
        }
        return [
            { label: 'New Folder', action: menuActions.newFolder, shortcut: 'Ctrl+Shift+N' },
            { label: 'New Text File', action: menuActions.newFile, shortcut: 'Ctrl+N' },
            { label: 'Refresh', action: menuActions.refresh },
            { label: 'Paste', action: menuActions.paste, shortcut: 'Ctrl+V', disabled: !appClipboard },
        ];
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isCtrl = e.ctrlKey || e.metaKey;
            const key = e.key.toLowerCase();

            if (renamingFile || isCreating) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    cancelRenaming();
                    cancelCreation();
                }
                return;
            }

            // Global shortcuts
            if (isCtrl && key === 'c' && selectedPaths.size > 0) { e.preventDefault(); menuActions.copy(); }
            if (isCtrl && key === 'x' && selectedPaths.size > 0) { e.preventDefault(); menuActions.cut(); }
            if (isCtrl && key === 'v') { e.preventDefault(); menuActions.paste(); }
            if (isCtrl && key === 'a') { e.preventDefault(); setSelectedPaths(new Set(filteredFiles.map(f => f.path))); }
            if (e.key === 'Escape') { e.preventDefault(); setSelectedPaths(new Set()); }

            if (isCtrl && e.shiftKey && key === 'n') { e.preventDefault(); initCreateFolder(); }
            else if (isCtrl && key === 'n') { e.preventDefault(); initCreateFile(); }

            if (e.key === 'Backspace' && !renamingFile && !isCreating) {
                e.preventDefault();
                navigateBack();
            }

            if (selectedPaths.size > 0 || lastSelectedPath) {
                if (e.key === 'F2') { e.preventDefault(); menuActions.rename(); }
                if (e.key === 'Delete') { e.preventDefault(); menuActions.delete(); }
            }

            // Arrow Navigation
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
                if (filteredFiles.length === 0) return;

                let nextIndex = 0;
                const currentIndex = lastSelectedPath
                    ? filteredFiles.findIndex(f => f.path === lastSelectedPath)
                    : -1;

                if (currentIndex === -1) {
                    nextIndex = 0;
                } else {
                    if (viewMode === 'list') {
                        if (e.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - 1);
                        if (e.key === 'ArrowDown') nextIndex = Math.min(filteredFiles.length - 1, currentIndex + 1);
                        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') nextIndex = currentIndex;
                    } else {
                        // Grid Heuristics
                        if (e.key === 'ArrowLeft') nextIndex = Math.max(0, currentIndex - 1);
                        if (e.key === 'ArrowRight') nextIndex = Math.min(filteredFiles.length - 1, currentIndex + 1);

                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            let cols = 1;
                            if (contentRef.current) {
                                const width = contentRef.current.clientWidth - 32;
                                cols = Math.floor(width / 116);
                                if (cols < 1) cols = 1;
                            }
                            if (e.key === 'ArrowUp') nextIndex = Math.max(0, currentIndex - cols);
                            if (e.key === 'ArrowDown') nextIndex = Math.min(filteredFiles.length - 1, currentIndex + cols);
                        }
                    }
                }

                if (nextIndex >= 0 && nextIndex < filteredFiles.length) {
                    const nextFile = filteredFiles[nextIndex];
                    setSelectedPaths(new Set([nextFile.path]));
                    setLastSelectedPath(nextFile.path);

                    const el = document.querySelector(`[data-path="${nextFile.path.replace(/\\/g, '\\\\')}"]`);
                    if (el) el.scrollIntoView({ block: 'nearest' });
                }
            }

            if (e.key === 'Enter') {
                if (selectedPaths.size === 1) {
                    const file = filteredFiles.find(f => f.path === lastSelectedPath);
                    if (file && file.isDirectory) { navigateTo(file.path); }
                    else if (file) { window.api.openPath(file.path); }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedPaths, lastSelectedPath, renamingFile, isCreating, filteredFiles, appClipboard, currentPath, viewMode]);

    return (
        <div className="app-shell" style={{ flexDirection: 'column' }}>
            <div className="app-inner" style={{ display: 'flex', flex: 1, overflow: 'hidden', width: '100%' }}>
                <Sidebar
                    isOpen={isSidebarOpen}
                    user={user}
                    onOpenFolder={handleOpenFolder}
                    onSignOut={handleSignOut}
                />

                <main className="main-content">
                    <Header
                        isSidebarOpen={isSidebarOpen}
                        toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
                        isPreviewOpen={isPreviewOpen}
                        togglePreview={() => setPreviewOpen(!isPreviewOpen)}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        refreshDirectory={refreshDirectory}
                        isLoading={isLoading}
                    />

                    <Toolbar
                        currentPath={currentPath}
                        historyIndex={historyIndex}
                        historyLength={history.length}
                        viewMode={viewMode}
                        onNavigateBack={navigateBack}
                        onNavigateForward={navigateForward}
                        onOpenWorkspace={handleOpenFolder}
                        onCreateFolder={initCreateFolder}
                        onCreateFile={initCreateFile}
                        setViewMode={setViewMode}
                        onNavigate={navigateTo}
                        rootDir={rootDir}
                    />

                    <div
                        className="content-area"
                        ref={contentRef}
                        onMouseDown={handleMouseDown}
                        onContextMenu={(e) => handleContextMenu(e)}
                    >
                        <FileList
                            files={filteredFiles}
                            viewMode={viewMode}
                            selectedPaths={selectedPaths}
                            renamingFile={renamingFile}
                            renameValue={renameValue}
                            sortConfig={sortConfig}
                            isCreating={isCreating}
                            creationName={creationName}
                            onSort={handleSort}
                            onSelect={handleSelectFile}
                            onNavigate={handleDoubleClick}
                            onRenameChange={setRenameValue}
                            onRenameSubmit={handleRenameSubmit}
                            onRenameCancel={cancelRenaming}
                            onContextMenu={handleContextMenu}
                            onCreationChange={setCreationName}
                            onCreationSubmit={submitCreation}
                            onCreationCancel={cancelCreation}
                        />

                        {isSelecting && selectionBox && (
                            <div
                                className="selection-box"
                                style={{
                                    left: selectionBox.x,
                                    top: selectionBox.y,
                                    width: selectionBox.width,
                                    height: selectionBox.height
                                }}
                            />
                        )}
                    </div>
                </main>

                {isPreviewOpen && (
                    <InspectorPanel
                        file={activeFile}
                        onClose={handleInspectorClose}
                    />
                )}
            </div>
            <Footer />

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    options={getContextMenuOptions()}
                    onClose={closeContextMenu}
                />
            )}

            <ToastContainer
                position="bottom-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="dark"
            />

            <style>{`
                /* Previous CSS ... */
                :root {
                    --bg-app: #09090b;
                    --bg-sidebar: #18181b;
                    --bg-header: #09090b;
                    --bg-content: #09090b;
                    --bg-hover: #27272a;
                    --bg-selected: rgba(59, 130, 246, 0.15);
                    --border: #27272a;
                    --text-main: #e4e4e7;
                    --text-muted: #a1a1aa;
                    --accent: #3b82f6;
                    --danger: #ef4444;
                    --folder-color: #eab308;
                    --file-color: #3b82f6;
                }

                * { box-sizing: border-box; }

                .app-shell {
                    display: flex; height: 100vh; width: 100vw;
                    background: var(--bg-app); color: var(--text-main);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    overflow: hidden;
                    font-size: 13px;
                }

                /* Sidebar */
                .sidebar { width: 64px; background: var(--bg-sidebar); border-right: 1px solid var(--border); flex-shrink: 0; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow: hidden; }
                .sidebar.collapsed { width: 0; border: none; }
                .sidebar-content { height: 100%; display: flex; flex-direction: column; align-items: center; padding: 16px 0; justify-content: space-between; }
                .side-btn { 
                    width: 40px; height: 40px; border-radius: 8px; border: none; background: transparent; 
                    color: var(--text-muted); display: flex; align-items: center; justify-content: center; 
                    cursor: pointer; margin-bottom: 8px; transition: all 0.2s; 
                }
                .side-btn:hover { background: var(--bg-hover); color: white; }
                .side-btn.active { background: rgba(59, 130, 246, 0.1); color: var(--accent); }

                /* Main */
                .main-content { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--bg-content); }

                /* Top Bar */
                .top-bar {
                    height: 52px; border-bottom: 1px solid var(--border);
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0 16px; background: var(--bg-header);
                }
                .icon-btn-ghost { 
                    width: 32px; height: 32px; border-radius: 6px; border: none; background: transparent; 
                    color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; 
                }
                .icon-btn-ghost:hover { background: var(--bg-hover); color: white; }
                
                .search-container {
                    flex: 1; max-width: 480px; height: 32px; background: var(--bg-sidebar);
                    border: 1px solid var(--border); border-radius: 6px;
                    display: flex; align-items: center; padding: 0 10px; margin: 0 16px;
                    transition: border-color 0.2s;
                }
                .search-container:focus-within { border-color: var(--accent); }
                .search-icon { color: var(--text-muted); margin-right: 8px; }
                .search-container input {
                    flex: 1; background: transparent; border: none; color: white; outline: none; font-size: 13px;
                }

                .header-right { display: flex; gap: 4px; }
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }

                /* Toolbar */
                .toolbar {
                    height: 48px; border-bottom: 1px solid var(--border);
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 0 16px; background: var(--bg-app);
                }
                .path-breadcrumbs { display: flex; align-items: center; gap: 12px; overflow: hidden; }
                .nav-arrows { display: flex; gap: 2px; }
                .nav-btn { background: transparent; border: none; color: var(--text-muted); padding: 4px; border-radius: 4px; cursor: pointer; }
                .nav-btn:hover:not(:disabled) { background: var(--bg-hover); color: white; }
                .nav-btn:disabled { opacity: 0.3; cursor: default; }
                .divider-v { width: 1px; height: 20px; background: var(--border); }
                
                .breadcrumbs-list { display: flex; align-items: center; gap: 6px; white-space: nowrap; overflow: hidden; mask-image: linear-gradient(to right, black 90%, transparent 100%); }
                .crumb-home { color: var(--text-muted); }
                .crumb-part { font-weight: 500; color: var(--text-main); }
                .crumb-sep { color: var(--text-muted); opacity: 0.5; }

                .actions-group { display: flex; gap: 8px; flex-shrink: 0; }
                .primary-btn {
                    background: var(--accent); color: white; border: none;
                    padding: 6px 12px; border-radius: 6px; font-weight: 500; cursor: pointer;
                }
                .primary-btn:hover { background: #2563eb; }
                .action-btn {
                    background: var(--bg-sidebar); border: 1px solid var(--border); color: var(--text-main);
                    padding: 6px 12px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 12px;
                }
                .action-btn:hover { background: var(--bg-hover); }
                .icon-btn { 
                    width: 32px; height: 32px; border-radius: 6px; border: 1px solid transparent; background: transparent; 
                    color: var(--text-muted); display: flex; align-items: center; justify-content: center; cursor: pointer; 
                }
                .icon-btn:hover { background: var(--bg-hover); color: white; }
                .icon-btn.active { background: var(--bg-selected); color: var(--accent); }

                /* List View Header */
                .list-header {
                    display: grid;
                    grid-template-columns: 40px 3fr 140px 100px 100px 80px;
                    padding: 0 16px;
                    height: 36px;
                    align-items: center;
                    border-bottom: 1px solid var(--border);
                    color: var(--text-muted);
                    font-size: 12px;
                    font-weight: 600;

                }
                .col { padding: 0 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .sortable { cursor: pointer; transition: color 0.2s; }
                .sortable:hover { color: var(--text-main); }

                /* Content Area */
                .content-area { flex: 1; overflow-y: auto; padding-bottom: 40px; position: relative; }
                
                /* List Rows */
                .file-list { display: flex; flex-direction: column; }
                .list-row {
                    display: grid;
                    grid-template-columns: 40px 3fr 140px 100px 100px 80px;
                    height: 40px;
                    align-items: center;
                    padding: 0 16px;
                    border-bottom: 1px solid transparent;
                    cursor: default;
                    transition: background 0.1s;
                }
                .list-row:hover { background: var(--bg-hover); }
                .list-row.selected { background: var(--bg-selected); }
                
                .folder-icon { color: var(--folder-color); fill: var(--folder-color); fill-opacity: 0.2; }
                .file-icon { color: var(--file-color); }
                
                .col-name { display: flex; align-items: center; font-weight: 500; }
                .name-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                
                .col-date, .col-size, .col-type { color: var(--text-muted); font-size: 12px; }
                
                /* Rename Input */
                /* Rename Input */
                .rename-box { width: 100%; display: flex; flex: 1; min-width: 0; }
                .rename-box input {
                    width: 100%; background: var(--bg-app); 
                    border: 1px solid var(--accent); color: white;
                    padding: 0 4px; height: 20px;
                    border-radius: 2px; outline: none; font-size: 13px;
                    font-family: inherit;
                }
                .rename-box-grid { width: 100%; display: flex; margin-top: 8px; }
                .rename-box-grid input {
                    width: 100%; background: var(--bg-app); 
                    border: 1px solid var(--accent); color: white;
                    padding: 2px; border-radius: 2px; outline: none; 
                    font-size: 12px; text-align: center;
                    font-family: inherit;
                }

                /* Grid View */
                .file-grid {
                    display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                    gap: 16px; padding: 16px;
                }
                .grid-card {
                    display: flex; flex-direction: column; align-items: center; text-align: center;
                    padding: 16px; border-radius: 8px; border: 1px solid transparent;
                    transition: all 0.2s; position: relative;
                }
                .grid-card:hover { background: var(--bg-hover); }
                .grid-card.selected { background: var(--bg-selected); border-color: rgba(59, 130, 246, 0.3); }
                .folder-icon-large { color: var(--folder-color); fill: var(--folder-color); fill-opacity: 0.2; }
                .file-icon-large { color: var(--file-color); }
                .card-name { margin-top: 8px; font-size: 12px; word-break: break-all; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; width: 100%; }

                /* Inspector Panel */
                .inspector-panel {
                    width: 280px; background: var(--bg-sidebar); border-left: 1px solid var(--border);
                    display: flex; flex-direction: column; padding: 20px; overflow-y: auto;
                }
                .inspector-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
                .inspector-header h3 { font-size: 14px; font-weight: 600; margin: 0; }
                .inspector-header button { background: transparent; border: none; color: var(--text-muted); cursor: pointer; }
                
                .preview-large { display: flex; justify-content: center; margin-bottom: 32px; }
                .preview-icon-folder { color: var(--folder-color); fill: var(--folder-color); fill-opacity: 0.2; }
                .preview-icon-file { color: var(--file-color); }

                .inspector-props { flex: 1; display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; }
                .prop-row { display: flex; flex-direction: column; gap: 4px; }
                .prop-row label { color: var(--text-muted); font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
                .prop-row .val { color: var(--text-main); font-size: 13px; font-variant-numeric: tabular-nums; }
                .prop-row .path-val { word-break: break-all; font-family: monospace; font-size: 11px; background: rgba(0,0,0,0.2); padding: 4px; border-radius: 4px; }

                .inspector-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .inspector-btn {
                    background: var(--bg-hover); border: 1px solid var(--border); color: var(--text-main);
                    padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;
                }
                .inspector-btn:hover { background: #3f3f46; }
                .inspector-btn.danger { color: var(--danger); border-color: rgba(239, 68, 68, 0.2); }
                .inspector-btn.danger:hover { background: rgba(239, 68, 68, 0.1); }

                .empty-state { padding: 48px; text-align: center; color: var(--text-muted); }

                /* Box Selection */
                .selection-box {
                    position: absolute;
                    background: rgba(59, 130, 246, 0.2);
                    border: 1px solid rgba(59, 130, 246, 0.5);
                    z-index: 50;
                    pointer-events: none;
                }
                
                /* Context Menu */
                .context-menu {
                    position: fixed; z-index: 1000;
                    background: #18181b; border: 1px solid #27272a;
                    border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
                    padding: 4px; min-width: 160px;
                    display: flex; flex-direction: column; gap: 2px;
                }
                .menu-item {
                    background: transparent; border: none; color: #e4e4e7;
                    padding: 6px 12px; text-align: left; cursor: pointer; border-radius: 4px;
                    display: flex; justify-content: space-between; align-items: center;
                    font-size: 13px;
                }
                .menu-item:hover:not(:disabled) { background: #3b82f6; color: white; }
                .menu-item.danger:hover:not(:disabled) { background: #ef4444; }
                .menu-item:disabled { opacity: 0.5; cursor: default; }
                .menu-item .shortcut { color: #a1a1aa; font-size: 11px; margin-left: 12px; }
                .menu-item:hover .shortcut { color: rgba(255,255,255,0.8); }
            `}</style>
        </div>
    );
};


export default Home;
