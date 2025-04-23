/**
 * Unit Tests for AI Service Module
 */

const fs = require('fs');
const axios = require('axios');
const path = require('path');

// Need to mock fs before requiring the module
jest.mock('fs');
jest.mock('axios');
jest.mock('path');

// Create a test API key file path
const TEST_API_KEY_PATH = '/test/GEMINI_API_KEY.txt';

// Mock path.join to return a predictable path
path.join.mockImplementation((...args) => {
  if (args.includes('GEMINI_API_KEY.txt')) {
    return TEST_API_KEY_PATH;
  }
  return args.join('/');
});

describe('AI Service Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock for file existence and content
    fs.existsSync.mockImplementation((filePath) => {
      if (filePath === TEST_API_KEY_PATH) {
        return true;
      }
      return false;
    });
    
    fs.readFileSync.mockImplementation((filePath, encoding) => {
      if (filePath === TEST_API_KEY_PATH) {
        return 'test-api-key';
      }
      throw new Error('File not found');
    });
  });
  
  // Reset modules before each test to reload with new mock settings
  beforeEach(() => {
    jest.resetModules();
  });
  
  describe('callGeminiAPI', () => {
    test('should return AI response when API call succeeds', async () => {
      // Import module after setting up mocks
      const { callGeminiAPI } = require('../services/aiService');
      
      // Mock a successful API response
      axios.post.mockResolvedValue({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'This is a test AI response'
                  }
                ]
              }
            }
          ]
        }
      });
      
      // Call the function
      const result = await callGeminiAPI('test prompt');
      
      // Verify
      expect(result).toEqual('This is a test AI response');
      expect(axios.post).toHaveBeenCalled();
    });
    
    test('should return error message when API response format is incorrect', async () => {
      // Import module after setting up mocks
      const { callGeminiAPI } = require('../services/aiService');
      
      // Mock an invalid response format
      axios.post.mockResolvedValue({
        data: {}
      });
      
      // Call the function
      const result = await callGeminiAPI('test prompt');
      
      // Verify
      expect(result).toContain('[Error: Unexpected response format');
    });
    
    test('should return error message when API call fails', async () => {
      // Import module after setting up mocks
      const { callGeminiAPI } = require('../services/aiService');
      
      // Mock an API error
      axios.post.mockRejectedValue(new Error('API failure'));
      
      // Call the function
      const result = await callGeminiAPI('test prompt');
      
      // Verify
      expect(result).toContain('[Error calling Gemini API');
    });
    
    test('should return error when API key is missing', async () => {
      // Mock missing API key file
      fs.existsSync.mockImplementation((filePath) => {
        if (filePath === TEST_API_KEY_PATH) {
          return false;
        }
        return false;
      });
      
      // Import module after setting up mocks to get fresh instance
      const { callGeminiAPI } = require('../services/aiService');
      
      // Call the function
      const result = await callGeminiAPI('test prompt');
      
      // Verify
      expect(result).toContain('API key is missing');
    });
  });
  
  describe('createBankAssistantPrompt', () => {
    test('should format prompt correctly', () => {
      // Import module after setting up mocks
      const { createBankAssistantPrompt } = require('../services/aiService');
      
      const context = 'Test context';
      const question = 'Test question';
      
      const prompt = createBankAssistantPrompt(context, question);
      
      expect(prompt).toContain('Test context');
      expect(prompt).toContain('Test question');
      expect(prompt).toContain('bank assistant');
    });
  });
}); 