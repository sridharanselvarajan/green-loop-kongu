import requests
import cv2
import numpy as np

# Create a dummy image
img = np.zeros((100, 100, 3), dtype=np.uint8)
cv2.imwrite("dummy.jpg", img)

url = "http://127.0.0.1:8000/detect/"
files = {'file': open('dummy.jpg', 'rb')}
try:
    response = requests.post(url, files=files)
    print("Status:", response.status_code)
    if response.status_code == 200:
        data = response.json()
        print("Keys:", data.keys())
        print("Detections length:", len(data.get("detections", [])))
        print("Image length:", len(data.get("image", "")))
    else:
        print("Response:", response.text)
except Exception as e:
    print("Error:", e)
