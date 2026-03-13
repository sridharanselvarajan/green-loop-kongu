import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import iconImage from "../../image/image.png";
import "../../style/home.css";

const WASTE_CATEGORIES = {
  organic: ["food waste", "vegetables", "fruits", "leaves"],
  hazardous: ["batteries", "paint", "chemicals", "medical waste"],
  recyclable: ["plastic", "paper", "glass", "metal", "electronics"],
};


function classifyWaste(detectedItems) {
  if (!detectedItems) return [];
  return detectedItems.map((item) => {
    let category = "other";
    const nameLower = item.name.toLowerCase();

    // Check if any keyword in organic array is inside nameLower
    if (WASTE_CATEGORIES.organic.some(kw => nameLower.includes(kw))) {
       category = "organic";
    } else if (WASTE_CATEGORIES.hazardous.some(kw => nameLower.includes(kw))) {
       category = "hazardous";
    } else if (WASTE_CATEGORIES.recyclable.some(kw => nameLower.includes(kw))) {
       category = "recyclable";
    } else if (nameLower.includes("glass") || nameLower.includes("plastic") || nameLower.includes("metal") || nameLower.includes("paper")) {
       category = "recyclable";
    } else if (nameLower.includes("medical") || nameLower.includes("hazard")) {
       category = "hazardous";
    } else if (nameLower.includes("food") || nameLower.includes("clothes") || nameLower.includes("green")) {
       category = "organic";
    }

    return { ...item, category };
  });
}

function Home() {
  const [chooseChoice, setChooseChoice] = useState(true);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [detections, setDetections] = useState([]);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setIsWebcamActive(true);
    } catch (error) {
      console.error("Error accessing webcam:", error);
      alert("Failed to access the webcam. Please check your camera permissions.");
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
  };

 const captureFrame = async () => {
  if (!videoRef.current || !canvasRef.current) return;

  const canvas = canvasRef.current;
  const context = canvas.getContext("2d");
  
  // Draw the current video frame to the canvas
  context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
  
  try {
    // Convert canvas to blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8); // 0.8 is quality
    });
    
    const formData = new FormData();
    formData.append('file', blob, 'webcam-frame.jpg');

    const response = await axios.post(`${process.env.REACT_APP_API_URL || "http://127.0.0.1:3000"}/api/yolo/detect`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    const classifiedDetections = classifyWaste(response.data.detections);
    setDetections(classifiedDetections);
  } catch (error) {
    console.error("Error detecting objects from webcam:", error);
  }
};useEffect(() => {
  let interval;
  if (isWebcamActive) {
    videoRef.current.srcObject = streamRef.current;
    interval = setInterval(captureFrame, 2000);
  }
  return () => {
    if (interval) clearInterval(interval);
  };
}, [isWebcamActive]);
  return (
    <div className="home-container">
      <div className="form">
        <div className="chooseform">
          <p className={chooseChoice ? "active" : "inactive"} onClick={() => setChooseChoice(true)}>
            Sell scrap
          </p>
          <p className={chooseChoice ? "inactive" : "active"} onClick={() => setChooseChoice(false)}>
            Assist you
          </p>
        </div>

        {!chooseChoice ? (
          <div className="assist-scrollable-container">
            <DropPhoto setDetections={setDetections} />
            {!isWebcamActive ? (
              <button onClick={startWebcam} className="webcam-button">
                Start Webcam
              </button>
            ) : (
              <div>
                <video ref={videoRef} autoPlay width="100%" height="auto" />
                <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }} />
                <button onClick={stopWebcam} className="webcam-button">
                  Stop Webcam
                </button>
              </div>
            )}
            <WasteInfo detections={detections} navigate={navigate} />
          </div>
        ) : (
          <SellProduct navigate={navigate} />
        )}
      </div>
    </div>
  );
}
const ORGANIC_YOUTUBE_LINKS = [
  { title: "How to Compost Food Waste", url: "https://www.youtube.com/watch?v=9FfnbTC5DQE" },
  { title: "DIY Organic Fertilizer", url: "https://www.youtube.com/watch?v=VcAdqF9JdFQ" },
];

function WasteInfo({ detections, navigate }) {
  return (
    <div className="waste-info">
      <h3>Detected Waste Categories:</h3>
      {detections.length > 0 ? (
        detections.map((detection, index) => (
          <div key={index} className={`waste-card ${detection.category}`}>
            <p>
              {detection.name} ({detection.category.toUpperCase()})
            </p>
            <p>Confidence: {detection.confidence.toFixed(2)}</p>
            <p>Disposal Suggestion: {getDisposalSuggestion(detection.category)}</p>

            {/* Show YouTube Links for Organic Waste */}
            {detection.category === "organic" && (
              <div className="organic-links">
                <h4>Learn more:</h4>
                {ORGANIC_YOUTUBE_LINKS.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer">
                    {link.title}
                  </a>
                ))}
              </div>
            )}

            {/* Show 'Schedule Pickup' Button ONLY for Non-Organic Waste */}
            {detection.category !== "organic" && (
              <button className="schedule-button" onClick={() => navigate("/schedule")}>
                Schedule My Pickup
              </button>
            )}
          </div>
        ))
      ) : (
        <p>No waste detected yet.</p>
      )}
    </div>
  );
}


function getDisposalSuggestion(category) {
  switch (category) {
    case "organic":
      return "Compost it or use as organic fertilizer.";
    case "hazardous":
      return "Dispose at a hazardous waste collection site.";
    case "recyclable":
      return "Send to a recycling center.";
    default:
      return "Dispose in general waste or seek guidance.";
  }
}

function SellProduct({ navigate }) {
  return (
    <div className="sell-container">
      <p className="header1">Nice to meet you, User</p>
      <p className="header1 header2">Impact made by your company</p>
      <img src={iconImage} alt="Impact" className="impact-image" />
      <p className="header2 header3">Wish to recycle more?</p>
      <button className="button" onClick={() => navigate("/schedule")}>
        Schedule a Pickup
      </button>
      <button className="button" onClick={() => navigate("/checkstatus")}>
        Check my Pickups
      </button>
      <div className="footer">
        <Link to="/login" className="link">
          Logout
        </Link>
        <p className="message">
          Facing Problems? Call us at <span>+1234567890</span>
        </p>
      </div>
    </div>
  );
}
function DropPhoto({ setDetections }) {
  const [image, setImage] = useState(null);
  const [detectedImage, setDetectedImage] = useState(null);
  const [error, setError] = useState("");

  const handleDrop = (event) => {
    event.preventDefault();
    setError("");
    const file = event.dataTransfer.files[0];
    processImage(file);
  };

  const handleFileChange = (event) => {
    setError("");
    const file = event.target.files[0];
    processImage(file);
  };

  const processImage = async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setImage(file);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || "http://127.0.0.1:3000"}/api/yolo/detect`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDetectedImage(`data:image/jpeg;base64,${response.data.image}`);

      const classifiedDetections = classifyWaste(response.data.detections);
      setDetections(classifiedDetections);
    } catch (error) {
      console.error("Error during image upload:", error);
      setError("Failed to process the image. Make sure the backend is running.");
    }
  };

  return (
    <div className="aifeature">
      <p className="feature">
        Upload an image, and our <span>AI-powered</span> system will analyze it to determine the type of item and suggest proper disposal methods.
      </p>

      <div className="upload-box" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
        {image && !detectedImage ? (
          <div className="image-preview">
            <img src={URL.createObjectURL(image)} alt="Uploaded Preview" />
          </div>
        ) : (
          <p>Drag & Drop a photo here <br /> or click to upload</p>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <input type="file" accept="image/*" onChange={handleFileChange} className="file-input" />

      {detectedImage && (
        <div className="detected-container">
          <h3>Detected Image:</h3>
          <img src={detectedImage} alt="Detected Objects" />
        </div>
      )}
    </div>
  );
}

export default Home;