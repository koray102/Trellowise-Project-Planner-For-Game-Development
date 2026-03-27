# Trellowise Project Planner For Game Development

![Trellowise](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/React-19-blue)
![Vite](https://img.shields.io/badge/Vite-5-purple)
![Supabase](https://img.shields.io/badge/Supabase-Realtime-green)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-38B2AC)
![License](https://img.shields.io/badge/License-MIT-yellow)

**Trellowise** is a specialized, real-time lightweight project management and collaboration tool built specifically for Game Development teams (especially those using Unity). It helps teams avoid merge conflicts by tracking who is working on what, while also providing a seamless Kanban board, team calendar, and real-time presence tracking.

## ✨ Features

- 🔒 **Asset Locks & Occupieds**: Prevent Unity merge conflicts. Lock Scenes, Prefabs, and Scripts. Let your team know you are currently working on them.
- 📋 **Kanban Task Board**: A fluid drag-and-drop task management board (`Todo`, `In Progress`, `Done`, `Tech Debt`) built with `dnd-kit`.
- 📅 **Calendar & Events**: Keep track of sprints, alpha/beta deadlines, team meetings, and milestones.
- ⚡ **Real-Time Sync**: Everything updates instantly across clients without needing to refresh, powered by Supabase Realtime.
- 🟢 **Live Presence**: Instantly see who is currently online, away, or offline.
- 💬 **Announcements**: Broadcast important messages directly to your team's dashboard.

## 🛠 Usage & Technologies Stack

- **Frontend Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Drag and Drop**: `@dnd-kit`
- **Backend / Database**: Supabase (PostgreSQL + Realtime Channels)
- **Icons**: Lucide React

---

## 🚀 Getting Started

Follow these steps to install, run, and self-host Trellowise from scratch.

### 1. Prerequisites
- Node.js (v18+)
- A free [Supabase](https://supabase.com/) account.

### 2. Setup Supabase Database
1. Create a new project on Supabase.
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Open the `schema.sql` file provided in this repository, copy its contents, and execute it to create all tables (`users`, `occupied_items`, `tasks`, `events`, `announcements`, `config`).
4. Enable **Realtime** for all the tables you just created (Go to Database -> Replication -> Enable for all tables).

### 3. Clone and Install
```bash
git clone https://github.com/yourusername/trellowise-project-planner.git
cd trellowise-project-planner
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory and add your Supabase credentials (found in Supabase Settings -> API):

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_PASSWORD=your_secure_site_password
```
*(The `VITE_APP_PASSWORD` is used for simple site-wide access gating).*

### 5. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) to view it in the browser. 

---

## 🌍 Deployment

You can easily deploy Trellowise to platforms like **Vercel** or **Netlify**.

### Deploying to Vercel
1. Push your code to a GitHub repository.
2. Log into [Vercel](https://vercel.com) and click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Expand **Environment Variables** and add your `.env` variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_PASSWORD`).
5. Click **Deploy**. Vercel will automatically build (`npm run build`) and serve the application.

*Note: The project comes with a `vercel.json` to handle client-side routing automatically.*

---

## 📄 License

This project is open-sourced software licensed under the **MIT License**. 

Anyone is free to use, modify, and distribute this software for personal and commercial game development projects! Happy coding! 🎮
