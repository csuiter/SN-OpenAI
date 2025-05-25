const axios = require('axios');
const snOpenAI = require('../src/snOpenAI');

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

describe('ServiceNow-OpenAI Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Set up environment variables for testing
        process.env.OPENAI_API_KEY = 'test-api-key';
        process.env.OPENAI_MODEL = 'gpt-3.5-turbo';
    });

    describe('OpenAI API Integration', () => {
        test('should successfully send prompt to OpenAI', async () => {
            const mockResponse = {
                data: {
                    choices: [{
                        message: {
                            content: 'This is a test response from OpenAI'
                        }
                    }]
                }
            };

            mockedAxios.post.mockResolvedValue(mockResponse);

            const prompt = 'Test prompt for ServiceNow incident analysis';
            const result = await snOpenAI.sendPromptToOpenAI(prompt);

            expect(mockedAxios.post).toHaveBeenCalledWith(
                'https://api.openai.com/v1/chat/completions',
                expect.objectContaining({
                    model: 'gpt-3.5-turbo',
                    messages: [{ role: 'user', content: prompt }]
                }),
                expect.objectContaining({
                    headers: {
                        'Authorization': 'Bearer test-api-key',
                        'Content-Type': 'application/json'
                    }
                })
            );

            expect(result).toBe('This is a test response from OpenAI');
        });

        test('should handle API errors gracefully', async () => {
            const mockError = new Error('API request failed');
            mockError.response = {
                status: 401,
                data: { error: { message: 'Invalid API key' } }
            };

            mockedAxios.post.mockRejectedValue(mockError);

            const prompt = 'Test prompt';
            const result = await snOpenAI.sendPromptToOpenAI(prompt);

            expect(result).toContain('Error');
            expect(result).toContain('Invalid API key');
        });

        test('should validate input parameters', async () => {
            const result = await snOpenAI.sendPromptToOpenAI('');
            expect(result).toContain('Error: No prompt provided');
        });

        test('should handle missing API key', async () => {
            delete process.env.OPENAI_API_KEY;
            
            const result = await snOpenAI.sendPromptToOpenAI('test prompt');
            expect(result).toContain('Error: OpenAI API key not configured');
        });
    });

    describe('ServiceNow Integration Functions', () => {
        test('should format incident data for OpenAI analysis', () => {
            const incidentData = {
                number: 'INC0000123',
                short_description: 'Email server down',
                description: 'Users unable to access email',
                priority: '1 - Critical',
                category: 'Software',
                state: '2 - In Progress'
            };

            const formattedPrompt = snOpenAI.formatIncidentForAnalysis(incidentData);
            
            expect(formattedPrompt).toContain('INC0000123');
            expect(formattedPrompt).toContain('Email server down');
            expect(formattedPrompt).toContain('1 - Critical');
            expect(formattedPrompt).toContain('root cause analysis');
            expect(formattedPrompt).toContain('resolution steps');
        });

        test('should generate knowledge article prompt', () => {
            const incidentData = {
                number: 'INC0000123',
                short_description: 'Print queue stuck',
                resolution_notes: 'Restarted print spooler service'
            };

            const knowledgePrompt = snOpenAI.generateKnowledgePrompt(incidentData);
            
            expect(knowledgePrompt).toContain('knowledge article');
            expect(knowledgePrompt).toContain('Print queue stuck');
            expect(knowledgePrompt).toContain('Restarted print spooler service');
        });

        test('should sanitize sensitive data from prompts', () => {
            const sensitiveData = {
                description: 'User password is 123456 and SSN is 555-12-3456',
                user_email: 'john.doe@company.com'
            };

            const sanitizedPrompt = snOpenAI.sanitizePromptData(sensitiveData.description);
            
            expect(sanitizedPrompt).not.toContain('123456');
            expect(sanitizedPrompt).not.toContain('555-12-3456');
            expect(sanitizedPrompt).toContain('[REDACTED]');
        });
    });

    describe('Error Handling', () => {
        test('should handle network timeouts', async () => {
            const timeoutError = new Error('timeout');
            timeoutError.code = 'ECONNABORTED';
            
            mockedAxios.post.mockRejectedValue(timeoutError);
            
            const result = await snOpenAI.sendPromptToOpenAI('test prompt');
            expect(result).toContain('Error');
            expect(result).toContain('timeout');
        });

        test('should handle rate limit errors', async () => {
            const rateLimitError = new Error('Rate limit exceeded');
            rateLimitError.response = {
                status: 429,
                data: { error: { message: 'Rate limit exceeded' } }
            };
            
            mockedAxios.post.mockRejectedValue(rateLimitError);
            
            const result = await snOpenAI.sendPromptToOpenAI('test prompt');
            expect(result).toContain('Rate limit exceeded');
        });
    });
});
