# GitHired — AI-Powered Real-Time Interview Platform

<p align="center">
  <strong>Practice interviews with AI. Get evaluated. Track your improvement.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenAI-412991?logo=openai&logoColor=white" />
</p>

---

## 🚀 Overview

**GitHired** is a full-stack AI-powered interview platform designed to simulate realistic technical and behavioral interviews.

It combines AI-driven question generation, contextual follow-up questions, voice and text interaction, candidate response evaluation, and structured feedback to help users practice interviews and track their performance.

## ✨ Features

* 🤖 AI-powered technical and behavioral interviews
* 🧠 Dynamic and context-aware question generation
* 🔄 Adaptive follow-up questions based on candidate responses
* 🎙️ Voice and text-based interview interaction
* 📝 Speech-to-text transcription
* 📊 AI-based response evaluation and scoring
* 💬 Structured feedback and improvement suggestions
* 📈 Interview history and performance tracking
* 🔐 Authentication and protected routes
* 💾 Interview and feedback data persistence

> **Note:** Feature availability depends on the current implementation. Update this list to reflect the functionality that is actually working in your application.

## 🏗️ System Architecture

```mermaid
flowchart TD
    A[Candidate] --> B[React + Vite Frontend]
    B --> C[Express REST API]
    C --> D[Authentication Middleware]
    D --> E[Interview Engine]
    E --> F[OpenAI API]
    E --> G[MongoDB Database]
    E --> H[Speech-to-Text Service]
    F --> E
    H --> B
    E --> I[Evaluation & Feedback]
    I --> G
    I --> B
```

## 🔄 Interview Workflow

```mermaid
flowchart TD
    A[Start Interview] --> B[Configure Interview]
    B --> C[Generate Question]
    C --> D[Candidate Responds]
    D --> E[Process Text or Voice]
    E --> F[Analyze Response]
    F --> G{More Questions?}
    G -->|Yes| C
    G -->|No| H[Evaluate Performance]
    H --> I[Generate Feedback Report]
    I --> J[Save Interview Results]
    J --> K[Performance Dashboard]
```

## 📊 Evaluation Framework

Candidate responses can be evaluated across multiple dimensions:

```mermaid
flowchart TD
    A[Candidate Responses] --> B[Technical Knowledge]
    A --> C[Problem-Solving Skills]
    A --> D[Communication Skills]
    A --> E[Answer Relevance]
    B --> F[Performance Evaluation]
    C --> F
    D --> F
    E --> F
    F --> G[Scores & Feedback]
    G --> H[Improvement Recommendations]
```

## 🛠️ Tech Stack

| Layer            | Technologies                            |
| ---------------- | --------------------------------------- |
| Frontend         | React 18, Vite, React Router DOM, Axios |
| Backend          | Node.js, Express.js                     |
| Database         | MongoDB, Mongoose                       |
| AI Integration   | OpenAI API                              |
| Voice Processing | Speech-to-Text / Whisper                |
| Authentication   | JWT                                     |
| Styling          | Custom CSS                              |
| API Architecture | REST API                                |

## 📂 Project Structure

```text
GitHired/
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       ├── hooks/
│       └── utils/
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── config/
└── README.md
```

*The structure above is illustrative. Adjust it to match your actual repository.*

## ⚡ Getting Started

### Prerequisites

* Node.js and npm
* MongoDB instance
* OpenAI API key, if using OpenAI-powered features

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/GitHired.git
cd GitHired
```

Replace `YOUR_USERNAME/GitHired` with your actual GitHub repository path.

### 2. Set Up the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Set Up the Backend

Open a separate terminal:

```bash
cd backend
npm install
npm run dev
```

Ensure both development servers are configured to communicate with each other.

### 4. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
OPENAI_API_KEY=your_openai_api_key
```

Add any additional environment variables required by your implementation. Never commit API keys, database credentials, or other secrets to version control.

## 🛣️ Development Roadmap

* [x] Frontend interview interface
* [x] Feedback interface
* [ ] Complete AI interview orchestration
* [ ] Context-aware follow-up questions
* [ ] Voice interview integration
* [ ] Persistent interview history
* [ ] Performance analytics dashboard
* [ ] Production deployment

*Update the checklist as features are implemented and tested.*

## 🎯 Core AI Pipeline

```text
Interview Configuration
         ↓
Question Generation
         ↓
Candidate Response
         ↓
Response Processing
         ↓
AI Evaluation
         ↓
Scoring & Feedback
         ↓
Performance Tracking
```

## 🔮 Future Enhancements

* Personalized interview difficulty
* Role-specific interview preparation
* Detailed performance analytics
* Interview session summaries
* Improved speech recognition
* Personalized learning recommendations

## 📜 License

This project is developed for educational and portfolio purposes. Add a specific open-source license if you intend to permit reuse, modification, or redistribution.

---

<p align="center">
  <strong>GitHired — Practice Smarter. Interview Better.</strong>
</p>
