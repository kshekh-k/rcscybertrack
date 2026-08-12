# RCS CyberTrack — Web Administration GUI

This directory contains the high-fidelity web management dashboard for the RCS CyberTrack security appliance. The interface is engineered with a premium, responsive, dark-enterprise aesthetic and connects directly to the system management API.

---

## 🛠 Tech Stack
* **Framework**: React 19 (TypeScript)
* **Build Tool**: Vite 6
* **Styling**: Tailwind CSS v4
* **Icons**: Lucide React
* **Router**: React Router v6

---

## 🚀 Running the GUI

### 1. Install Node Dependencies
Ensure you have **Node.js 18+** installed.
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
By default, the interface runs locally at: [http://localhost:5174](http://localhost:5174)

### 3. Build for Production
Compiles TypeScript and bundles static assets:
```bash
npm run build
```

---

## 🔑 Login Credentials

The GUI enforces route-level authentication. The following default credentials can be used to log in:

| Username | Password | Role | Permissions |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | `admin` | Full CRUD privileges + audit logs view |
| `operator` | `operator123` | `operator` | Full CRUD privileges (no audit access) |
| `viewer` | `viewer123` | `viewer` | Read-only access |

---

## 🔌 API Proxy Integration
During development, Vite is configured to proxy all frontend HTTP requests starting with `/api` to the backend REST API:
* **Vite Dev Server**: `http://localhost:5174`
* **FastAPI Backend Server**: `http://localhost:8000` (mapped via `vite.config.ts`)

---

## 📂 Folder Structure
* `src/app/` — Global routing configuration (`router.tsx`).
* `src/components/layout/` — Layout shell, sidebar, and header navigation.
* `src/lib/` — API fetch client and utility styling functions.
* `src/pages/` — Core admin views (Dashboard, Firewall, Network, Devices, Audit, Settings).
