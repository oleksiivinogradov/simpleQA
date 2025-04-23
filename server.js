/**
 * Simple QA Server
 * Handles API requests and integrates with knowledge base and AI services
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
// const { exec } = require('child_process'); // No longer needed
const axios = require('axios'); // Use axios for API calls
const { searchKnowledgeBase, formatSearchResults } = require('./db/knowledgeBase');
const { callGeminiAPI, createBankAssistantPrompt } = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 8080;
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434'; // Make Ollama URL configurable

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for Q&A history
const qaHistory = [];

/**
 * Call the Ollama model using the REST API
 * @param {string} question - The user question
 * @returns {Promise<string>} - The generated response text
 */
async function callOllamaModel(question) {
  const MODEL_NAME = 'bank-assistant-20250423'; // Or fetch dynamically if needed
  console.log(`\n--- Calling Ollama API: ${MODEL_NAME} at ${OLLAMA_API_URL} ---`);

  try {
    const response = await axios.post(`${OLLAMA_API_URL}/api/generate`, 
      {
        model: MODEL_NAME,
        prompt: question,
        stream: false // Get the full response at once
      },
      {
        timeout: 60000 // Increased timeout to 60 seconds for API call
      }
    );

    if (response.data && response.data.response) {
      console.log('--- Ollama API Response Received ---');
      return response.data.response.trim();
    } else {
      console.error('Ollama API returned an unexpected response format:', response.data);
      throw new Error('Ollama API returned an unexpected response format.');
    }

  } catch (error) {
    console.error(`Error calling Ollama API: ${error.message}`);
    if (error.code === 'ECONNABORTED') {
      console.error('Ollama API request timed out.');
      throw new Error('Ollama API request timed out. The model may be busy or not properly loaded. Try again later.');
    } else if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Ollama API Error Status:', error.response.status);
      console.error('Ollama API Error Data:', error.response.data);
      throw new Error(`Ollama API error: ${error.response.status} - ${error.response.data.error || 'Unknown error'}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from Ollama API. Is it running at the specified URL?');
      throw new Error('Could not connect to Ollama API. Please ensure it is running.');
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up Ollama API request:', error.message);
      throw new Error('Failed to set up request to Ollama API.');
    }
  }
}

/**
 * API endpoint to handle user questions
 * Searches knowledge base and calls AI service
 */
app.post('/api/ask', async (req, res) => {
  const { question, model = 'gemini' } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }
  
  try {
    let answer;
    
    // Always search knowledge base first
    const searchResults = await searchKnowledgeBase(question);
    const context = formatSearchResults(searchResults);
    const prompt = createBankAssistantPrompt(context, question);

    if (model === 'ollama') {
      // Call Ollama model with the structured prompt
      console.log('--- Using Ollama with KB Context ---');
      answer = await callOllamaModel(prompt); 
    } else {
      // Default to Gemini flow (already uses the prompt)
      console.log('--- Using Gemini with KB Context ---');
      answer = await callGeminiAPI(prompt);
    }
    
    // Step 5: Add to history
    const qaItem = {
      id: Date.now(),
      question,
      answer,
      model,
      context, // Optionally include context in history
      prompt,  // Optionally include prompt in history
      timestamp: new Date().toISOString()
    };
    
    qaHistory.push(qaItem);
    
    // Step 6: Return response
    res.json(qaItem);
  } catch (error) {
    console.error('Error processing question:', error);
    // Use the error message thrown by callOllamaModel or other services
    res.status(500).json({ 
      error: 'Failed to process your question', 
      details: error.message || 'An unknown error occurred' 
    });
  }
});

/**
 * API endpoint to retrieve Q&A history
 */
app.get('/api/history', (req, res) => {
  res.json(qaHistory);
});

// Start the server only if not in testing mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Ollama API expected at: ${OLLAMA_API_URL}`); // Log Ollama URL
  });
}

// Export for testing
module.exports = app; 