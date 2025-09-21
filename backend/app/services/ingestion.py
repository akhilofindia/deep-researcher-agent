import os
from typing import List
from pathlib import Path
import pandas as pd

from langchain.text_splitter import RecursiveCharacterTextSplitter

# PDF support
try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None
    print("Warning: PyPDF2 not installed. PDFs will be skipped.")

DATA_DIR = Path(__file__).resolve().parents[2] / "data"

def clean_text(text: str) -> str:
    """Basic text cleaning: strip, replace multiple spaces/newlines."""
    return " ".join(text.split())

def load_txt(file_path: Path) -> str:
    with open(file_path, "r", encoding="utf-8") as f:
        return clean_text(f.read())

def load_md(file_path: Path) -> str:
    """Load Markdown as plain text."""
    return clean_text(file_path.read_text(encoding="utf-8"))

def load_csv(file_path: Path, text_columns: List[str] = None) -> str:
    """Load CSV and concatenate text columns. If text_columns=None, use all."""
    df = pd.read_csv(file_path)
    if text_columns is None:
        text_columns = df.select_dtypes(include=["object"]).columns.tolist()
    texts = df[text_columns].astype(str).apply(lambda x: " ".join(x), axis=1)
    return clean_text(" ".join(texts.tolist()))

def load_pdf(file_path: Path) -> str:
    """Load PDF using PyPDF2."""
    if PdfReader is None:
        print(f"Skipping PDF {file_path.name} because PyPDF2 is not installed.")
        return ""
    reader = PdfReader(str(file_path))
    text = ""
    for page in reader.pages:
        page_text = page.extract_text() or ""
        text += page_text + " "
    return clean_text(text)

def load_documents() -> List[str]:
    """
    Load all documents in DATA_DIR (TXT, PDF, CSV, Markdown) and return as list of strings.
    """
    documents = []

    if not DATA_DIR.exists():
        raise FileNotFoundError(f"Data directory not found: {DATA_DIR}")

    print(f"Looking for files in: {DATA_DIR}")

    # TXT
    for file in DATA_DIR.glob("*.txt"):
        text = load_txt(file)
        print(f"Loaded TXT {file.name}: {len(text)} characters")
        documents.append(text)

    # Markdown
    for file in DATA_DIR.glob("*.md"):
        text = load_md(file)
        print(f"Loaded Markdown {file.name}: {len(text)} characters")
        documents.append(text)

    # CSV
    for file in DATA_DIR.glob("*.csv"):
        text = load_csv(file)
        print(f"Loaded CSV {file.name}: {len(text)} characters")
        documents.append(text)

    # PDF
    for file in DATA_DIR.glob("*.pdf"):
        text = load_pdf(file)
        print(f"Loaded PDF {file.name}: {len(text)} characters")
        if text:
            documents.append(text)

    print(f"Total documents loaded: {len(documents)}")
    return documents

def chunk_documents(docs: List[str], chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """
    Split documents into smaller chunks for embedding.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        separators=["\n\n", "\n", ".", " ", ""]
    )
    chunks = []
    for doc in docs:
        chunks.extend(splitter.split_text(doc))
    return chunks

if __name__ == "__main__":
    docs = load_documents()
    print(f"Loaded {len(docs)} documents")
    chunks = chunk_documents(docs)
    print(f"Generated {len(chunks)} chunks")
    print(chunks[:3])  # Preview first few
