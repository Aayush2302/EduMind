# 🚀 EduMind — Scalable AI Learning Platform

EduMind is a production-oriented AI learning platform built with real system design, RAG architecture, and distributed processing. 

Instead of the usual  
**API → LLM → Response**,  
EduMind follows a complete AI system architecture focused on scalability, reliability, and memory efficiency.

---

## ✨ Features

### 🧠 Multi-Mode AI Reasoning
- **Simple Mode** → Beginner-friendly tutor explanations  
- **Interview Mode** → Concepts with top interview questions & answers  
- **Step-by-Step Mode** → Structured logical reasoning and calculations  

Each mode has its own prompting and behavior pipeline.

---

### 📚 Real RAG (Retrieval-Augmented Generation) Pipeline
EduMind follows a complete document AI flow:

1. PDF stored in object storage (Supabase)
2. Page-by-page text extraction
3. Streaming-based chunking (memory efficient)
4. Embedding generation using transformer models
5. Vector database search
6. Context filtering
7. Dynamic context injection into LLM

This mirrors how enterprise-grade document AI systems are built.

---

### 🛡️ Two RAG Modes
- **Student Mode**
  - Controlled hallucination allowed  
  - Helpful for learning and exploration  

- **Enterprise Mode**
  - Zero hallucination  
  - Answers strictly from documents  
  - Ideal for corporate or academic use  

---

### ⚙️ Distributed Async Architecture
```bash
Frontend → API → Redis Queue
        ↓
┌──────────────┐
│ LLM Worker   │
└──────────────┘
        ↓
┌──────────────┐
│ RAG Worker   │
└──────────────┘
        ↓
Database Updated
        ↓
Frontend Polls Result
```


Benefits:
- Non-blocking requests  
- Horizontal scalability  
- AI workloads become production-safe  

---

### 📦 Memory-Efficient Processing
- PDFs are streamed, not loaded fully in RAM  
- Chunked progressively  
- Designed to run even on low-resource servers like Render free tier  

---

## 🧩 Scalable by Design

- Stateless APIs  
- Independent workers  
- Queue-based communication  
- Easy to add:
  - More workers  
  - Streaming responses  
  - Enterprise features  
  - Organization-level document isolation  

---

## 🛠️ Tech Stack

| Layer       | Technology |
|------------|-----------|
| Frontend   | React.js |
| Backend    | Node.js, TypeScript, Express |
| Queue      | Redis(upstash) + BullMQ |
| Workers    | LLM Worker, RAG Worker |
| Storage    | Supabase (Object + Vector), MongoDB (Metadata) |
| Embeddings | Transformer Models (Jina AI: Jina-embeddings-v3 |
| Deployment | Render / Docker (Planned) |

---


---

## ⚡ Why EduMind is Different

Most AI projects stop at:
```
User → API → LLM → Response
```
EduMind goes further:
```
User → API → Queue → Worker → RAG → LLM → DB → Frontend
```


This is how **real AI platforms** are designed.

---

## 📌 Note

EduMind is under active development and evolving into a complete **AI learning ecosystem**.

More features coming soon 🚀
