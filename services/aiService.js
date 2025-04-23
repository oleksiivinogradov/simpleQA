/**
 * AI Service Module
 * Handles communication with the Gemini AI API
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// API key and model configuration
const API_KEY_FILENAME = path.join(__dirname, '..', 'GEMINI_API_KEY.txt');
const GEMINI_MODEL_NAME = "gemini-1.5-flash";

// Check if API key file exists before trying to read it
let GEMINI_API_KEY = '';
try {
  if (fs.existsSync(API_KEY_FILENAME)) {
    GEMINI_API_KEY = fs.readFileSync(API_KEY_FILENAME, 'utf8').trim();
  }
} catch (error) {
  console.error('Error reading API key file:', error.message);
}

const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/${GEMINI_MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;

/**
 * Call the Gemini API with a prompt
 * @param {string} prompt - The prompt text to send to the AI
 * @returns {Promise<string>} - The generated response text
 */
async function callGeminiAPI(prompt) {
  console.log(`\n--- Calling Gemini API: ${GEMINI_MODEL_NAME} ---`);
  
  // If API key is missing, return error message
  if (!GEMINI_API_KEY) {
    return '[Error: Gemini API key is missing. Please create GEMINI_API_KEY.txt file]';
  }
  
  try {
    const response = await axios.post(GEMINI_API_URL, {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048
      }
    });
    
    if (response.data && 
        response.data.candidates && 
        response.data.candidates[0] && 
        response.data.candidates[0].content && 
        response.data.candidates[0].content.parts && 
        response.data.candidates[0].content.parts[0] && 
        response.data.candidates[0].content.parts[0].text) {
      console.log(`--- Gemini ${GEMINI_MODEL_NAME} Response Generated ---`);
      return response.data.candidates[0].content.parts[0].text.trim();
    } else {
      console.error(`Error: Unexpected response format from Gemini API`);
      return `[Error: Unexpected response format from Gemini API]`;
    }
  } catch (error) {
    console.error(`Error calling Gemini API:`, error.message);
    return `[Error calling Gemini API: ${error.message}]`;
  }
}

/**
 * Create a prompt for the bank assistant
 * @param {string} context - Relevant context from knowledge base
 * @param {string} question - User's question
 * @returns {string} - Formatted prompt for the AI
 */
function createBankAssistantPrompt(context, question) {
  return `
You are a helpful bank assistant. Answer the following question based on the provided context.
If the context doesn't contain relevant information, say that you don't have enough information 
and suggest contacting customer service.

${context}

User question: ${question}

Please provide a concise and accurate answer:
`;
}

module.exports = {
  callGeminiAPI,
  createBankAssistantPrompt
}; 