# Real-Time Network Malpractice Detection for Online Exams

Full-stack system to monitor exam-lab network traffic, generate malpractice alerts in real time, and provide a teacher dashboard with live statistics, session control, authentication, device management, and history exports.

## Stack

- Frontend: React + Vite + Socket.IO client
- Backend: Node.js + Express + Socket.IO
- Database: PostgreSQL
- Monitor Agent: Python + Scapy (DNS sniffing)

## Project Structure

- `server/` Express API, Socket.IO server, PostgreSQL migration
- `client/` React dashboard with live updates
- `monitor/` Python script posting suspicious events to backend

## Backend APIs

- `POST /api/auth/register` - register teacher
- `POST /api/auth/login` - login teacher and receive JWT
- `POST /api/tests/start` - start new test session
- `PUT /api/tests/:id/end` - end active test
- `GET /api/tests/active` - get active test
- `GET /api/tests/history` - get completed/ongoing tests with aggregates
- `POST /api/monitor/alerts` - monitor ingest endpoint (`x-monitor-key` required)
- `POST /api/alerts` - create alert (teacher-authenticated)
- `GET /api/alerts/active` - active test alerts only
- `GET /api/alerts/test/:testId` - alerts for selected test
- `GET /api/alerts/stats/live` - dashboard stats
- `GET /api/alerts/export/:testId?format=csv|json|pdf` - export test alerts
- `GET /api/devices` - registered devices list
- `POST /api/devices` - register student device
- `DELETE /api/devices/:id` - remove registered device

## Setup

1. Start PostgreSQL and create database `exam_monitor`.
2. Copy `server/.env.example` to `server/.env` and set values (`DATABASE_URL`, `JWT_SECRET`, `MONITOR_API_KEY`).
3. Install dependencies:
   - `npm run install:all`
4. Run migration:
   - `npm --prefix server run migrate`
5. Start backend:
   - `npm run dev:server`
6. Start frontend:
   - `npm run dev:client`
7. Teacher register/login in UI, then use dashboard sections: Dashboard, Alerts, Devices, History.
8. (Optional) Start Python monitor:
   - `pip install -r monitor/requirements.txt`
   - `python monitor/scripts/network_monitor.py --iface <interface_name>`

## Notes

- Alerts are scoped per `test_session_id`, so alerts from previous tests never mix with a new test.
- Starting a new test auto-ends any existing active test.
- If a MAC address is not in registered devices, event is promoted to `UNAUTHORIZED_DEVICE` (critical).
- Most teacher APIs require `Authorization: Bearer <jwt>`.
