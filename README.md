# Chat Assistant

A modern, responsive chat application built with Next.js, Tailwind CSS, and MongoDB, inspired by Grok and ChatGPT. Features include real-time chat with AI responses, conversation history, image uploads with previews, and a clean, dark-mode-compatible UI.

## Features

- **Real-Time Chat**: Send messages and receive streaming AI responses powered by OpenAI.
- **Conversation History**: View and manage past conversations via a responsive sidebar.
- **Image Uploads**: Upload images or files with a preview (thumbnails for images, file names for others) and remove option.
- **Responsive Design**: Mobile-friendly UI with a collapsible sidebar and no overlap issues.
- **Dark Mode**: Seamless light/dark mode support using Tailwind CSS.
- **Landing Page**: Simple entry point at `/` with a button to navigate to the chat page.

## Prerequisites

- **Node.js**: Version 18.x or higher.
- **MongoDB**: A running MongoDB instance (local or cloud, e.g., MongoDB Atlas).
- **OpenAI API Key**: Required for AI chat functionality.
- **npm**: Package manager for installing dependencies.

## Installation

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd chat-assistant
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**:
   Create a `.env.local` file in the root directory and add the following:
   ```env
   MONGODB_URI=mongodb://<username>:<password>@<host>/<database>
   OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```
   - Replace `MONGODB_URI` with your MongoDB connection string (e.g., from MongoDB Atlas).
   - Replace `OPENAI_API_KEY` with your OpenAI API key.

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser to view the app.

## File Structure

```
chat-assistant/
├── app/
│   ├── api/
│   │   ├── memory/
│   │   │   └── route.js         # API endpoints for chat and conversation management
│   │   └── upload/
│   │       └── route.js        # API endpoint for file uploads
│   ├── chat/
│   │   ├── components/
│   │   │   ├── ChatInput.jsx    # Input form with file upload and preview
│   │   │   ├── ChatMessages.jsx # Message display with timestamps
│   │   │   ├── Sidebar.jsx      # Conversation history sidebar
│   │   │   └── TypingIndicator.jsx # Typing animation for AI responses
│   │   └── page.js              # Chat page with sidebar and main content
│   ├── page.js                  # Landing page with "Go to Chat" button
│   └── globals.css              # Tailwind CSS custom styles
|
├── lib/
│   ├── dbConnect.js             # MongoDB connection utility
│   └── openai.js                # OpenAI client configuration
├── models/
│   ├── conversation.js          # MongoDB schema for conversations
│   └── message.js               # MongoDB schema for messages
├── public/                      # Static assets (if any)
├── .env.local                   # Environment variables (not tracked)
├── package.json                 # Dependencies and scripts
├── tailwind.config.js           # Tailwind CSS configuration
└── README.md                    # This file
```

## Dependencies

- **Next.js**: Framework for server-side rendering and routing.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **React Icons**: Icons for UI elements (e.g., user, robot, paperclip).
- **date-fns**: Date formatting for message timestamps.
- **date-fns-tz**: UTC timezone support for consistent timestamps.
- **mongoose**: MongoDB ORM for database operations.
- **openai**: Client for OpenAI API integration.
- **next/link**: Client-side navigation for the landing page.

Install dependencies with:
```bash
npm install next react react-dom tailwindcss react-icons date-fns date-fns-tz mongoose openai
```

## API Endpoints

- **GET /api/memory?all=1**:
  - Fetches all conversations for the sidebar.
  - Response: `{ conversations: [{ _id, title, createdAt, ... }] }`

- **GET /api/memory?conversationId=<id>**:
  - Fetches messages for a specific conversation.
  - Response: `{ messages: [{ _id, role, content, fileUrl, createdAt, ... }] }`

- **POST /api/memory**:
  - Saves a user message and creates a new conversation if none exists.
  - Body: `{ content, fileUrl, role, conversationId, replyTo }`
  - Response: `{ messageId, conversationId }`

- **POST /api/memory?stream=1**:
  - Streams AI responses for a user message.
  - Body: `{ content, fileUrl, role, conversationId, replyTo }`
  - Response: Server-Sent Events (SSE) with `{ delta, messageId, done }`

- **DELETE /api/memory?conversationId=<id>**:
  - Deletes a conversation and its messages.
  - Response: `{ success: true }`

- **POST /api/upload**:
  - Uploads a file (e.g., image, PDF).
  - Body: FormData with `file`
  - Response: `{ secure_url }` or `{ url }`

## Features in Detail

- **Landing Page**: A minimal page at `/` with a "Go to Chat" button for navigation.
- **Chat Interface**: Displays user and assistant messages with avatars (user/robot icons), timestamps (UTC), and file links.
- **Sidebar**: Lists conversation history, supports creating new chats, and deleting existing ones. Collapsible on mobile with a hamburger menu.
- **File Uploads**: Users can upload images or files, with previews (thumbnails for images, file names for others) and a remove option.
- **Streaming Responses**: AI responses stream in real-time with a typing indicator.
- **Responsive UI**: Optimized for mobile and desktop, with no overlap (e.g., header and sidebar toggle).

## Development Notes

- Ensure MongoDB is running and `MONGODB_URI` is correct.
- Test the OpenAI API key with `/api/test-openai` (if implemented).
- Use `npm run dev` for local development and check console logs for debugging.

## Deployment

See the deployment section below for instructions on deploying to Vercel.