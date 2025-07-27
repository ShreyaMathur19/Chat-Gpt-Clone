import { useRef, useState } from 'react';
import { FaPaperPlane, FaPaperclip, FaTimes } from 'react-icons/fa';

const ChatInput = ({ input, setInput, file, setFile, handleSubmit, loading }) => {
    const fileInputRef = useRef(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            // Create a preview URL for images
            if (selectedFile.type.startsWith('image/')) {
                setPreviewUrl(URL.createObjectURL(selectedFile));
            } else {
                setPreviewUrl(null); // Non-image files show file name
            }
        } else {
            setFile(null);
            setPreviewUrl(null);
        }
    };

    const removeFile = () => {
        setFile(null);
        setPreviewUrl(null);
        fileInputRef.current.value = null;
    };

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-2 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
        >
            {/* Input and Buttons */}
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        disabled={loading}
                        className="w-full p-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="button"
                        onClick={triggerFileInput}
                        disabled={loading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-blue-500 disabled:opacity-50"
                    >
                        <FaPaperclip className="w-5 h-5" />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx"
                    />
                </div>
                <button
                    type="submit"
                    disabled={loading || (!input.trim() && !file)}
                    className="p-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    <FaPaperPlane className="w-5 h-5" />
                </button>
            </div>

            {/* File Preview */}
            {file && (
                <div className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt="File preview"
                            className="w-16 h-16 object-cover rounded-md"
                        />
                    ) : (
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                            {file.name}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={removeFile}
                        className="p-1 text-red-500 hover:text-red-600"
                    >
                        <FaTimes className="w-4 h-4" />
                    </button>
                </div>
            )}
        </form>
    );
};

export default ChatInput;