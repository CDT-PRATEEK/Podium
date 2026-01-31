# Podium
**View the application here:** [Visit Podium](https://podiumapp.vercel.app)

<p align="center">
  <img src="assets/cover.png" alt="Podium Cover" width="800"/>
</p>

Podium is a **full-stack, decoupled publishing platform** engineered for **long-form content**, **structured discussion**, and **context-aware discovery**.

It focuses on **writing-first UX**, **predictable moderation**, and **performance-conscious backend design**, avoiding engagement-driven clutter.

---

## ✨ Highlights

- Rich-text-first publishing (no cover-image hacks)
- Structured, non-chaotic comment system
- Zero cold-start content discovery
- AI-gated moderation before persistence
- Clean separation of user, moderator, and admin roles
- PostgreSQL-first, production-oriented backend

---

## 📌 Overview

Podium is built around the following constraints:

- Content-first authoring with inline, narrative-driven media support
- Structured discussion over unbounded interaction
- Predictable system behavior
- Immediate content discovery without user history
- Proactive moderation enforced before persistence
- Optimized database and API performance

---

## 📝 Rich-Text-First Authoring

<p align="center">
  <img src="assets/editor.png" alt="Rich Text Editor" width="800"/>
</p>

- Rich editor with embedded images, headings, and code blocks
- No “cover image + body” separation
- Media embedded directly into the content HTML
- Feed view suppresses images for layout consistency
- Full post view renders media responsively
- Preview generation independent of content order

---

## 💬 Comment System Philosophy (Structured Interaction)

The comment system is **intentionally not** a generic nested thread model.

**Design Principle:** **Structured Interaction over Infinite Nesting**

Comments are architected around:

- **Root Commenter**
- **Original Post (OP) Interaction**

This ensures:
- No infinite nesting
- No discussion noise
- Author-centric, readable discourse
- Clear moderation boundaries

### Comment Permissions

- Users can edit or delete **only their own content**
- Post owners cannot delete other users’ comments
- All comments pass through AI moderation before persistence
- Moderation decisions are explicit and non-silent

---

## 🔔 Notifications

- Centralized notification model
- Triggered by **comment activity only**
- Navbar notification bell with unread indicator
- Explicit read-state tracking
- No reactions or like-based notifications

---

## 🧭 Explore & Discovery Architecture

<p align="center">
  <img src="assets/explore.png" alt="Explore page" width="800"/>
</p>

The Explore page is the core discovery engine of Podium. It serves two distinct functions: **Global Feed Discovery** and **Context-Aware Recommendations**.

It is engineered to solve the "Cold Start" problem without relying on invasive user tracking.

---

## 👤 Smart Profile & Content Dashboard

<p align="center">
  <img src="assets/library.png" alt="Explore page" width="800"/>
</p>

* **Unified Workspace:** A centralized hub managing the full user lifecycle:
    * **Published:** Public-facing articles.
    * **Drafts:** Private, work-in-progress content.
    * **Library:** Personal reading list (Bookmarks).
* **Identity Management:** Integrated controls for Bio (150-char limit) and Interest tags.
* **Reactive Architecture:** User state is lifted to the root (`App.jsx`), ensuring avatar and bio updates propagate instantly to the Navbar and Sidebar without page reloads.
* **Smart Media Handling:** Implements automatic cache-busting for avatar updates and dynamic fallbacks (CSS gradients) for users without profile images.

---

## 🛂 Role-Based Access Control (RBAC)

Podium uses **Django Admin Groups** combined with backend permission logic.

### Roles

**User**
- Create posts and comments
- Edit/delete only their own content

**Moderator**
- Delete any post
- Delete any comment
- Enforce platform-wide rules
- Operates only through application endpoints
- No access to Django Admin

**Admin**
- Full Django Admin access
- Role assignment
- System configuration

Permissions are enforced via:
- Group membership checks
- Explicit backend logic (not UI-only rules)

| Role | Capabilities | Scope |
| :--- | :--- | :--- |
| **User** | Create posts/comments. Edit own content. | Frontend |
| **Moderator** | Delete any content. Enforce rules. | API Endpoints Only (No Admin Panel) |
| **Admin** | Full System Access. Role Assignment. | Django Admin Panel |

---

## 🔍 Context-Aware Recommendations (Zero Cold Start)


- Content-based recommendation engine
- Generated from the currently viewed post
- Matching logic:
  - Shared topic **OR**
  - Overlapping tags
- Active post explicitly excluded
- Results capped and randomized at the database level
- Works for anonymous and authenticated users
- Session-level filtering prevents repetition

---

## 🧠 AI-Based Content Moderation

- All posts and comments are analyzed **before database persistence**
- Moderation handled by a standalone **FastAPI microservice**
- Toxicity and sentiment analysis
- Validation enforced at the **Django View layer**
- Rejected content:
  - Never reaches the database
  - Returns explicit error responses

### Pipeline
1. Client submits payload to Django View.
2. Django sends async request to FastAPI.
3. FastAPI performs toxicity/sentiment analysis.
4. **Decision:**
   - **Rejected:** Returns HTTP 400. Content never reaches the DB.
   - **Approved:** Serializer saves data.

---

## 🏗 Architecture

### High-Level Request Flow

React Frontend
↓
Django REST API (ASGI)
↓
FastAPI AI Moderation Service
↓
PostgreSQL

---

## ⚙ Backend Architecture Details

### Django ASGI Integration

- Django runs under **ASGI**, not WSGI
- Enables non-blocking I/O for FastAPI calls
- Prevents request thread blocking during AI analysis
- Safe async integration inside DRF views

### AI Moderation Pipeline

Client → DRF View → FastAPI → Decision → Save / Abort

- Exactly one AI call per request
- Moderation before serializer save
- HTTP 400 returned for rejected content
- No model-level hooks or duplicate validation

---

## 📊 Feed Ranking & Bandwidth Optimization

The feed uses a **strict three-tier priority system**:

1. **Relevance Score** — matches user interests  
2. **Date Posted (Recency)** — newest first  
3. **Quality Ratio** — interaction density (tie-breaker)


### Bandwidth Strategy

- Ranking calculations exist **only in the View layer**
- Computed fields used only for server-side sorting
- Removed from serializers before response
- Client receives a strictly sorted feed with minimal payload

---

## 🧪 Recommendation Engine (“Simulated Similarity”)

- Content-based filtering (not collaborative filtering)
- PostgreSQL indexed queries using `Q` objects
- Topic OR tag overlap matching
- Strict result limit (5)
- Database-level random ordering
- Active post explicitly excluded

---

## 🧰 Technology Stack

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | High performance SPA. |
| **Styling** | Tailwind CSS | Utility-first styling. |
| **Rich Text** | React-Quill | Customized for inline media. |
| **Backend** | Django (ASGI) | Core logic & Authentication. |
| **API** | DRF | REST API with Token Auth. |
| **AI Service** | FastAPI | Microservice for moderation. |
| **Database** | PostgreSQL | Production-grade relational DB. |
| **Media** | Cloudinary | For Profile pictures and post images. |
| **DevOps** | Docker | Containerization & Orchestration. |

---

## 🚀 Deployment & Infrastructure

* **Frontend:** Deployed on **Vercel**, utilizing their Global Edge Network for zero-latency static asset delivery.
* **Backend:** Hosted on **Render** (Singapore Region), physically colocated near the database to ensure <50ms query round-trip times.
* **AI Microservice:** Deployed as a separate web service on **Render**, communicating with the Django backend via internal networking.
* **Database:** Serverless **PostgreSQL on Neon**, decoupling compute from storage for instant scaling.
* **Media:** Offloaded to **Cloudinary** for on-the-fly image optimization and global CDN distribution.

---

## 🛡 Data Integrity

- Soft deletion via `is_soft_deleted`
- Public data masked instead of removed
- Relational integrity preserved
- Supports account restoration window of 30 days

---

## 🛠️ Local Setup

<details>
<summary><strong>Click to expand installation steps</strong></summary>
<br>

### **Clone the repository**
    ```bash
    git clone https://github.com/CDT-PRATEEK/Podium.git
    cd Podium
    ```

### Option A: Docker (Recommended)

1.  **Run with Docker Compose**
    ```bash
    docker-compose up --build
    ```

### Option B: Manual Setup

1.  **AI Service Setup**
    ```bash
    cd AI_Service
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8001
    ```

2.  **Backend Setup**
    ```bash
    cd Backend
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python manage.py migrate
    python manage.py runserver
    ```

3.  **Frontend Setup**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

4.  **Environment Variables**
    
    Create a `.env` file in `backend/`.

    **Required:**
    ```env
    SECRET_KEY=unsafe-dev-key
    DEBUG=True
    DATABASE_URL=postgres://user:pass@localhost:5432/podium
    AI_SERVICE_URL=http://localhost:8001/analyze_sentiment
    ```

    **Optional (Cloudinary / Google):**
    > - If Cloudinary keys are missing, the app will automatically use local storage and create a `media/` folder for you.
    > - For Emails, you can use the local Django console backend instead and remove the Google keys from settings.
    ```env
    CLOUDINARY_CLOUD_NAME=...
    CLOUDINARY_API_KEY=...
    CLOUDINARY_API_SECRET=...

    # Google Auth via Gmail API
    GOOGLE_REFRESH_TOKEN=...
    GOOGLE_CLIENT_ID=...
    GOOGLE_CLIENT_SECRET=...
    ```

    **Optional (Advanced):**
    > The app defaults to `http://localhost:5173` for CORS. Override these only if your frontend runs on a different port.
    ```env
    FRONTEND_URL=http://localhost:3000
    CORS_ALLOWED_ORIGINS=http://localhost:3000,http://another-domain.com
    ALLOWED_HOSTS=domain.com,www.domain.com
    ```

    **Frontend (.env)**
    ```env
    VITE_API_URL=http://127.0.0.1:8000/api/
    ```
</details>

---

## 🔗 Links

- **Frontend**: `/frontend`
- **Backend API**: `/backend`
- **AI Service**: `/ai_service`

---

### 👨‍💻 Author

**Prateek Sinha**