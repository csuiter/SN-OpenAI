// tests/snOpenAI.test.js
const { sendPromptToOpenAI } = require('../src/snOpenAI');

jest.mock('axios');
const axios = require('axios');

describe('sendPromptToOpenAI', () => {
  it('should return OpenAI response text', async () => {
    axios.post.mockResolvedValue({
      data: {
        choices: [
          { message: { content: 'Hello from OpenAI!' } }
        ]
      }
    });
    const result = await sendPromptToOpenAI('Hello?', 'fake-api-key');
    expect(result).toBe('Hello from OpenAI!');
  });
});
