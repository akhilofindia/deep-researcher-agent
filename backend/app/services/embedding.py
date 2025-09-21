from typing import List
from sentence_transformers import SentenceTransformer
import numpy as np
import pickle
from pathlib import Path

# Choose your model
MODEL_NAME = "all-MiniLM-L6-v2"

# Paths to save embeddings and chunks
SAVE_DIR = Path(__file__).resolve().parents[2] / "data"
EMBEDDINGS_FILE = SAVE_DIR / "embeddings.npy"
CHUNKS_FILE = SAVE_DIR / "chunks.pkl"

def load_model(model_name: str = MODEL_NAME) -> SentenceTransformer:
    """
    Load and return a sentence-transformers model.
    """
    print(f"Loading embedding model: {model_name}")
    model = SentenceTransformer(model_name)
    return model

def embed_chunks(chunks: List[str], model: SentenceTransformer) -> np.ndarray:
    """
    Generate embeddings for a list of text chunks.
    """
    print(f"Generating embeddings for {len(chunks)} chunks...")
    embeddings = model.encode(chunks, show_progress_bar=True)
    embeddings_array = np.array(embeddings)
    print(f"Embeddings generated: {embeddings_array.shape}")
    return embeddings_array

def save_embeddings(embeddings: np.ndarray, chunks: List[str]):
    """
    Save embeddings and chunks locally.
    """
    SAVE_DIR.mkdir(parents=True, exist_ok=True)
    np.save(EMBEDDINGS_FILE, embeddings)
    with open(CHUNKS_FILE, "wb") as f:
        pickle.dump(chunks, f)
    print(f"Saved embeddings to {EMBEDDINGS_FILE}")
    print(f"Saved chunks to {CHUNKS_FILE}")

def load_embeddings():
    """
    Load previously saved embeddings and chunks.
    """
    if EMBEDDINGS_FILE.exists() and CHUNKS_FILE.exists():
        embeddings = np.load(EMBEDDINGS_FILE)
        with open(CHUNKS_FILE, "rb") as f:
            chunks = pickle.load(f)
        print(f"Loaded {len(chunks)} chunks and embeddings from disk.")
        return embeddings, chunks
    else:
        print("No saved embeddings found.")
        return None, None

if __name__ == "__main__":
    import sys, os
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from ingestion import load_documents, chunk_documents

    # Load & chunk documents
    docs = load_documents()
    chunks = chunk_documents(docs)
    print(f"Loaded {len(docs)} documents and generated {len(chunks)} chunks.")

    # Load model & generate embeddings
    model = load_model()
    embeddings = embed_chunks(chunks, model)

    # Save embeddings & chunks
    save_embeddings(embeddings, chunks)
