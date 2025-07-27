// scrollToBottom.js
// Helper to scroll to the bottom of a chat container using a ref

export default function scrollToBottom(ref) {
    if (ref && ref.current) {
        ref.current.scrollIntoView({ behavior: "smooth" });
    }
} 