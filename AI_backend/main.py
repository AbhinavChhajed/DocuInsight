from fastapi import FastAPI, UploadFile, Form, File, HTTPException
from pydantic import BaseModel
from typing import List
import uvicorn
import shutil
import os
from dotenv import load_dotenv

load_dotenv()

# --- MODERN LANGCHAIN IMPORTS ---
# These are the correct paths for LangChain v0.2/v0.3
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter  # <--- FIXED IMPORT
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate              # <--- FIXED IMPORT
from langchain_core.output_parsers import StrOutputParser          # <--- FIXED IMPORT

class AIResponse(BaseModel):
    answer: str
    sources: List[str]

llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")

app = FastAPI()

@app.post("/process")
async def process_request(
    files: List[UploadFile] = File(...), 
    userprompt: str = Form(...),
    searchenabled: str = Form(...) 
):
    print("Processing Started...")
    tempdir = "temp_uploads"
    os.makedirs(tempdir, exist_ok=True)

    saved_files = []
    for file in files:
        filepath = os.path.join(tempdir, file.filename)
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_files.append(filepath)
    
    try:
        # 1. Load All PDFs
        documents = []
        for path in saved_files:
            loader = PyPDFLoader(path)
            docs = loader.load()
            documents.extend(docs)
        
        # 2. Split Text
        textsplitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        splits = textsplitter.split_documents(documents)

        # 3. Vector Search
        vectorstore = Chroma.from_documents(documents=splits, embedding=embeddings)
        
        # Get the top 3 RELEVANT chunks
        relevant_docs = vectorstore.similarity_search(userprompt, k=3)
        
        # Build context from RELEVANT docs only
        context_text = "\n\n".join([doc.page_content for doc in relevant_docs])
        
        prompt = ChatPromptTemplate.from_template("""
        You are a helpful assistant. Answer the user's question based ONLY on the context below.

        CONTEXT:
        {context}

        QUESTION: 
        {question}
        """)

        chain = prompt | llm | StrOutputParser()

        answer_text = chain.invoke({
            "context": context_text,
            "question": userprompt
        })
        
        source_names = list(set([doc.metadata.get("source", "Unknown") for doc in relevant_docs]))
        
        shutil.rmtree(tempdir)

        return {
            "answer": answer_text,
            "sources": source_names
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        shutil.rmtree(tempdir, ignore_errors=True)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)