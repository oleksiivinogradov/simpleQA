/**
 * Unit Tests for Knowledge Base Module
 */

const fs = require('fs');
const path = require('path');
const { searchKnowledgeBase, formatSearchResults } = require('../db/knowledgeBase');

// Mock fs module
jest.mock('fs');
jest.mock('csv-parser', () => {
  // Return a function that creates a mock implementation
  return jest.fn().mockImplementation(() => {
    // Create a mock implementation that returns an event emitter
    const EventEmitter = require('events');
    return new EventEmitter();
  });
});

describe('Knowledge Base Module', () => {
  // Sample data for tests
  const mockData = [
    { question: 'How do I check my balance?', answer: 'You can check your balance online or at an ATM', category: 'Account' },
    { question: 'What is the ATM withdrawal limit?', answer: 'The daily limit is $500', category: 'ATM' },
    { question: 'How do I report a stolen card?', answer: 'Call our hotline at 1-800-555-1234', category: 'Cards' }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock file existence check
    fs.existsSync.mockReturnValue(true);
  });

  describe('searchKnowledgeBase', () => {
    test('should return matching results based on query', async () => {
      // Create a mock stream
      const mockStream = {
        on: jest.fn().mockImplementation(function(event, callback) {
          if (event === 'data') {
            // Store the callback for data event
            this.dataCallback = callback;
          } else if (event === 'end') {
            // Store the callback for end event
            this.endCallback = callback;
          }
          return this;
        }),
        pipe: jest.fn().mockReturnThis()
      };
      
      // Mock createReadStream to return our mock stream
      fs.createReadStream.mockReturnValue(mockStream);
      
      // Execute the function (don't await yet)
      const resultPromise = searchKnowledgeBase('balance');
      
      // Manually emit events
      mockData.forEach(data => {
        if (mockStream.dataCallback) mockStream.dataCallback(data);
      });
      if (mockStream.endCallback) mockStream.endCallback();
      
      // Now await the result
      const results = await resultPromise;
      
      // Verify the results
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('matchScore');
    });

    test('should return empty array when file does not exist', async () => {
      // Mock file not existing
      fs.existsSync.mockReturnValue(false);
      
      // Execute function
      const results = await searchKnowledgeBase('query');
      
      // Verify results
      expect(results).toEqual([]);
    });

    test('should handle errors properly', async () => {
      // Create a mock stream with error handling
      const mockStream = {
        on: jest.fn().mockImplementation(function(event, callback) {
          if (event === 'error') {
            // Store the error callback
            this.errorCallback = callback;
          }
          return this;
        }),
        pipe: jest.fn().mockReturnThis()
      };
      
      // Mock createReadStream to return our mock
      fs.createReadStream.mockReturnValue(mockStream);
      
      // Execute the function (don't await yet)
      const resultPromise = searchKnowledgeBase('query');
      
      // Emit an error event
      const testError = new Error('Test error');
      if (mockStream.errorCallback) mockStream.errorCallback(testError);
      
      // Verify the error is rejected
      await expect(resultPromise).rejects.toThrow('Test error');
    });
  });

  describe('formatSearchResults', () => {
    test('should format search results correctly', () => {
      // Prepare test data
      const testResults = [
        { question: 'Test Q1?', answer: 'Test A1', category: 'Test', matchScore: 2 },
        { question: 'Test Q2?', answer: 'Test A2', category: 'Test', matchScore: 1 }
      ];
      
      // Call the function
      const formatted = formatSearchResults(testResults);
      
      // Verify format
      expect(formatted).toContain('Context from knowledge base:');
      expect(formatted).toContain('[1]');
      expect(formatted).toContain('Test Q1?');
      expect(formatted).toContain('Test A1');
      expect(formatted).not.toContain('matchScore');
    });

    test('should handle empty results', () => {
      // Call with empty array
      const formatted = formatSearchResults([]);
      
      // Verify result
      expect(formatted).toContain('No relevant information found');
    });
  });
}); 