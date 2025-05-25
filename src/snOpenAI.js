// ServiceNow-OpenAI integration module using Fluent and Axios
require('dotenv').config();
const fluent = require('fluent-logger').createFluentSender('openai', { host: 'localhost', port: 24224 });
const axios = require('axios');

// Configuration
const config = {
    apiKey: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 1000,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
};

// Rate limiting
let lastRequestTime = 0;
const minRequestInterval = 1000; // 1 second between requests

/**
 * Sends a prompt to OpenAI and returns the response.
 * @param {string} prompt - The prompt to send to OpenAI.
 * @param {string} apiKey - The OpenAI API key (optional, uses env var if not provided).
 * @returns {Promise<string>} - The response from OpenAI.
 */
async function sendPromptToOpenAI(prompt, apiKey = null) {
    try {
        // Validation
        if (!prompt || prompt.trim() === '') {
            const error = 'Error: No prompt provided';
            console.error(error);
            return error;
        }

        const key = apiKey || config.apiKey;
        if (!key) {
            const error = 'Error: OpenAI API key not configured';
            console.error(error);
            return error;
        }

        // Sanitize prompt to remove sensitive data
        const sanitizedPrompt = sanitizePromptData(prompt);

        // Rate limiting
        await enforceRateLimit();

        // Log request
        const requestId = generateRequestId();
        console.info(`OpenAI API request ${requestId}: Starting`);
        
        if (fluent) {
            fluent.emit('request', {
                requestId,
                prompt: sanitizedPrompt.substring(0, 100) + '...',
                timestamp: new Date().toISOString()
            });
        }

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: config.model,
                messages: [{ role: 'user', content: sanitizedPrompt }],
                max_tokens: config.maxTokens,
                temperature: config.temperature
            },
            {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                },
                timeout: config.timeout
            }
        );

        // Validate response
        if (!response.data || !response.data.choices || response.data.choices.length === 0) {
            throw new Error('Invalid response format from OpenAI API');
        }

        const result = response.data.choices[0].message.content;
        
        // Log success
        console.info(`OpenAI API call successful for request ${requestId}`);
        if (fluent) {
            fluent.emit('response', {
                requestId,
                success: true,
                responseLength: result.length,
                timestamp: new Date().toISOString()
            });
        }

        return result;

    } catch (error) {
        console.error('OpenAI API error:', error.message);
        
        if (fluent) {
            fluent.emit('error', {
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }

        // Handle specific error types
        if (error.response) {
            const status = error.response.status;
            const errorData = error.response.data;
            
            switch (status) {
                case 401:
                    return 'Error: Invalid OpenAI API key';
                case 429:
                    return 'Error: Rate limit exceeded. Please try again later.';
                case 500:
                    return 'Error: OpenAI service unavailable. Please try again later.';
                default:
                    return `Error: OpenAI API error (${status}): ${errorData?.error?.message || 'Unknown error'}`;
            }
        } else if (error.code === 'ECONNABORTED') {
            return 'Error: Request timeout. Please try again.';
        } else {
            return `Error: Network error - ${error.message}`;
        }
    }
}

/**
 * Format incident data for OpenAI analysis
 * @param {Object} incidentData - ServiceNow incident data
 * @returns {string} - Formatted prompt for analysis
 */
function formatIncidentForAnalysis(incidentData) {
    return `Analyze this ServiceNow incident and provide detailed guidance:

Incident Details:
- Number: ${incidentData.number || 'N/A'}
- Priority: ${incidentData.priority || 'N/A'}
- State: ${incidentData.state || 'N/A'}
- Short Description: ${incidentData.short_description || 'N/A'}
- Description: ${incidentData.description || 'N/A'}
- Category: ${incidentData.category || 'N/A'}
- Subcategory: ${incidentData.subcategory || 'N/A'}
- Assignment Group: ${incidentData.assignment_group || 'N/A'}
- Configuration Item: ${incidentData.cmdb_ci || 'N/A'}

Please provide:
1. Root cause analysis based on the symptoms
2. Detailed step-by-step resolution steps
3. Similar incidents to investigate for patterns
4. Prevention recommendations
5. Escalation criteria if resolution fails

Format your response for ServiceNow work notes with clear headings and actionable steps.`;
}

/**
 * Generate knowledge article prompt from incident data
 * @param {Object} incidentData - ServiceNow incident data
 * @returns {string} - Formatted prompt for knowledge generation
 */
function generateKnowledgePrompt(incidentData) {
    return `Create a comprehensive ServiceNow knowledge article based on this resolved incident:

Incident Information:
- Title: ${incidentData.short_description || 'N/A'}
- Problem Description: ${incidentData.description || 'N/A'}
- Resolution: ${incidentData.resolution_notes || incidentData.close_notes || 'N/A'}
- Category: ${incidentData.category || 'N/A'}

Generate a knowledge article with the following structure:
1. **Problem Statement** - Clear description of the issue
2. **Symptoms** - How users experience the problem
3. **Solution** - Step-by-step resolution instructions
4. **Root Cause** - Technical explanation of why this occurred
5. **Prevention** - How to avoid this issue in the future
6. **Related Information** - Links to relevant documentation

Use clear, professional language suitable for end users and technical staff. Include any relevant screenshots or diagram descriptions where helpful.`;
}

/**
 * Sanitize prompt data to remove sensitive information
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
function sanitizePromptData(text) {
    if (!text) return '';
    
    // Remove common sensitive patterns
    let sanitized = text;
    
    // Remove potential passwords
    sanitized = sanitized.replace(/password\s*[:=]\s*[\w\d!@#$%^&*()]+/gi, 'password: [REDACTED]');
    
    // Remove potential SSNs
    sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED-SSN]');
    
    // Remove potential credit card numbers
    sanitized = sanitized.replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[REDACTED-CC]');
    
    // Remove potential API keys (long alphanumeric strings)
    sanitized = sanitized.replace(/\b[a-zA-Z0-9]{32,}\b/g, '[REDACTED-KEY]');
    
    // Remove email addresses if configured to do so
    if (process.env.SANITIZE_EMAILS === 'true') {
        sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED-EMAIL]');
    }
    
    return sanitized;
}

/**
 * Enforce rate limiting between API calls
 */
async function enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < minRequestInterval) {
        const delay = minRequestInterval - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    lastRequestTime = Date.now();
}

/**
 * Generate unique request ID for tracking
 * @returns {string} - Unique request identifier
 */
function generateRequestId() {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Analyze ServiceNow incident with contextual prompts
 * @param {Object} incidentData - Incident data from ServiceNow
 * @returns {Promise<string>} - Analysis result
 */
async function analyzeIncident(incidentData) {
    const prompt = formatIncidentForAnalysis(incidentData);
    return await sendPromptToOpenAI(prompt);
}

/**
 * Generate knowledge article content from incident
 * @param {Object} incidentData - Incident data from ServiceNow
 * @returns {Promise<string>} - Knowledge article content
 */
async function generateKnowledgeArticle(incidentData) {
    const prompt = generateKnowledgePrompt(incidentData);
    return await sendPromptToOpenAI(prompt);
}

/**
 * Batch process multiple prompts with rate limiting
 * @param {Array} prompts - Array of prompts to process
 * @returns {Promise<Array>} - Array of responses
 */
async function batchProcessPrompts(prompts) {
    const results = [];
    
    for (const prompt of prompts) {
        try {
            const result = await sendPromptToOpenAI(prompt);
            results.push({ success: true, result });
        } catch (error) {
            results.push({ success: false, error: error.message });
        }
        
        // Add delay between batch requests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return results;
}

module.exports = {
    sendPromptToOpenAI,
    formatIncidentForAnalysis,
    generateKnowledgePrompt,
    sanitizePromptData,
    analyzeIncident,
    generateKnowledgeArticle,
    batchProcessPrompts,
    config
};
