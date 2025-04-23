/**
 * Simple QA Server
 * Handles API requests and integrates with knowledge base and AI services
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { searchKnowledgeBase, formatSearchResults } = require('./db/knowledgeBase');
const { callGeminiAPI, createBankAssistantPrompt } = require('./services/aiService');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// In-memory storage for Q&A history
const qaHistory = [];

/**
 * API endpoint to handle user questions
 * Searches knowledge base and calls AI service
 */
app.post('/api/ask', async (req, res) => {
  const { question } = req.body;
  
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }
  
  try {
    // Step 1: Search knowledge base for relevant context
    const searchResults = await searchKnowledgeBase(question);
    
    // Step 2: Format the search results into context for the LLM
    const context = formatSearchResults(searchResults);
    
    // Step 3: Create the prompt for the AI
    const prompt = createBankAssistantPrompt(context, question);
    
    // Step 4: Call Gemini API
    const answer = await callGeminiAPI(prompt);
    
    // Step 5: Add to history
    const qaItem = {
      id: Date.now(),
      question,
      answer,
      timestamp: new Date().toISOString()
    };
    
    qaHistory.push(qaItem);
    
    // Step 6: Return response
    res.json(qaItem);
  } catch (error) {
    console.error('Error processing question:', error);
    res.status(500).json({ 
      error: 'Failed to process your question', 
      details: error.message 
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
  });
}

// Export for testing
module.exports = app; 