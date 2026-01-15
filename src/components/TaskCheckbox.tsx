
import React from 'react';
import taskDoneIcon from '../assets/task-done.png';

interface TaskCheckboxProps {
    checked: boolean;
    onChange: () => void;
}

const TaskCheckbox: React.FC<TaskCheckboxProps> = ({ checked, onChange }) => {
    return (
        <div 
            onClick={(e) => {
                e.stopPropagation();
                onChange();
            }}
            style={{
                width: 20,
                height: 20,
                borderRadius: 6, // Rounded box as requested
                border: checked ? '2px solid #4a5db5' : '2px solid #666',
                background: checked ? 'rgba(74, 93, 181, 0.1)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                flexShrink: 0
            }}
            title={checked ? "Mark as incomplete" : "Mark as complete"}
        >
            {checked && (
                <img 
                    src={taskDoneIcon} 
                    alt="Done" 
                    style={{
                        width: '70%',
                        height: '70%',
                        objectFit: 'contain',
                        // CSS Filter to colorize the icon to #4a5db5 (approximate) or white if the box is colored.
                        // If the user wants the PNG ITSELF to be the theme color:
                        filter: 'sepia(100%) saturate(300%) hue-rotate(190deg) brightness(90%) contrast(100%)' 
                        // Note: Filters are inexact. A better approach for "altering png color" 
                        // is typically masking, but that's complex for an img tag.
                        // Let's assume the user wants it to look "themed".
                        // Actually, if the box has a border, maybe the check should be filled?
                    }} 
                />
            )}
            
            {/* 
               Alternative for exact color match if the PNG is black/transparent:
               <div style={{
                   width: '70%', height: '70%',
                   backgroundColor: '#4a5db5',
                   maskImage: `url(${taskDoneIcon})`,
                   maskSize: 'contain',
                   maskRepeat: 'no-repeat',
                   maskPosition: 'center',
                   WebkitMaskImage: `url(${taskDoneIcon})`,
                   WebkitMaskSize: 'contain',
                   WebkitMaskRepeat: 'no-repeat',
                   WebkitMaskPosition: 'center'
               }} />
            */}
        </div>
    );
};

// I will use the mask approach effectively as it is the standard way 
// to "alter the png color" in CSS without messing with filters.
const TaskCheckboxFinal: React.FC<TaskCheckboxProps> = ({ checked, onChange }) => {
    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onChange();
            }}
            style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}
        >
            <div 
                style={{
                    position: 'relative',
                    width: 18,
                    height: 18,
                    // If not checked, show full border. If checked, we use the custom corner elements below
                    border: checked ? 'none' : '2px solid #666',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'transparent',
                    transition: 'all 0.2s'
                }}
            >
                {/* Custom Corner Borders for Checked State */}
                {checked && (
                    <>
                        {/* Top Left */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: 4, borderTop: '2px solid #4a5db5', borderLeft: '2px solid #4a5db5', borderTopLeftRadius: 4, pointerEvents: 'none' }} />
                        {/* Top Right */}
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 4, height: 4, borderTop: '2px solid #4a5db5', borderRight: '2px solid #4a5db5', borderTopRightRadius: 4, pointerEvents: 'none' }} />
                        {/* Bottom Left */}
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 4, height: 4, borderBottom: '2px solid #4a5db5', borderLeft: '2px solid #4a5db5', borderBottomLeftRadius: 4, pointerEvents: 'none' }} />
                        {/* Bottom Right */}
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 4, height: 4, borderBottom: '2px solid #4a5db5', borderRight: '2px solid #4a5db5', borderBottomRightRadius: 4, pointerEvents: 'none' }} />
                    </>
                )}
                {checked && (
                    <div 
                        style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: '#4a5db5',
                            maskImage: `url(${taskDoneIcon})`,
                            maskSize: 'contain',
                            maskRepeat: 'no-repeat',
                            maskPosition: 'center',
                            WebkitMaskImage: `url(${taskDoneIcon})`,
                            WebkitMaskSize: 'contain',
                            WebkitMaskRepeat: 'no-repeat',
                            WebkitMaskPosition: 'center'
                        }}
                    />
                )}
            </div>
        </button>
    );
};

export default TaskCheckboxFinal;
