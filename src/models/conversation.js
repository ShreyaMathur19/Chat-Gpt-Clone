// models/Conversation.js
import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
    title: String,
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
