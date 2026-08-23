# FixIt Hub Website User & Features Guide 🚀

Welcome to **FixIt Hub**! This guide walks you through the entire web dashboard layout, detailing how to onboard, navigate workspaces, triage exceptions, collaborate on fixes, and configure real-time alert integrations.

---

## 📌 Table of Contents
* [🎬 1. Getting Started](#-1-getting-started)
* [📂 2. Project Workspaces](#-2-project-workspaces)
* [📊 3. Active Issues & Triage Dashboard](#-3-active-issues--triage-dashboard)
* [🤖 4. Advanced AI Diagnostics](#-4-advanced-ai-diagnostics)
* [💬 5. Collaborative Resolution Tools](#-5-collaborative-resolution-tools)
* [⚙️ 6. Real-Time Alert Integrations (Slack & Discord)](#-6-real-time-alert-integrations-slack--discord)
* [💡 7. Advanced Developer Tips](#-7-advanced-developer-tips)

---

## 🎬 1. Getting Started

### Step A: Account Registration
1. Navigate to the deployed **Frontend Dashboard** (e.g., `https://fixit-hub-api.vercel.app/`).
2. Click **Don't have an account? Sign Up** to switch to Registration Mode.
3. Fill in your **Name**, **Email ID**, and **Password**.
4. Select your role (e.g., `Developer` or `Admin`).
5. Click the **Register ➔** button.

### Step B: Account Activation & Login
* **Admin Roles**: Accounts registered with the `ADMIN` role are activated **immediately** and can log in without verification.
* **Developer/User Roles**: Registered accounts are placed in `PENDING_VERIFICATION` status. In a local development setup, copy the verification token from your database (`verification_tokens` table) and visit the backend endpoint:
  ```
  https://your-backend-api.onrender.com/api/auth/verify?token=YOUR_TOKEN_HERE
  ```
* Once activated, return to the login screen, enter your credentials, and click **Sign In ➔**.

---

## 📂 2. Project Workspaces

FixIt Hub aggregates error logs by **Projects**. 
* **Workspace Selector**: Located in the top-left corner of the header. Click the dropdown to switch between projects (e.g., `vj`).
* **Multi-Project Management**: Switching projects instantly updates the active issues list, search scope, and alert settings to only show telemetry relating to that application workspace.

---

## 📊 3. Active Issues & Triage Dashboard

Upon logging in, you are directed to the **Home (Active Issues & Triage)** feed. This is the central hub for monitoring exception feeds in real time.

### A. Real-Time Ingestion Feed
Each card in the list represents a unique exception fingerprint:
* **Headers**: Displays the **Severity** badge (e.g., `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), the **Status** badge (`UNRESOLVED`, `INVESTIGATING`, `RESOLVED`, `SILENCED`), and the **Language/Framework** tags (e.g., `TypeScript`, `Express`).
* **Title & Message**: Shows the exception class and the core error message text.
* **Metadata Footer**: Displays total occurrences, view count, timestamp of last occurrence, and the assigned developer.

### B. Filtering & Sorting Controls
Refine your active feed using the dashboard control bar:
1. **Search Keyword**: Type any part of the error title, message, or stacktrace to filter instantly.
2. **Status**: Filter by specific lifecycle stages.
3. **Severity**: Isolate `CRITICAL` or `HIGH` bugs during outages.
4. **Difficulty**: Filter by estimated fix difficulty (`EASY`, `MEDIUM`, `HARD`).
5. **Sort By**: Toggle between `Newest` (recently seen) or `Popularity` (highest occurrences count) to prioritize high-impact issues.

---

## 🤖 4. Advanced AI Diagnostics

One of FixIt Hub's most powerful features is its native integration with the **Google Gemini AI API** to provide automated code diagnostics.

### How to use AI Diagnostics:
1. Click on any error card in the feed to open the **Error Details** page.
2. You will see the complete, formatted **Stacktrace** and metadata.
3. Scroll to the **AI Diagnostic Analysis** panel.
4. Click the **Request AI Diagnostics** button.
5. The worker will process the stack trace and return:
   * **Confidence Score**: An accuracy rating (0.0 to 1.0) indicating the model's certainty.
   * **Summary**: A high-level description of what went wrong.
   * **Root Cause**: A detailed technical breakdown explaining the underlying issue.
   * **Fix Suggestion**: Markdown-formatted drop-in code blocks showing you exactly how to refactor your code to fix the exception.

> [!NOTE]
> **Deduplicated Cache**: Once AI diagnostic feedback is generated for an issue fingerprint, it is persisted. Subsequent views load the solution instantly without making additional remote LLM API calls.

---

## 💬 5. Collaborative Resolution Tools

FixIt Hub provides tools to coordinate bug-fixing across your developer team:

### A. Owner & Developer Assignment
Assign triage responsibilities directly on the Details page:
* Use the **Assign To** dropdown to allocate ownership of the bug to yourself or a teammate.

### B. Lifecycle Triaging
Update the issue state as you make progress:
* Toggle the status dropdown at the top right of the details page to move it from `UNRESOLVED` ➔ `INVESTIGATING` ➔ `RESOLVED`.

### C. Developer Comments Thread
Coordinate fixes directly on the issue page:
* Scroll to the **Discussion & Activity** section.
* Post questions, paste logs, or link pull requests. The comments are loaded in chronological order.

### D. Custom Solutions & Voting
Developers can propose human-verified fixes:
* Write and submit custom solutions in the **Solutions** tab.
* Teammates can **Upvote** or **Downvote** solutions to bubble up the best fixes.
* Admins can check **Accept Solution** to mark a solution as the official fix, which links it as the primary solution for future duplicate crashes.

### E. Bookmarking Feed
* Click the **Bookmark** star icon on any issue card or detail page.
* Access all your pinned bugs from the left navigation bar under **Bookmarks** for quick reference during debugging.

---

## ⚙️ 6. Real-Time Alert Integrations (Slack & Discord)

FixIt Hub natively integrates with Slack and Discord channels to alert developers the moment a crash occurs in production.

### Setting Up a Webhook Channel:
1. Navigate to **Settings** from the left-hand navigation bar.
2. Scroll to the **Real-Time Webhook Alert Channels** panel.
3. Click **Add Webhook Channel**.
4. Configure the details:
   * **Name**: Reference name (e.g., `#dev-alerts`).
   * **URL**: Paste your Slack incoming webhook URL or Discord webhook URL.
   * **Type**: Select `Slack` or `Discord` from the dropdown.
5. Click **Save Webhook**.

### Verifying and Toggling Alerts:
* **Ping Test**: Click the **Play (Test Connection)** icon next to your webhook configuration. FixIt Hub will dispatch a simulated error alert directly to your Slack/Discord channel. Verify that you receive the card notification.
* **Active Toggle**: Use the toggle switch to enable or disable individual alert channels on the fly during maintenance windows.

---

## 💡 7. Advanced Developer Tips

### Theme Toggles
* Click the **Sun/Moon Icon** in the top-right header to switch between light mode and dark mode. The selected preference is saved to local storage.

### Profile Customization
* Navigate to **Profile** to view your active role permissions (`DEVELOPER` or `ADMIN`), registration timestamp, and a breakdown of your assigned issues.
