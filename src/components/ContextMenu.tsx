import React, { useEffect, useRef } from 'react';

interface ContextMenuProps {
    x: number;
    y: number;
    options: {
        label: string;
        action: () => void;
        shortcut?: string;
        danger?: boolean;
        disabled?: boolean;
    }[];
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, options, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = React.useState({ x, y });

    React.useLayoutEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            let newX = x;
            let newY = y;

            // Check right edge
            if (x + rect.width > window.innerWidth) {
                newX = window.innerWidth - rect.width - 8;
            }
            // Check bottom edge
            if (y + rect.height > window.innerHeight) {
                newY = window.innerHeight - rect.height - 8;
            }

            setPosition({ x: newX, y: newY });
        }
    }, [x, y]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        // We use mousedown to feel more native, firing before click
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    const style: React.CSSProperties = {
        top: position.y,
        left: position.x,
        position: 'fixed', // Ensure it's fixed relative to viewport
        zIndex: 9999
    };

    return (
        <div ref={menuRef} className="context-menu" style={style} onContextMenu={(e) => e.preventDefault()}>
            {options.map((opt, i) => (
                <button
                    key={i}
                    className={`menu-item ${opt.danger ? 'danger' : ''}`}
                    onClick={() => { if (!opt.disabled) { opt.action(); onClose(); } }}
                    disabled={opt.disabled}
                >
                    <span className="label">{opt.label}</span>
                    {opt.shortcut && <span className="shortcut">{opt.shortcut}</span>}
                </button>
            ))}
        </div>
    );
};

export default ContextMenu;
