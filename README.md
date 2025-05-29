# WABot - Telegram Bot with AI Consultant

## Project Overview

A sophisticated Telegram bot featuring multiple conversation scenarios and AI-powered consultation mode. Built with modern web technologies for seamless integration between backend and frontend components.

### Technology Stack

**Backend:**

- TypeScript
- [grammy](https://grammy.dev/) framework
- AI Services: OpenAI, DeepSeek, GROQ

**Frontend:**

- Vite-powered React application
- Modern UI components

## 🚀 Getting Started

### Prerequisites

- Node.js (v16+ recommended)
- npm/yarn
- Telegram Bot Token
- API keys for AI services

### Installation

1. Clone the repository:

   ```bash
   git clone <your-repo-url>
   cd WABot
   ```

2. Install dependencies:

   ```bash
   # Backend dependencies
   cd backend
   npm install
   cd ..

   # Frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

### Environment Configuration

Create `.env` file in the backend folder with the following variables:

```ini
# Telegram Configuration
TG_TOKEN="your_telegram_bot_token_here"
TG_MANAGER_ID="your_telegram_user_id"

# AI Services Configuration
OPENAI_API_KEY="your_openai_api_key_here"
DEEPSEEK_API_KEY="your_deepseek_api_key_here"
GROQ_API_KEY="your_groq_api_key_here"
```

#### Environment Variables Reference:

| Variable         | Description                                       |
| ---------------- | ------------------------------------------------- |
| TG_TOKEN         | Telegram Bot API token (obtained from @BotFather) |
| TG_MANAGER_ID    | Telegram user ID for admin/manager access         |
| OPENAI_API_KEY   | API key for OpenAI services (GPT models)          |
| DEEPSEEK_API_KEY | API key for DeepSeek services                     |
| GROQ_API_KEY     | API key for GROQ services                         |

## 🛠 Project Scripts

Run these commands from the project root:

| Command                  | Description                                |
| ------------------------ | ------------------------------------------ |
| `npm run start:backend`  | Build and start backend bot                |
| `npm run start:frontend` | Start frontend development server          |
| `npm run start`          | Run both backend and frontend concurrently |

### package.json Configuration:

```json
{
  "name": "project-root",
  "private": true,
  "scripts": {
    "start:backend": "cd backend && npm run build && npm run start",
    "start:frontend": "cd frontend && npm run dev",
    "start": "concurrently \"npm run start:backend\" \"npm run start:frontend\""
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
```

### Manual Backend Build (Optional)

```bash
cd backend
npm run build
node dist/bot.js
```

## Project Structure

```
WABot/
├── backend/          # Backend application
│   ├── src/          # TypeScript source files
│   ├── .env          # Environment configuration
│   └── package.json  # Backend dependencies
└── frontend/         # Frontend application
    ├── public/       # Static assets
    ├── src/          # React components
    └── package.json  # Frontend dependencies
```
