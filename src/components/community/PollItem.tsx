import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { updateDoc, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trash2 } from 'lucide-react';

interface PollOption {
    id: number;
    text: string;
    votes: string[]; // array of userIds
}

interface PollMessage {
    id: string;
    question: string;
    options: PollOption[];
    userId: string;
    displayName: string;
    createdAt: any;
    expiresAt: any;
}

interface PollItemProps {
    message: PollMessage;
    currentUser: User | null | undefined;
    isAdmin: boolean;
    onDelete: (id: string) => void;
}

const PollItem: React.FC<PollItemProps> = ({ message, currentUser, isAdmin, onDelete }) => {
    const totalVotes = message.options.reduce((acc, opt) => acc + opt.votes.length, 0);

    const handleVote = async (optionId: number) => {
        if (!currentUser) return;

        // Optimistic UI could be handled here, but for now we rely on Firestore stream
        // We need to remove user from OTHER options first (if single choice)
        // Assuming single choice for now as typical for simple polls.

        try {
            // Check if user already voted for this option
            const currentOption = message.options.find(o => o.id === optionId);
            const hasVotedThis = currentOption?.votes.includes(currentUser.uid);

            const newOptions = message.options.map(opt => {
                if (opt.id === optionId) {
                    // Toggle vote
                    if (hasVotedThis) {
                        return { ...opt, votes: opt.votes.filter(u => u !== currentUser.uid) };
                    } else {
                        return { ...opt, votes: [...opt.votes, currentUser.uid] };
                    }
                } else {
                    // Remove from others if single choice desired. Let's assume multi-choice allowed based on "polling with multiple options" phrasing? 
                    // "Polling with multiple options" usually means the poll HAS multiple options, not necessarily that user can SELECT multiple.
                    // But standard polls usually force single choice. Let's enforce single choice for better data.
                    return { ...opt, votes: opt.votes.filter(u => u !== currentUser.uid) };
                }
            });

            await updateDoc(doc(db, 'community_messages', message.id), {
                options: newOptions
            });

        } catch (error) {
            console.error("Vote failed:", error);
        }
    };

    return (
        <div className="poll-card">
            <div className="poll-header">
                <span className="poll-author">{message.displayName} asks:</span>
                {isAdmin && (
                    <button onClick={() => onDelete(message.id)} className="poll-delete-btn">
                        <Trash2 size={14} />
                    </button>
                )}
            </div>
            <h3 className="poll-question">{message.question}</h3>

            <div className="poll-options">
                {message.options.map((opt) => {
                    const count = opt.votes.length;
                    const percent = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                    const isVoted = currentUser && opt.votes.includes(currentUser.uid);

                    return (
                        <div
                            key={opt.id}
                            className={`poll-option ${isVoted ? 'voted' : ''}`}
                            onClick={() => handleVote(opt.id)}
                        >
                            <div className="poll-bar-bg">
                                <div className="poll-bar-fill" style={{ width: `${percent}%` }}></div>
                            </div>
                            <div className="poll-option-content">
                                <span className="poll-option-text">{opt.text}</span>
                                <span className="poll-option-stats">{percent}% ({count})</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="poll-footer">
                {totalVotes} votes • Expires in {Math.ceil((message.expiresAt?.toMillis() - Date.now()) / (1000 * 60 * 60 * 24))} days
            </div>
        </div>
    );
};

export default PollItem;
