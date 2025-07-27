import { FaUser, FaRobot } from 'react-icons/fa';
import { format } from 'date-fns';
import TypingIndicator from './TypingIndicator';

const ChatMessages = ({ messages, loading }) => {
    // Fallback for invalid or missing createdAt
    const formatTimestamp = (createdAt) => {
        try {
            const date = new Date(createdAt);
            if (isNaN(date.getTime())) {
                return 'Just now';
            }
            return format(date, 'HH:mm');
        } catch (err) {
            console.warn('⚠️ Invalid timestamp:', createdAt, err);
            return 'Just now';
        }
    };

    return (
        <div className="flex flex-col space-y-4 p-4 overflow-y-auto h-full">
            {messages.map((msg) => (
                <div
                    key={msg._id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                        className={`flex items-start gap-2 max-w-[70%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}
                    >
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            {msg.role === 'user' ? (
                                <FaUser className="w-8 h-8 text-gray-600" />
                            ) : (
                                <FaRobot className="w-8 h-8 text-blue-500" />
                            )}
                        </div>

                        {/* Message Bubble */}
                        <div
                            className={`rounded-lg p-3 ${msg.role === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : msg.role === 'assistant'
                                        ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white'
                                        : 'bg-red-100 text-red-900'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-semibold">
                                    {msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'Assistant' : 'System'}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatTimestamp(msg.createdAt)}
                                </span>
                            </div>
                            <p className="text-sm">{msg.content}</p>
                            {msg.fileUrl && (
                                <a
                                    href={msg.fileUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    View Attachment
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="flex items-center gap-2">
                        <FaRobot className="w-8 h-8 text-blue-500" />
                        <div className="bg-gray-100 rounded-lg p-3">
                            <TypingIndicator />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatMessages;