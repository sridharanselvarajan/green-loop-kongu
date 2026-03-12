from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from model.detect import predict_waste, detect_waste
import shutil
import os
import uuid

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    file_path = f"{UPLOAD_DIR}/uploaded.jpg" 
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    result = predict_waste(file_path)
    if os.path.exists(file_path):
        os.remove(file_path)  
    return {"prediction": result}

@app.post("/detect/")
async def detect(file: UploadFile = File(...)):
    ext = file.filename.split('.')[-1] if file.filename else 'jpg'
    file_path = f"{UPLOAD_DIR}/{uuid.uuid4().hex}.{ext}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    result = detect_waste(file_path)
    if os.path.exists(file_path):
        os.remove(file_path)
    return result

