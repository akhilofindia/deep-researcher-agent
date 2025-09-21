from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List
from pathlib import Path
import io, uuid, pickle, datetime
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import pdfplumber  # updated from PyPDF2

# ----------------------------
# Paths and Constants
# ----------------------------
DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(exist_ok=True)
FAISS_INDEX_FILE = DATA_DIR / "faiss.index"
CHUNKS_FILE = DATA_DIR / "chunks.pkl"
METADATA_FILE = DATA_DIR / "metadata.pkl"
TOP_K = 5
EMBEDDING_DIM = 384  # for all-MiniLM-L6-v2

# ----------------------------
# Initialize or Load FAISS
# ----------------------------
if FAISS_INDEX_FILE.exists():
    index = faiss.read_index(str(FAISS_INDEX_FILE))
else:
    index = faiss.IndexFlatL2(EMBEDDING_DIM)

# ----------------------------
# Load chunks and metadata
# ----------------------------
if CHUNKS_FILE.exists():
    with open(CHUNKS_FILE, "rb") as f:
        chunks = pickle.load(f)
else:
    chunks = []

if METADATA_FILE.exists():
    with open(METADATA_FILE, "rb") as f:
        metadata = pickle.load(f)
else:
    metadata = []

# ----------------------------
# Load embedding model
# ----------------------------
model = SentenceTransformer("all-MiniLM-L6-v2")

# ----------------------------
# FastAPI app
# ----------------------------
app = FastAPI(title="QA Retriever API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust for production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Helper functions
# ----------------------------
def save_data():
    with open(CHUNKS_FILE, "wb") as f:
        pickle.dump(chunks, f)
    with open(METADATA_FILE, "wb") as f:
        pickle.dump(metadata, f)
    faiss.write_index(index, str(FAISS_INDEX_FILE))

def chunk_text(text: str, chunk_size: int = 500) -> List[str]:
    words = text.split()
    return [" ".join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]

# ----------------------------
# Endpoints
# ----------------------------
@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    print('lol')
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    uploaded_docs = []

    # Only process the first file to show "1 file uploaded"
    file = files[0]

    # Handle PDF files using pdfplumber
    if file.filename.lower().endswith(".pdf"):
        file_bytes = await file.read()
        content_text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    # Clean up text
                    page_text = page_text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
                    page_text = page_text.replace('\x0c', ' ').strip()
                    content_text += page_text + "\n"
    else:
        content_bytes = await file.read()
        content_text = content_bytes.decode("utf-8", errors="ignore")

    print(content_text)
    file_chunks = chunk_text(content_text)

    if file_chunks:
        embeddings = model.encode(file_chunks, show_progress_bar=False)
        embeddings = np.array(embeddings).astype("float32")
        index.add(embeddings)

        chunks.extend(file_chunks)
        for i, chunk in enumerate(file_chunks):
            metadata_entry = {
                "id": str(uuid.uuid4()),
                "source": file.filename,
                "uploadedAt": datetime.datetime.utcnow().isoformat(),
                "wordCount": len(chunk.split())
            }
            metadata.append(metadata_entry)
            uploaded_docs.append({
                "id": metadata_entry["id"],
                "title": file.filename,
                "content": chunk,
                "metadata": metadata_entry
            })

    save_data()
    return JSONResponse(content=uploaded_docs)

@app.delete("/delete/{doc_id}")
async def delete_document(doc_id: str):
    global chunks, metadata, index
    indices_to_delete = [i for i, m in enumerate(metadata) if m["id"] == doc_id]
    if not indices_to_delete:
        raise HTTPException(status_code=404, detail="Document not found")

    for idx in sorted(indices_to_delete, reverse=True):
        chunks.pop(idx)
        metadata.pop(idx)

    # Rebuild FAISS
    if chunks:
        all_embeddings = model.encode(chunks, show_progress_bar=False)
        all_embeddings = np.array(all_embeddings).astype("float32")
        index = faiss.IndexFlatL2(EMBEDDING_DIM)
        index.add(all_embeddings)
    else:
        index = faiss.IndexFlatL2(EMBEDDING_DIM)

    save_data()
    return {"status": "deleted", "id": doc_id}

@app.post("/query")
async def query_documents(request: dict):
    query = request.get("query")
    if not query or not chunks:
        return {"results": [], "synthesis": ""}

    query = query.lower().strip()
    query_vec = model.encode([query]).astype("float32")
    distances, indices = index.search(query_vec, TOP_K)

    # Deduplicate and filter results
    seen_chunks = set()
    results = []
    for i, idx in enumerate(indices[0]):
        chunk_text_clean = chunks[idx].replace('\x0c', ' ').strip()
        if chunk_text_clean in seen_chunks:
            continue
        seen_chunks.add(chunk_text_clean)
        # Include chunks containing the query term or related content
        if query in chunk_text_clean.lower():
            results.append({
                "score": float(distances[0][i]),
                "chunk": chunk_text_clean,
                "source": metadata[idx].get("source", "unknown")
            })

    # Generate synthesis: Extract sentences containing the query
    synthesis = ""
    if results:
        relevant_sentences = []
        for result in results:
            sentences = result["chunk"].split('. ')
            for sentence in sentences:
                if query in sentence.lower() and sentence.strip() not in relevant_sentences:
                    relevant_sentences.append(sentence.strip())
        if relevant_sentences:
            synthesis = f"Summary for '{query}':\n- " + "\n- ".join(relevant_sentences[:3])  # Limit to 3 sentences

    return {"results": results, "synthesis": synthesis, "top_k": TOP_K}

@app.get("/documents")
async def get_documents():
    return [
        {
            "id": m["id"],
            "title": m["source"],
            "content": c.replace('\x0c', ' ').strip(),
            "metadata": m
        }
        for c, m in zip(chunks, metadata)
    ]
