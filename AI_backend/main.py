from fastapi import FastAPI,UploadFile,File,HTTPException
from dotenv import load_dotenv

load_dotenv()


app = FastAPI()


@app.get("/")
def start():
    return({"status":"AI running"})
