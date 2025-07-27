import { FaPlus, FaTrash } from 'react-icons/fa';

const Sidebar = ({ conversations, setConversationId, handleNewChat, handleDeleteConversation, loading }) => {
    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen p-4 flex flex-col">
            <button
                onClick={handleNewChat}
                disabled={loading}
                className="flex items-center gap-2 p-2 mb-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
                <FaPlus className="w-4 h-4" />
                New Chat
            </button>
            <div className="flex-1 overflow-y-auto">
                <h2 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-2">Conversations</h2>
                <ul className="space-y-2">
                    {conversations.map((conv) => (
                        <li key={conv._id} className="flex items-center justify-between">
                            <button
                                onClick={() => setConversationId(conv._id)}
                                className="flex-1 text-left p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {conv.title || 'Untitled'}
                            </button>
                            <button
                                onClick={() => handleDeleteConversation(conv._id)}
                                disabled={loading}
                                className="p-2 text-red-500 hover:text-red-600"
                            >
                                <FaTrash className="w-4 h-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </aside>
    );
};

export default Sidebar;