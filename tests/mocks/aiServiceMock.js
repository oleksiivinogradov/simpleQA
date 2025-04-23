/**
 * Mock of the AI Service Module for testing
 */

const callGeminiAPI = jest.fn().mockResolvedValue('Mocked AI response');
const createBankAssistantPrompt = jest.fn().mockReturnValue('Mocked prompt');

module.exports = {
  callGeminiAPI,
  createBankAssistantPrompt
}; 