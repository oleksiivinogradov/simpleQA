/**
 * Knowledge Base Module
 * Handles searching through the BankFAQs CSV knowledge base
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Knowledge base path
const KNOWLEDGE_BASE_PATH = path.join(__dirname, '..', 'BankFAQs.csv');

/**
 * Search the knowledge base for relevant information based on the query
 * @param {string} query - The search query (user question)
 * @returns {Promise<Array>} - Array of matching results with match scores
 */
async function searchKnowledgeBase(query) {
  return new Promise((resolve, reject) => {
    const results = [];
    
    // Simple keyword search implementation
    const searchTerms = query.toLowerCase().split(' ');
    
    // Check if the knowledge base file exists
    if (!fs.existsSync(KNOWLEDGE_BASE_PATH)) {
      return resolve([]);
    }
    
    fs.createReadStream(KNOWLEDGE_BASE_PATH)
      .pipe(csv())
      .on('data', (row) => {
        // Check if any of the searchTerms are in the row (simple keyword matching)
        const rowText = Object.values(row).join(' ').toLowerCase();
        const matchScore = searchTerms.filter(term => rowText.includes(term)).length;
        
        if (matchScore > 0) {
          results.push({
            ...row,
            matchScore
          });
        }
      })
      .on('end', () => {
        // Sort by match score and return top 3 results
        const topResults = results
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 3);
          
        resolve(topResults);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Format search results into readable context for the LLM
 * @param {Array} searchResults - Array of search results
 * @returns {string} - Formatted context string
 */
function formatSearchResults(searchResults) {
  if (searchResults.length === 0) {
    return 'No relevant information found in knowledge base.\n';
  }
  
  let context = 'Context from knowledge base:\n';
  searchResults.forEach((result, index) => {
    context += `[${index + 1}] ${Object.entries(result)
      .filter(([key]) => key !== 'matchScore')
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ')}\n`;
  });
  
  return context;
}

module.exports = {
  searchKnowledgeBase,
  formatSearchResults
}; 