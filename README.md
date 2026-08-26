# Stock Price Project

This is a full-stack web application with a React frontend and a Node.js backend for tracking and analyzing stock prices.

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Make sure you have Node.js and npm installed on your machine.

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repository-url>
   ```

2. **Install all dependencies** (this installs dependencies for both frontend and backend):
   ```bash
   npm run install:all
   ```

### Running the App Locally

To start both the frontend and backend development servers at the same time, run:

```bash
npm run dev
```

This uses `concurrently` to run both servers simultaneously. 

- The **frontend** (React) usually runs on `http://localhost:5173` or `http://localhost:3000`.
- The **backend** runs on its specified port (check backend `.env` or configuration).

## 📂 Project Structure

- `/frontend` - Contains the React user interface.
- `/backend` - Contains the server-side logic and API endpoints.

## 🛠️ Scripts

- `npm run install:all` - Installs dependencies for root, frontend, and backend.
- `npm run dev` - Starts both frontend and backend servers.
- `npm run dev:frontend` - Starts only the frontend server.
- `npm run dev:backend` - Starts only the backend server.
