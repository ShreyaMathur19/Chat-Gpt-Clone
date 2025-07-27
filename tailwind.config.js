/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        primary: '#2563eb', // Blue for user messages
        secondary: '#1f2937', // Gray for assistant messages
      },
    },
  },
  plugins: [],
}

