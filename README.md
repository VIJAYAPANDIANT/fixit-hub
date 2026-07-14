# FixIt — 3D Cyber Debugging Command Center

FixIt is a futuristic, dark-themed, 3D interactive debugging dashboard built for developers to instantly diagnose and resolve code exceptions.

The application leverages a 3D animated environment built in Three.js/React Three Fiber, styled with a glassy, neon-bordered glassmorphic overlay using Tailwind CSS. It is backed by a Node.js Express server connected to a PostgreSQL database on port `5433` and Socket.io WebSockets for real-time multiplayer notification feeds.

## 🚀 Technical Architecture

- **Frontend Client**: React, Vite, Tailwind CSS v4, Three.js, React Three Fiber, OrbitControls, Lucide Icons, Canvas Confetti.
- **Backend API**: Node.js, Express, Socket.io, Postgres Client (`pg`), dotenv.
- **Database**: PostgreSQL (port `5433` for local user-level setup).

## 🛠️ Getting Started

### 1. Database Setup
Ensure PostgreSQL is installed locally. Run the database instance:
```bash
# Start PostgreSQL cluster using the local data path
& "C:\Program Files\PostgreSQL\18\bin\postgres.exe" -D "server/db_data" -p 5433
```

### 2. Run Backend API
Install dependencies and launch the Express server:
```bash
cd server
npm install
npm start
```

### 3. Run Frontend Dev Server
Install frontend assets and launch the Vite client:
```bash
cd client
npm install
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to access your Debugging Command Center.
