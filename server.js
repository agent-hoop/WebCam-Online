import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";

const app = express();
const PORT = 4000;

// Allow frontend from anywhere (you can lock this down later)
app.use(cors({ origin: "*" }));

// Allow large JSON payloads (camera images)
app.use(express.json({ limit: "20mb" }));

// Directory to save images
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

let counter = 0;

// Upload endpoint
app.post("/upload", (req, res) => {
  try {
    const data = req.body.image;
    if (!data) throw new Error("No image provided");

    // Extract image format and base64
    const match = data.match(/^data:image\/(\w+);base64,/);
    if (!match) throw new Error("Invalid image data");
    const ext = match[1]; // png, jpeg, etc.
    const base64Data = data.replace(/^data:image\/\w+;base64,/, "");

    // Save file
    const filename = `frame-${Date.now()}-${counter++}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(filepath, base64Data, "base64");

    res.json({ success: true, filename });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// List saved image filenames
app.get("/images", (req, res) => {
  try {
    const files = fs.readdirSync(UPLOAD_DIR)
      .filter(f => /\.(png|jpe?g)$/.test(f));
    res.json({ success: true, images: files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Send base64 for a specific image
// Example: GET /image/frame-1691234567890-0.png
app.get("/image/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(UPLOAD_DIR, filename);

    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, error: "File not found" });
    }

    const fileBuffer = fs.readFileSync(filepath);
    const ext = path.extname(filename).slice(1); // remove dot
    const base64 = `data:image/${ext};base64,${fileBuffer.toString("base64")}`;

    res.json({ success: true, filename, base64 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
