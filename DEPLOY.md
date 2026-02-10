# MPIS Deployment Guide (Hostinger)

## Prerequisites

- Node.js 18+ on the hosting server
- PM2 process manager (`npm install -g pm2`)
- Git access to the repository

## Local Development

1. Install dependencies:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. Create server environment file:
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env and set a strong JWT_SECRET
   ```

3. Start both frontend and backend in development:
   ```bash
   npm run dev:full
   ```
   This runs the Vite dev server (port 5173) and Express API server (port 3000) concurrently.
   The Vite dev server proxies `/api` requests to the backend automatically.

4. Alternatively, run them separately:
   ```bash
   npm run dev           # Frontend only (port 5173)
   npm run server:dev    # Backend only (port 3000)
   ```

## Production Build

```bash
npm run build:full
```

This will:
- Build the React frontend into `dist/`
- Install production server dependencies

## Deploying to Hostinger

### Option A: Hostinger Node.js Hosting (VPS)

1. SSH into your Hostinger VPS:
   ```bash
   ssh user@your-server-ip
   ```

2. Clone or pull the repository:
   ```bash
   git clone <repo-url> /var/www/mpis
   cd /var/www/mpis
   ```

3. Install dependencies and build:
   ```bash
   npm install
   npm run build:full
   ```

4. Create and configure environment:
   ```bash
   cp server/.env.example server/.env
   nano server/.env
   ```
   Set these values:
   - `PORT=3000`
   - `NODE_ENV=production`
   - `JWT_SECRET=<generate-a-strong-random-key>`
   - `CORS_ORIGIN=https://yourdomain.com`

5. Start with PM2:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

6. Configure your reverse proxy (Nginx/Apache) to forward traffic to port 3000.

### Option B: Hostinger Shared Hosting with Node.js

1. Upload the repository files via Git or FTP.

2. In Hostinger panel, set the Node.js application:
   - Application root: `/path/to/mpis`
   - Application startup file: `server/index.js`
   - Node.js version: 18+

3. Set environment variables in the Hostinger panel:
   - `PORT=3000`
   - `NODE_ENV=production`
   - `JWT_SECRET=<your-secret>`

4. The `.htaccess` file will proxy requests to the Node.js process.

## Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run dev:full` | Start frontend + backend concurrently |
| `npm run build` | Build frontend to dist/ |
| `npm run build:full` | Build frontend + install server deps |
| `npm run server:dev` | Start backend dev server (port 3000) |
| `npm run server:start` | Start backend in production mode |
| `npm start` | Start backend in production mode |

## PM2 Management

```bash
pm2 status          # Check process status
pm2 logs mpis       # View application logs
pm2 restart mpis    # Restart the application
pm2 stop mpis       # Stop the application
pm2 delete mpis     # Remove from PM2
```

## Database

The SQLite database is stored at `server/db/mpis.db`. It is automatically created on first server start with all required tables and a default admin user.

Default admin credentials (change after first login):
- Check `server/db/database.js` for the seeded admin account.

To back up the database, simply copy the `server/db/mpis.db` file.
