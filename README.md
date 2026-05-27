# 🛣️ RoadWatch — AI-Powered Citizen Road Monitoring Platform

> Civic-tech platform for citizens to report, track, and resolve road infrastructure issues using AI.

---

## 📁 Project Structure

```
roadwatch/
├── frontend/              # React + Vite frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/        # Badge, Skeleton, Toast, etc.
│   │   │   └── layout/    # Navbar, Footer
│   │   ├── pages/         # Route-level pages
│   │   │   ├── HomePage.jsx
│   │   │   ├── ReportPage.jsx
│   │   │   ├── MapPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── MyReportsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   ├── AboutPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── SignupPage.jsx
│   │   ├── context/       # AuthContext, ToastContext
│   │   ├── hooks/         # useAuth, useIssues
│   │   └── utils/         # api.js (Axios instance)
│   ├── .env.example
│   └── package.json
│
├── backend/               # Node.js + Express API
│   ├── config/
│   │   └── db.js          # MongoDB Atlas connection
│   ├── models/
│   │   ├── User.js        # User schema
│   │   └── Issue.js       # Issue schema
│   ├── middleware/
│   │   ├── auth.js        # JWT protect middleware
│   │   └── upload.js      # Multer image upload
│   ├── routes/
│   │   ├── auth.js        # /api/auth/*
│   │   ├── issues.js      # /api/issues/*
│   │   └── users.js       # /api/users/*
│   ├── uploads/           # Uploaded images (gitignored)
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── ai-service/            # Python FastAPI AI microservice
    ├── models/
    │   └── predictor.py   # Pothole predictor (YOLO-ready)
    ├── utils/
    │   └── image_processor.py  # OpenCV preprocessing
    ├── weights/           # Model weights (gitignored)
    ├── requirements.txt
    └── main.py
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB Atlas account (free tier works)

---

### 1. Backend Setup

```bash
cd roadwatch/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Start dev server
npm run dev
# → Server runs on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd roadwatch/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start dev server
npm run dev
# → App runs on http://localhost:5173
```

### 3. AI Service Setup

```bash
cd roadwatch/ai-service

# Create virtual environment
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start service
uvicorn main:app --reload --port 8000
# → AI service runs on http://localhost:8000
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `AI_SERVICE_URL` | URL to AI microservice (default: http://localhost:8000) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL |
| `VITE_AI_SERVICE_URL` | AI service URL |

---

## 🗄️ MongoDB Atlas Setup

1. Create free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create database user
3. Whitelist your IP (or 0.0.0.0/0 for dev)
4. Copy connection string to `MONGODB_URI` in `.env`
5. Database `roadwatch` and collections are auto-created

### Seed sample data

```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
const Issue = require('./models/Issue');
mongoose.connect(process.env.MONGODB_URI).then(async () => {
  // Add seed data here
  console.log('Seeded!');
  process.exit();
});
"
```

---

## 🌐 API Routes

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user (protected) |

### Issues
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/issues` | Get all issues (filters: status, severity, issueType) |
| GET | `/api/issues/stats` | Get dashboard statistics |
| GET | `/api/issues/:id` | Get single issue |
| POST | `/api/issues` | Create issue (protected, multipart/form-data) |
| PATCH | `/api/issues/:id/status` | Update status (protected) |
| DELETE | `/api/issues/:id` | Delete issue (owner/admin) |

### Users
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/users/me` | Get profile + stats (protected) |
| GET | `/api/users/me/reports` | Get user's reports (protected) |

### AI Service
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/predict` | Analyze road image |
| GET | `/health` | Health check |

---

## 🤖 AI Integration (Future: YOLOv8)

To integrate real YOLO detection in Phase 2:

```bash
pip install ultralytics
```

Then in `ai-service/models/predictor.py`:

```python
from ultralytics import YOLO

def load_model(self):
    self.model = YOLO('weights/pothole_yolov8.pt')
    self.is_loaded = True

def predict(self, image):
    results = self.model(image)
    boxes = results[0].boxes
    # ... parse detections
```

Train your own model:
```bash
yolo train data=pothole_dataset.yaml model=yolov8n.pt epochs=100 imgsz=640
```

---

## 🚀 Future Scalability

- **Microservices**: Split AI service, notifications, and reporting into separate services
- **Redis**: Cache map data, rate limiting
- **WebSockets**: Live issue updates on the map
- **S3/CloudFront**: Image storage and CDN
- **k8s**: Container orchestration for production
- **PostGIS / MongoDB GeoJSON**: Advanced geospatial queries
- **PWA**: Offline reporting support
- **Email/SMS**: Notification on status updates
- **Admin Panel**: Municipal authority dashboard

---

## 📦 Build for Production

```bash
# Frontend
cd frontend && npm run build   # outputs to dist/

# Backend
cd backend && NODE_ENV=production node server.js

# AI Service
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 🏆 Hackathon Notes

- All pages are fully functional with mock data
- AI service returns realistic dummy predictions
- Replace `MOCK_USER` and `MOCK_ISSUES` with real API calls
- Connect Leaflet map with real coordinates from MongoDB
- Add WebSocket for live map updates

---

*Built with ❤️ for smarter, safer cities.*
