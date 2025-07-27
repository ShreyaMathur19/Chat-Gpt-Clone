// In MessageBubble.js


export default function MessageBubble({ message }) {
    const isUser = message.role === "user";
    const isSystem = message.role === "system";

    return (
        <div
            className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}
        >
            <div
                className={`max-w-md p-3 rounded-lg ${isUser
                    ? "bg-blue-600 text-white"
                    : isSystem
                        ? "bg-red-600 text-white"
                        : "bg-zinc-800 text-zinc-200"
                    }`}
            >
                {message.content}
                {message.fileUrl && (
                    <div className="mt-2">
                        {message.fileUrl.match(/\.(jpeg|jpg|png|gif)$/i) ? (
                            <img
                                src={message.fileUrl}
                                alt="attachment"
                                className="max-w-full h-auto rounded"
                            />
                        ) : (
                            <a
                                href={message.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-300 underline"
                            >
                                View Attachment
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}