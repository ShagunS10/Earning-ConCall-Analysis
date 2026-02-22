import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";


const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.get("/", (req, res) => res.send("🚀 Analyst Engine Backend is Live!"));

app.post("/analyze", upload.single("file"), async (req, res) => {
    let filePath = "";
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        filePath = req.file.path;

        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString("base64");

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // SWITCHED TO STABLE 2.5 FLASH: Higher quota, avoids the 404/503 issues of 3-preview
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash", 
            generationConfig: { responseMimeType: "application/json" } 
        });

        const prompt = `Analyze this document. Return ONLY a JSON object:
{
  "managementTone": { "sentiment": "string", "quote": "string" },
  "positives": ["string"],
  "concerns": ["string"],
  "guidance": { 
    "revenue": { "text": "string", "certainty": "High/Moderate/Low" },
    "margin": { "text": "string", "certainty": "High/Moderate/Low" },
    "capex": { "text": "string", "certainty": "High/Moderate/Low" }
  },
  "capacityUtilization": "string describing current and target trends",
  "growthInitiatives": ["string"]
}`;

        // Robust retry logic for the demo
        const generateWithRetry = async (attempts = 3) => {
            try {
                const result = await model.generateContent([
                    { inlineData: { data: base64Data, mimeType: "application/pdf" } },
                    { text: prompt },
                ]);
                return result.response;
            } catch (err) {
                if (attempts > 1 && (err.message.includes("503") || err.message.includes("429"))) {
                    console.log(`Retrying... ${attempts - 1} attempts left.`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    return generateWithRetry(attempts - 1);
                }
                throw err;
            }
        };

        const response = await generateWithRetry();
        const cleanText = response.text().replace(/```json|```/g, "").trim();
        
        res.json(JSON.parse(cleanText));

    } catch (error) {
        console.error("Critical Error:", error.message);
        res.status(500).json({
            "managementTone": { "sentiment": "Error", "quote": "Service busy. Please try again." },
            "positives": ["System is online"],
            "concerns": ["API Quota Limiting"],
            "guidance": { "revenue": "N/A", "margin": "N/A" }
        });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
        }
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Analyst Engine Live on Port: ${PORT}`));