import os
import requests
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from model.detect import predict_waste, detect_waste
import shutil
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
MODEL_DIR = "model"
MODEL_PATH = os.path.join(MODEL_DIR, "best.pt")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)


def download_model():
    """
    Download the YOLO model weights if they are not present locally.
    Set the MODEL_URL environment variable to your Google Drive or Hugging Face direct download link.
    """
    model_url = os.getenv("MODEL_URL")

    if not model_url:
        print("MODEL_URL not set. Skipping model download (assuming model already exists locally).")
        return

    if os.path.exists(MODEL_PATH):
        print(f"Model already exists at {MODEL_PATH}. Skipping download.")
        return

    print(f"Downloading model weights from: {model_url}")
    try:
        response = requests.get(model_url, stream=True, timeout=300)
        response.raise_for_status()
        with open(MODEL_PATH, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        print(f"Model downloaded successfully to {MODEL_PATH}")
    except Exception as e:
        print(f"Failed to download model: {e}")
        raise RuntimeError(f"Could not download model weights: {e}")


# Download model at server startup
download_model()


@app.get("/")
async def root():
    return {"message": "Greenloop YOLO API is running"}


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
