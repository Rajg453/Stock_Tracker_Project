import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Watchlist from '../models/Watchlist.js';

// 1. Create a new Express Router. This helps us organize our routes (URLs) into separate files.
const router = express.Router();

// 2. Define a POST route at the path '/' (which will become '/api/ai/' when attached in server.js).
// We use POST because the frontend is sending data (the user's question) to the backend.
router.post('/', async (req, res) => {
    
    // 3. Extract the 'question' from the incoming request body sent by the frontend.
    const { question } = req.body;

    // 4. Check if the question is missing or empty. If so, return a 400 Bad Request error.
    if (!question) {
        return res.status(400).json({ error: 'Question is required' });
    }

    try {
        // 5. Read the Hugging Face token from our secure environment variables (.env file).
        const HF_TOKEN = process.env.HF_TOKEN;

        // 6. Define the URL for the Hugging Face model we want to use (flan-t5-large).
        const modelId = "google/flan-t5-large";
        const url = `https://api-inference.huggingface.co/models/${modelId}`;

        // 7. Define the payload. 'inputs' is what Hugging Face expects as the prompt.
        const dataToSend = {
            inputs: `You are an expert stock market advisor. Please answer this question from a beginner investor: ${question}`,
        };

        // 8. Make the network request to Hugging Face using fetch.
        const response = await fetch(url, {
            method: "POST", // Send data to Hugging Face
            headers: {
                "Authorization": `Bearer ${HF_TOKEN}`, // Pass our secure token for authentication
                "Content-Type": "application/json",    // Tell Hugging Face we are sending JSON data
            },
            body: JSON.stringify(dataToSend), // Convert our JavaScript object into a JSON string
        });

        // 9. Read and parse the JSON response returned by Hugging Face.
        const result = await response.json();

        // 10. Check if the response from Hugging Face is OK (status 200-299).
        if (!response.ok) {
            console.error("Hugging Face API Error:", result);
            return res.status(response.status).json({ error: 'Error from AI service', details: result });
        }

        // 11. Hugging Face typically returns an array. We extract the generated text.
        // E.g. [{ generated_text: "..." }]
        let answerText = "Sorry, I couldn't generate an answer.";
        if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
             answerText = result[0].generated_text;
        }

        // 12. Send the successfully extracted answer text back to our React frontend as JSON.
        res.json({ answer: answerText });

    } catch (error) {
        // 13. If anything crashes (e.g. network failure), catch the error here so the server doesn't crash.
        console.error("AI Route Exception:", error);
        
        // 14. Send a 500 Internal Server Error back to the frontend.
        res.status(500).json({ error: `Internal server error while talking to AI: ${error.message}` });
    }
});

// @route   POST /api/ai/rag
// @desc    Personalized "Ask-Your-Data" Agent using RAG
// @access  Private
router.post('/rag', protect, async (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    try {
        // 1. Retrieve the user's specific watchlist from the database
        const watchlist = await Watchlist.findOne({ user: req.user._id }).populate('stocks');
        
        // 2. Build our "Context". This is the 'Retrieval' part of RAG.
        // We take the raw database data and turn it into plain English for the AI to read.
        let portfolioContext = "The user has no stocks in their portfolio.";
        if (watchlist && watchlist.stocks.length > 0) {
            portfolioContext = "The user currently owns the following stocks in their portfolio: " + 
                watchlist.stocks.map(s => `${s.symbol} (current price: $${s.currentPrice})`).join(', ') + ".";
        }

        // 3. Combine the context and the user's question into one super-prompt.
        const ragPrompt = `[INST] You are an expert financial AI. Context: ${portfolioContext}\n\nQuestion: ${question}\n\nPlease answer the question directly, keeping the context in mind. Keep your answer brief and helpful. [/INST]`;

        // 4. Send this to a larger Instruct model (like Mistral) capable of understanding context
        const HF_TOKEN = process.env.HF_TOKEN;
        const modelId = "mistralai/Mistral-7B-Instruct-v0.2";
        const url = `https://api-inference.huggingface.co/models/${modelId}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              inputs: ragPrompt,
              parameters: { max_new_tokens: 150, return_full_text: false }
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("Hugging Face API Error:", result);
            return res.status(response.status).json({ error: 'Error from AI service (might be warming up).', details: result });
        }

        let answerText = "Sorry, I couldn't generate an answer.";
        if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
             answerText = result[0].generated_text.trim();
        } else if (result.generated_text) {
             answerText = result.generated_text.trim();
        }

        res.json({ answer: answerText });
    } catch (error) {
        console.error("RAG Route Exception:", error);
        res.status(500).json({ error: `Internal server error while talking to AI: ${error.message}` });
    }
});

// @route   POST /api/ai/vision
// @desc    Visual Technical Analysis using VLM
// @access  Public
router.post('/vision', async (req, res) => {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'Image data is required' });

    try {
        const HF_TOKEN = process.env.HF_TOKEN;
        
        // We use moondream2 as it is lightweight, fast, and excellent for visual QA on edge/free tiers.
        // LLaVA is also great but often requires Pro tier for large image payloads.
        const modelId = "vikhyatk/moondream2"; 
        const url = `https://api-inference.huggingface.co/models/${modelId}`;

        // Strip the data:image/png;base64, prefix if it exists before sending to HF
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        
        // Convert base64 to binary buffer
        const imageBuffer = Buffer.from(base64Data, 'base64');

        // Hugging Face vision endpoints often accept raw image bytes or specific JSON structures.
        // For moondream2, it can often take the raw image buffer if we just want a caption, 
        // or we can use the specific VQA payload.
        // However, a robust way for many HF vision models is to send the image as raw binary.
        // But since we want to ask a specific question, let's try the standard JSON payload format first,
        // or just rely on a simpler model if it fails.
        // Wait, passing images via API to moondream on HF free tier is notoriously tricky via JSON.
        // Let's use Salesforce/blip-image-captioning-large for a safer fallback, which accepts raw image bytes.
        // Actually, we'll try the conversational payload for moondream:
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: {
                   image: base64Data,
                   question: "This is a stock market chart. Briefly explain the current trend."
                }
            })
        });

        const result = await response.json();

        if (!response.ok) {
            console.error("HF Vision API Error:", result);
            return res.status(response.status).json({ error: 'Vision model error (might be warming up or payload format issue)', details: result });
        }

        let answerText = "I couldn't analyze the chart right now.";
        if (Array.isArray(result) && result.length > 0 && result[0].answer) {
             answerText = result[0].answer;
        } else if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
             answerText = result[0].generated_text;
        }

        res.json({ answer: answerText });
    } catch (error) {
        console.error("Vision Route Exception:", error);
        res.status(500).json({ error: 'Internal server error during visual analysis.' });
    }
});

// 15. Export the router so it can be imported and used in server.js.
export default router;
