
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid

# ── Hugging Face model download (runs at startup if model not found locally) ──
MODEL_PATH = os.environ.get("MODEL_PATH", "model/best.pt")
HF_MODEL_REPO = os.environ.get("HF_MODEL_REPO", "")   # e.g. "YourUsername/greenloop-model"
HF_MODEL_FILE = os.environ.get("HF_MODEL_FILE", "best.pt")

def download_model_if_needed():
    """Download model weights from Hugging Face Hub if not present locally."""
    if os.path.exists(MODEL_PATH):
        print(f"✅ Model found at {MODEL_PATH}, skipping download.")
        return
    if not HF_MODEL_REPO:
        raise RuntimeError(
            "Model file not found and HF_MODEL_REPO env var is not set. "
            "Please set HF_MODEL_REPO to your Hugging Face repo (e.g. 'username/greenloop-model')."
        )
    print(f"⬇️  Downloading model from Hugging Face: {HF_MODEL_REPO}/{HF_MODEL_FILE} ...")
    from huggingface_hub import hf_hub_download
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    downloaded_path = hf_hub_download(
        repo_id=HF_MODEL_REPO,
        filename=HF_MODEL_FILE,
        local_dir=os.path.dirname(MODEL_PATH),
    )
    print(f"✅ Model downloaded to {downloaded_path}")

download_model_if_needed()

# ── Load model AFTER ensuring weights exist ──
from model.detect import predict_waste, detect_waste

app = FastAPI(title="GreenLoop YOLO API")

# Allow all origins in dev; restrict via ALLOWED_ORIGINS env var in production
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in allowed_origins else allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "GreenLoop YOLO API is running"}


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

