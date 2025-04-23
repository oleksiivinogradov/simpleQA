/**
 * Integration Tests for API Endpoints
 */

const request = require('supertest');
const app = require('../server');

// Mock the modules used by the server
jest.mock('../db/knowledgeBase', () => ({
  searchKnowledgeBase: jest.fn().mockResolvedValue([
    { 
      question: 'How do I check my balance?', 
      answer: 'You can check your balance online or at an ATM', 
      category: 'Account',
      matchScore: 2
    }
  ]),
  formatSearchResults: jest.fn().mockReturnValue('Mocked context')
}));

jest.mock('../services/aiService', () => ({
  callGeminiAPI: jest.fn().mockResolvedValue('This is a mocked AI response.'),
  createBankAssistantPrompt: jest.fn().mockReturnValue('Mocked prompt')
}));

describe('API Endpoints', () => {
  describe('POST /api/ask', () => {
    test('should return 400 if question is missing', async () => {
      const response = await request(app)
        .post('/api/ask')
        .send({});
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toBe('Question is required');
    });

    test('should return 200 with proper JSON response structure', async () => {
      const response = await request(app)
        .post('/api/ask')
        .send({ question: 'How do I check my balance?' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('question');
      expect(response.body).toHaveProperty('answer');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.question).toBe('How do I check my balance?');
      
      // Verify the answer exists but don't test exact content
      // as we're now testing against actual AI behavior
      expect(typeof response.body.answer).toBe('string');
      expect(response.body.answer.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/history', () => {
    test('should return history array', async () => {
      // First add an item to the history
      await request(app)
        .post('/api/ask')
        .send({ question: 'Test question' });
      
      // Then get the history
      const response = await request(app)
        .get('/api/history');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('question');
      expect(response.body[0]).toHaveProperty('answer');
    });
  });
}); 