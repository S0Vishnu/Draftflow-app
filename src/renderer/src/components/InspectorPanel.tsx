import React from 'react';
import { X, Folder, File, Info } from 'lucide-react';
import { FileEntry } from './FileItem';

interface InspectorPanelProps {
    file: FileEntry | null;
    onClose: () => void;
    onRename?: (e: React.MouseEvent) => void;
    onDelete?: (e: React.MouseEvent) => void;
}

const InspectorPanel: React.FC<InspectorPanelProps> = ({ file, onClose }) => {
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

    return (
        <aside className="inspector-panel">
            <div className="inspector-header">
                <h3>Details</h3>
                <button onClick={onClose}><X size={16} /></button>
            </div>

            {!file ? (
                <div className="empty-state" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Info size={48} className="text-muted" style={{ opacity: 0.3 }} />
                </div>
            ) : (
                <>
                    <div className="preview-large">
                        {file.isDirectory ?
                            <Folder size={64} className="preview-icon-folder" /> :
                            <File size={64} className="preview-icon-file" />
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
            )}
        </aside>
    );
};

export default InspectorPanel;
