import React from 'react';
import { Hash, Volume2, Mic, Radio, MessageSquare } from 'lucide-react';

const channels = [
    { id: 'general', name: 'General', type: 'text', icon: Hash },
    { id: 'help', name: 'Help & Support', type: 'text', icon: Hash },
    { id: 'announcements', name: 'Announcements', type: 'text', icon: Volume2 },
    { id: 'polls', name: 'Community Polls', type: 'text', icon: MessageSquare },
];

interface ChannelListProps {
    activeChannel: string;
    onSelectChannel: (id: string) => void;
}

const ChannelList: React.FC<ChannelListProps> = ({ activeChannel, onSelectChannel }) => {
    return (
        <div className="channel-list">
            <h3 style={{ padding: '0 12px', marginBottom: '10px', fontSize: '12px', textTransform: 'uppercase', color: '#666', fontWeight: 'bold' }}>
                Channels
            </h3>
            {channels.map(channel => (
                <div
                    key={channel.id}
                    className={`channel-item ${activeChannel === channel.id ? 'active' : ''}`}
                    onClick={() => onSelectChannel(channel.id)}
                >
                    <channel.icon size={16} style={{ marginRight: '8px', opacity: 0.7 }} />
                    <span>{channel.name}</span>
                </div>
            ))}
        </div>
    );
};

export default ChannelList;
