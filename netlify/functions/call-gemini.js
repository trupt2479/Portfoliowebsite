// This code runs on Netlify's servers, not in the browser.
// To make it work, you need to install 'node-fetch'.
// In your project's root directory, run: npm install node-fetch
const fetch = require('node-fetch');

// The handler function is the entry point for the serverless function.
exports.handler = async function(event, context) {
    // 1. Get the API key from secure environment variables.
    // This is set in your Netlify dashboard, not in the code.
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Check if the API key is available.
    if (!GEMINI_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key is not configured.' })
        };
    }

    // 2. Get the user's prompt from the request body sent by the frontend.
    let prompt;
    try {
        const body = JSON.parse(event.body);
        prompt = body.prompt;
    } catch (e) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
    }

    if (!prompt) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is missing.' }) };
    }

    // 3. Prepare the request to the actual Gemini API.
    // UPDATED: Changed model name to gemini-2.5-flash-preview-09-2025 for v1beta compatibility
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
    
    const requestPayload = {
        contents: [{
            role: "user",
            parts: [{ text: prompt }]
        }]
    };

    // 4. Call the Gemini API and handle the response.
    try {
        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestPayload)
        });

        const responseData = await geminiResponse.json();

        // If the API call itself was not successful, forward the error.
        if (!geminiResponse.ok) {
            console.error('Gemini API Error:', responseData);
            const errorMessage = responseData.error ? responseData.error.message : 'Unknown Gemini API Error';
            throw new Error(errorMessage);
        }
        
        // Extract the text from the response.
        const text = responseData.candidates[0].content.parts[0].text;

        // 5. Send the successful response back to the frontend.
        return {
            statusCode: 200,
            body: JSON.stringify({ text: text })
        };

    } catch (error) {
        console.error('Serverless function error:', error);
        // Send a generic error message back to the frontend.
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};