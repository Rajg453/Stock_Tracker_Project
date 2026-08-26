// c:\Users\gorai\OneDrive\Documents\Custom Office Templates\Desktop\react\backend\testHuggingFace.js

// This is an asynchronous function. 'async' means this function will perform tasks that take time
// (like sending a message over the internet) and will wait for the result without freezing the app.
async function askAI() {
    
    // STEP 1: Set up your Free Token.
    // To use Hugging Face, you need a free key so they know who is making requests.
    // Go to https://huggingface.co/settings/tokens to create a free account and get a token.
    const HF_TOKEN = "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"; // IMPORTANT: Replace this with your real token!

    // STEP 2: Choose the AI Model.
    // Hugging Face hosts thousands of models. Here, we choose a very fast and smart text model.
    // 'google/flan-t5-large' is great for answering questions and summarizing.
    const modelId = "google/flan-t5-large"; 

    // STEP 3: Define the URL.
    // This is the specific web address on Hugging Face's servers where our chosen model lives.
    const url = `https://api-inference.huggingface.co/models/${modelId}`;

    // STEP 4: Define what we want to say to the AI.
    // 'inputs' is the actual text prompt or question we are sending to the AI.
    const dataToSend = {
        inputs: "Explain what React.js is in one simple sentence.",
    };

    console.log("Sending question to Hugging Face AI...");

    try {
        // STEP 5: Make the network request.
        // 'await fetch()' sends our request across the internet to the URL we defined.
        const response = await fetch(url, {
            method: "POST", // 'POST' means we are pushing/sending data to their server.
            headers: {
                "Authorization": `Bearer ${HF_TOKEN}`, // We pass our secret token as a 'Bearer' token.
                "Content-Type": "application/json",    // We tell them our data is formatted as JSON.
            },
            // 'JSON.stringify' turns our Javascript 'dataToSend' object into pure text so it can travel over the web.
            body: JSON.stringify(dataToSend),
        });

        // STEP 6: Read the response.
        // Once Hugging Face replies, we take their response and convert it from text back into a Javascript object.
        const result = await response.json();

        // STEP 7: Print the result.
        // Finally, we print out exactly what the AI generated!
        console.log("\n--- AI Response ---");
        console.log(result);
        console.log("-------------------");

    } catch (error) {
        // STEP 8: Error handling.
        // If your internet drops or the server is down, the code jumps here instead of crashing the whole app.
        console.error("Oops! Something went wrong:", error);
    }
}

// STEP 9: Execute the function.
// This single line actually triggers everything written above.
askAI();
