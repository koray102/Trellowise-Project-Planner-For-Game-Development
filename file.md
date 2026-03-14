PROJECT PLAN: GDS (GameDev Sync) - Team Management & Conflict Prevention Tool
1. Project Overview
A specialized management dashboard for a 4-person Unity game development team. The primary goal is to prevent Git merge conflicts in Unity (Scenes/Prefabs) and streamline task tracking and team communication.

2. Core Architecture & Tech Stack (Proposed)
Framework: React with Vite or Next.js (App Router).

Styling: Tailwind CSS (Dark Mode by default).

Backend/Real-time: Supabase (Database + Real-time subscriptions for "Occupieds" and "Online" status).

State Management: React Context or Zustand.

3. Detailed Features & Logic
A. Global Navigation
Sidebar: Links to Dashboard, Calendar, Tasks, and Occupieds.

User Context: A way to simulate or select which of the 4 users is currently active.

B. Dashboard (The Nerve Center)
Presence System: Real-time indicator of who is online.

My Tasks: Filtered view of tasks assigned to the current user.

Global Announcements: Simple CRUD for team-wide notes.

C. Calendar (Interactive)
View: Clean monthly grid.

Event Modal: Click to add/edit events with:

Title, Description, Date/Time.

Comment Thread: Each event should have a dedicated comment section for team discussion.

D. Tasks (Multi-User Kanban)
4-User Filter: Top navigation bar with 4 names. Clicking a name switches the entire board to that person's tasks.

Columns (The 4 Pillars):

To Do: Not started.

In Progress: Currently active.

Done: Completed.

Debt/Backlog (İdareten): Temporarily fixed or needs refactoring later.

Functionality: Drag-and-drop support (using dnd-kit or react-beautiful-dnd).

E. Occupieds (Conflict Prevention Engine)
Crucial: This part prevents two people from opening the same Unity Scene/Prefab simultaneously.

Categories: Scenes, Scripts, Prefabs.

Search & Create: Search bar for existing objects. If not found, a + button to add a new entry to the database.

Locking Logic:

"I am working on this" button for each item.

When clicked, the item is marked as "Occupied by [User Name]".

Pinned Priority: All occupied items must automatically move to the top of the list.

Visual Warning: Distinct color/border for occupied items to warn others.

4. Technical Requirements for Implementation
Database Schema:

users: id, name, avatar, online_status.

tasks: id, assigned_to, title, description, status (todo, progress, done, debt).

calendar_events: id, title, description, date, created_by.

comments: id, event_id, user_id, content.

occupied_items: id, name, type (scene/script/prefab), occupied_by (nullable), last_updated.

Real-time Sync: The "Occupieds" and "Online" status MUST use WebSockets/Supabase Realtime to update all users' screens without refreshing.

UI/UX Style: Minimalist, high contrast, dark-themed, "Developer-friendly" look.

5. Execution Steps for Antigravity
Step 1: Initialize the project structure with React and Tailwind CSS.

Step 2: Setup the Database Schema (Supabase/Firebase).

Step 3: Build the Sidebar and Navigation logic.

Step 4: Implement the "Occupieds" logic first (High Priority).

Step 5: Build the Task Kanban and Calendar systems.

Step 6: Final UI polish and Dark Mode optimization.