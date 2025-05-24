// src/snOpenAI.js
// ServiceNow-OpenAI integration module using Fluent and Axios

const fluent = require('fluent');
const axios = require('axios');

/**
 * Sends a prompt to OpenAI and returns the response.
 * @param {string} prompt - The prompt to send to OpenAI.
 * @param {string} apiKey - The OpenAI API key.
 * @returns {Promise<string>} - The response from OpenAI.
 */
async function sendPromptToOpenAI(prompt, apiKey) {
  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.choices[0].message.content;
}

module.exports = { sendPromptToOpenAI };
