from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from services.ingestion import load_documents_from_file  # function to load + chunk
from services.embedding import generate_embedding        # function to embed
from services.faiss_retriever import add_documents_to_index  # store in FAISS

router = APIRouter()

@router.post("/upload")
async def upload_documents(files: list[UploadFile] = File(...)):
    added_docs = []

    for file in files:
        content = await file.read()
        text = content.decode("utf-8")  # assuming text files
        chunks = load_documents_from_file(text, file.filename)  # chunking logic
        embeddings = [generate_embedding(chunk) for chunk in chunks]
        add_documents_to_index(chunks, embeddings, file.filename)
        
        added_docs.append({
            "filename": file.filename,
            "chunks_added": len(chunks)
        })

    return JSONResponse(content={"uploaded": added_docs})
