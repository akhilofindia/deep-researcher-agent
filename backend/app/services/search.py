import numpy as np
import pickle
from pathlib import Path
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# Paths to saved data
DATA_DIR = Path(__file__).resolve().parents[2] / "data"
EMBEDDINGS_FILE = DATA_DIR / "embeddings.npy"
CHUNKS_FILE = DATA_DIR / "chunks.pkl"

# Load saved embeddings and chunks
embeddings = np.load(EMBEDDINGS_FILE)
with open(CHUNKS_FILE, "rb") as f:
    chunks = pickle.load(f)

print(f"Loaded {len(chunks)} chunks with embeddings shape {embeddings.shape}")

# Load the same embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Your query
query = "skills"
query_embedding = model.encode([query])

# Compute cosine similarity between query and all chunks
similarities = cosine_similarity(query_embedding, embeddings)[0]

# Get top N results
top_n = 3
top_indices = similarities.argsort()[-top_n:][::-1]

print(f"\nTop {top_n} chunks for query: '{query}'\n")
for idx in top_indices:
    print(f"Score: {similarities[idx]:.4f}")
    print(f"Chunk: {chunks[idx][:300]}...")  # preview first 300 chars
    print("-" * 80)
