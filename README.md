
# 📄 Document QA Retriever  

A full-stack application that allows you to **upload, search, and query large documents** (PDFs, text files, resumes, research papers, etc.) using semantic search powered by **FAISS** and **SentenceTransformers**.  

The system splits documents into smart chunks, embeds them, and lets you query with natural language to retrieve relevant text + summaries.  

---

## 🚀 Features  

- 📂 **Upload documents** (PDF or TXT)  
- 🔎 **Semantic search** powered by FAISS + MiniLM embeddings  
- 📝 **Smart chunking** of large documents  
- 📑 **Source-aware results** (see which document a result came from)  
- 🧹 **Text cleaning** to remove garbage data from PDFs  
- 🌐 **Frontend (React + TypeScript)** for interactive querying  
- ⚡ **Backend (FastAPI)** for document management and retrieval  

---

## 🏗️ Project Structure  

```
backend/
│── app/
│   ├── data/              # storage for FAISS index & metadata
│   ├── models/            # (reserved for Pydantic models)
│   ├── routers/           # (reserved for FastAPI routes)
│   ├── services/          # processing / utility logic
│   ├── main.py            # main FastAPI app
│   └── test.py            # test runner
│
│── data/                  # persistent storage
│   ├── chunks.pkl
│   ├── embeddings.npy
│   ├── faiss.index
│   ├── metadata.pkl
│   └── Akhil_resume.pdf   # example file
│
frontend/
│── public/                # static files
│── src/
│   ├── components/ui/     # React UI components
│   │   ├── DocumentManager.tsx
│   │   ├── ResearchResults.tsx
│   │   └── SearchInterface.tsx
│   ├── hooks/             # React hooks
│   ├── lib/               # utilities
│   ├── pages/             # page-level components
│   ├── services/          # API service functions
│   └── store/             # global state management
│
└── requirements.txt       # Python backend dependencies
```

---

## ⚙️ Tech Stack  

### 🔹 Backend  
- [FastAPI](https://fastapi.tiangolo.com/) – API framework  
- [FAISS](https://faiss.ai/) – vector search engine  
- [SentenceTransformers](https://www.sbert.net/) – embeddings (MiniLM)  
- [pdfplumber](https://github.com/jsvine/pdfplumber) – PDF text extraction  
- [pickle](https://docs.python.org/3/library/pickle.html), NumPy – data persistence  

### 🔹 Frontend  
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)  
- [TailwindCSS](https://tailwindcss.com/) – styling  
- [shadcn/ui](https://ui.shadcn.com/) – UI components  
- [Axios](https://axios-http.com/) – API requests  
- [Zustand](https://github.com/pmndrs/zustand) – state management  

---

## ⚡ Getting Started  

### 1️⃣ Clone the repo  

```bash
git clone https://github.com/yourusername/document-qa-retriever.git
cd document-qa-retriever
```

### 2️⃣ Backend Setup  

```bash
cd backend
python -m venv venv
source venv/bin/activate   # (Linux/Mac)
venv\Scripts\activate      # (Windows)

pip install -r requirements.txt
```

Run the server:  

```bash
uvicorn app.main:app --reload
```

Server will start at: **http://127.0.0.1:8000**

### 3️⃣ Frontend Setup  

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at: **http://localhost:5173** (Vite default).  

---

## 📂 Data Flow  

1. Upload document via frontend → sent to backend.  
2. Backend extracts text, chunks it (~500 words), and stores embeddings in FAISS index.  
3. Query is embedded → FAISS retrieves top-K relevant chunks.  
4. Backend synthesizes a short summary from the most relevant sentences.  
5. Results + summary sent to frontend.  

---

## 🔍 Example Query  

- **Query:** `"What challenges were faced during the expedition?"`  
- **Results:** Relevant document chunks (with similarity scores + source).  
- **Synthesis:** Short summary built from most relevant sentences.  

---

## 📦 Requirements  

See [`requirements.txt`](backend/requirements.txt)  

Example:  

```
fastapi
uvicorn
faiss-cpu
sentence-transformers
numpy
pdfplumber
```

---

## 🧪 Testing  

Run backend tests:  

```bash
pytest backend/app/test.py
```

---

## 🚀 Future Improvements  

- [ ] Support for **multi-PDF querying at once**  
- [ ] Add **OCR** for scanned PDFs (Tesseract)  
- [ ] Improve **summarization** with LLMs (e.g., GPT / LLaMA)  
- [ ] Add **user authentication**  
- [ ] Cloud storage support (S3, GCS, etc.)  

---

## 📜 License  

This project is licensed under the MIT License.  
Feel free to fork, modify, and use it for your own projects 🚀  
