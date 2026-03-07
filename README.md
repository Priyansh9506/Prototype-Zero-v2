<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/anchor.svg" alt="Logo" width="80" height="80">
  <h1 align="center">SmartContainer Risk Engine v4.0</h1>
  <p align="center">
    <strong>Next-Generation AI Customs Intelligence & Targeting Platform</strong>
    <br />
    <br />
    <a href="#-solution-overview">Overview</a>
    ·
    <a href="#-architecture">Architecture</a>
    ·
    <a href="#-tech-stack">Tech Stack</a>
    ·
    <a href="#-live-demo--screenshots">Screenshots</a>
    ·
    <a href="#-team">Team</a>
  </p>
  <p align="center">
    <strong>Team: Prototype Zero</strong>
  </p>
</div>

<hr />

## 📚 Documentation

For a deep dive into our methodology, system design, and technology choices, please refer to the following specific documents:

- **[🏗️ System Architecture](docs/ARCHITECTURE.md)**: Details the frontend SPA structure, core API endpoints, ML pipeline data flow, and ensemble architecture.
- **[🎯 Solution Approach](docs/SOLUTION_APPROACH.md)**: In-depth explanation of our approach, including feature engineering, the multi-model ensemble (XGBoost, LightGBM, Isolation Forest), rule-based algorithms, and computer vision image analysis.
- **[🛠️ Tech Stack](docs/TECH_STACK.md)**: Detailed breakdown of the libraries, infrastructure, and rationale for choosing each piece of technology in the stack.

---

## 🌟 Solution Overview

The **SmartContainer Risk Engine** is an enterprise-grade, microservices-based application designed for modern customs agencies. It ingest vast amounts of shipping manifest data, utilizes Isolation Forest anomaly detection algorithms, and evaluates cargo risk in real-time.

By intelligently parsing manifest data, dwelling times, declared weights vs. actual weights, and historical trade patterns, the system automatically triages incoming shipments into **Low**, **Medium**, and **Critical** risk tiers—enabling customs officers to focus physical inspections exactly where they are needed most.

### Key Capabilities

- 🔥 **Real-time Anomaly Detection**: Statistical anomaly flagging using AI/ML algorithms.
- 👨‍⚖️ **Role-Based Access Control (RBAC)**: Distinct permissions for `Admin`, `Officer`, and `Pending` users.
- 📊 **Dynamic Analytics Dashboard**: Rich data visualizations built with Recharts.
- 💨 **In-Process Background Tasks**: Fast execution of ML inference without external brokers.
- 🛡️ **JWT Authentication**: Secure, token-based API communication.
- 🖼️ **Image Damage Analysis**: Container damage detection identifying dents, rust, holes, and framing issues using Roboflow.

---

## 🏗️ Architecture

The system is built on a decoupled, asynchronous microservices architecture to ensure high throughput and independent scaling of the intelligence tier.

```mermaid
graph TD
    %% Styling
    classDef frontend fill:#C06820,stroke:#8B4513,stroke-width:2px,color:#fff,font-weight:bold
    classDef backend fill:#2E7D32,stroke:#1B5E20,stroke-width:2px,color:#fff,font-weight:bold
    classDef memory fill:#C62828,stroke:#b71c1c,stroke-width:2px,color:#fff,font-weight:bold
    classDef db fill:#455A64,stroke:#263238,stroke-width:2px,color:#fff,font-weight:bold

    %% Nodes
    Client["💻 Next.js Dashboard<br/>(Client UI)"]:::frontend
    API["⚡ FastAPI Server<br/>(Core API)"]:::backend
    Auth["🔐 JWT Auth Layer"]:::backend
    ML_Task["⚙️ ML Pipeline<br/>(Background Task)"]:::backend
    SQLite["🐘 SQLite<br/>(Persistent Data)"]:::db

    %% Connections
    Client -- "REST API" --> API
    API -- "Authentication" --> Auth
    Auth -- "Validates User" --> SQLite

    API -- "Spawns Inference" --> ML_Task
    ML_Task -- "Predicts Risk" --> SQLite
    API -- "Reads Results" --> SQLite
```

---

## 💻 Tech Stack

### Frontend Architecture

| Technology   | Badge                                                                                                      | Description                                                |
| ------------ | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Next.js**  | ![Next JS](https://img.shields.io/badge/Next-14+-black?style=for-the-badge&logo=next.js&logoColor=white)   | React framework mapped as a Single Page Application (SPA). |
| **React**    | ![React](https://img.shields.io/badge/react-18-blue?style=for-the-badge&logo=react&logoColor=white)        | Core component UI framework.                               |
| **Recharts** | ![Recharts](https://img.shields.io/badge/Recharts-3.7-blue?style=for-the-badge&logo=react&logoColor=white) | Native React UI charting library for dashboard analytics.  |
| **Lucide**   | ![Lucide](https://img.shields.io/badge/Lucide-Icons-red?style=for-the-badge&logo=lucide&logoColor=white)   | Clean and modern application iconography.                  |

### Backend, ML, & Database

| Technology       | Badge                                                                                                                          | Description                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| **Python**       | ![Python](https://img.shields.io/badge/python-3.11+-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)                   | Core language for backend and ML modeling.                |
| **FastAPI**      | ![FastAPI](https://img.shields.io/badge/FastAPI-0.115.8-009688?style=for-the-badge&logo=fastapi&logoColor=white)               | High performance asynchronous API framework.              |
| **SQLite**       | ![SQLite](https://img.shields.io/badge/sqlite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)                        | Embedded persistence for roles, users, and API data.      |
| **Scikit-Learn** | ![scikit-learn](https://img.shields.io/badge/scikit--learn-1.6.1-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white) | Utilized for Isolation Forest and core feature pipelines. |
| **XGBoost**      | ![XGBoost](https://img.shields.io/badge/XG%20Boost-2.1.4-blue?style=for-the-badge)                                             | Primary machine learning ensemble model weight.           |
| **LightGBM**     | ![LightGBM](https://img.shields.io/badge/Light%20GBM-4.5.0-blue?style=for-the-badge)                                           | Secondary machine learning ensemble model weight.         |
| **Roboflow**     | ![Roboflow](https://img.shields.io/badge/Roboflow-Inference-6831A6?style=for-the-badge)                                        | Used to execute advanced CV models for container damage.  |

---

## 📸 Live Demo & Screenshots

### Demo Credentials

To explore the system locally, use the following seeded administrator credentials:

- **Officer ID (Username)**: `testadmin`
- **Security Access Code (Password)**: `password123`

### 1. Secure Authentication Portal

_Role-based access gateway for customs personnel._
![Login Portal](docs/images/login.png)

### 2. High-Level Intelligence Overview

_Real-time metrics tracking flagged shipments, anomalies, and active system health._
![Dashboard Overview](docs/images/overview.png)

### 3. Container Risk Registry

_Detailed triage view featuring the dynamic `RiskBar` component with deep ML scoring._
![Container Registry](docs/images/containers.png)

### 4. Deep Analytics (Part 1)

_Comprehensive breakdown of risk metrics, origins, and distributions._
![Analytics Overview](docs/images/analytics_1.png)

### 5. Deep Analytics (Part 2)

_Correlation analysis and temporal risk mapping for deeper intelligence._
![Analytics Detail](docs/images/analytics_2.png)

### 6. Data Upload & Processing

_Secure Drag & Drop interface for processing large container manifest datasets._
![Data Upload](docs/images/DataUpload&Processing.png)

### 7. Mounted Image Analysis

_Visual inspection module for isolating target containers and analyzing telemetry._
![Mounted Image](docs/images/MountedImageAnalysis.png)

### 8. Neural Analysis Dashboard

_Roboflow-powered damage detection with active condition risk contribution mapping._
![Neural Analysis](docs/images/NeuralAnalysisDashboard.png)

### 9. Extended Registry Context

_Granular risk breakdown and evidence gallery exposed within the registry sidebar._
![Expanded Registry](docs/images/ExtendedRegistryContext.png)

### 10. Administrator Control Panel

_Comprehensive user management and role-based security clearance tracking._
![Admin Panel](docs/images/AdminControlPanel.png)

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/Priyansh9506/Prototype-Zero-v2.git
cd Prototype-Zero-v2
```

**2. Setup Backend (FastAPI)**

```bash
python -m venv venv
source venv/bin/activate  # Or `venv\Scriptsctivate` on Windows
pip install -r requirements.txt
python verify_user.py      # Seed the admin database

# Start with isolated watcher to avoid frontend compilation loops
python -m uvicorn api.main:app --reload --reload-dir api --reload-dir src --port 8000
```

**3. Setup Frontend (Next.js)**

```bash
cd dashboard
npm install --force       # Use --force if you encounter permission (EPERM) issues
npm run dev
```

**4. Access the Dashboard**
Navigate your browser to `http://localhost:3000`.

---

## 👥 Team

| Name           | Role                               | GitHub Profile                                    |
| -------------- | ---------------------------------- | ------------------------------------------------- |
| Kaivalya Bhatt | Team Leader/Frontend & ML Engineer | [KaivalyaBhatt](https://github.com/KaivalyaBhatt) |
| Priyansh Patel | Full Stack & ML Engineer           | [PriyanshPatel](https://github.com/Priyansh9506)  |
| Yashi Jain     | Data & UX Engineer                 | [YashiJain](https://github.com/Yashi1609)         |
| Rutva Patel    | Computer Vision & ML Engineer           | [RutvaPatel](https://github.com/Rutva-11)         |

---

## 🛠️ Troubleshooting

### Windows Compilation Loop

If you find the backend restarting infinitely when the frontend compiles, ensure you are running the backend with `--reload-dir api --reload-dir src`. This prevents Uvicorn from watching the `.next` build folder.

### Missing Dependencies

If you encounter `Module not found` in the frontend terminal, try clearing the cache and reinstalling:

```bash
rmdir /S /Q .next
npm install --force
npm run dev
```

---

<div align="center">
  <p><strong>Prototype Zero · Advancing intelligent risk detection for global trade systems.</strong></p>
</div>
