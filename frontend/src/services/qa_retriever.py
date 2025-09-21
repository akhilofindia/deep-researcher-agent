import faiss
import pickle
from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from datetime import datetime

# ----------------------------
# Paths and Constants
# ----------------------------
DATA_DIR = Path(__file__).resolve().parents[2] / "data"
FAISS_INDEX_FILE = DATA_DIR / "faiss.index"
CHUNKS_FILE = DATA_DIR / "chunks.pkl"
METADATA_FILE = DATA_DIR / "metadata.pkl"
TOP_K = 3

# ----------------------------
# Load chunks and metadata
# ----------------------------
with open(CHUNKS_FILE, "rb") as f:
    chunks = pickle.load(f)

with open(METADATA_FILE, "rb") as f:
    metadata = pickle.load(f)

# ----------------------------
# Load FAISS index
# ----------------------------
index = faiss.read_index(str(FAISS_INDEX_FILE))
print(f"FAISS index loaded with {index.ntotal} vectors")

# ----------------------------
# Load embedding model
# ----------------------------
model = SentenceTransformer("all-MiniLM-L6-v2")

# ----------------------------
# FastAPI app
# ----------------------------
app = FastAPI(title="QA Retriever API")

# ----------------------------
# Request model
# ----------------------------
class QueryRequest(BaseModel):
    query: str

# ----------------------------
# /research endpoint
# ----------------------------
@app.post("/research")
def research(request: QueryRequest):
    try:
        user_query = request.query
        query_vec = model.encode([user_query]).astype("float32")
        distances, indices = index.search(query_vec, TOP_K)

        steps = []
        documents = []

        for i, idx in enumerate(indices[0]):
            chunk_text = chunks[idx]
            source = metadata[idx].get("source", "unknown")

            # Step for frontend
            steps.append({
                "id": str(i),
                "query": chunk_text,
                "status": "completed",
                "results": []
            })

            # Document info for frontend
            documents.append({
                "id": str(i),
                "title": chunk_text[:50] + ("..." if len(chunk_text) > 50 else ""),
                "content": chunk_text,
                "embedding": [],  # optional
                "metadata": {
                    "source": source,
                    "uploadedAt": None,
                    "wordCount": len(chunk_text.split())
                }
            })

        # Construct final result
        result = {
            "query": user_query,
            "steps": steps,
            "documents": documents,
            "synthesis": "Synthesis will be generated here.",  # placeholder
            "completedAt": datetime.utcnow().isoformat()
        }

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
