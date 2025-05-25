var OpenAIIntegration = Class.create();
OpenAIIntegration.prototype = Object.extendsObject(global.AbstractAjaxProcessor, {
    /**
     * Sends a prompt to OpenAI and returns the response.
     * This function is intended to be called from a ServiceNow server-side script, like a workflow.
     *
     * @param {string} prompt - The prompt to send to OpenAI.
     * @returns {string} - The response text from OpenAI, or an error message.
     */
    sendPromptToOpenAI: function(prompt) {
        var apiKey = gs.getProperty('openai.api_key'); // Store your API key as a system property
        if (!apiKey) {
            gs.error('OpenAI API key not found. Please set the system property "openai.api_key".');
            return 'Error: OpenAI API key not configured in ServiceNow.';
        }

        if (!prompt) {
            gs.warn('OpenAIIntegration: No prompt provided.');
            return 'Error: No prompt provided.';
        }

        try {
            var request = new sn_ws.RESTMessageV2();
            request.setEndpoint('https://api.openai.com/v1/chat/completions');
            request.setHttpMethod('POST');
            request.setRequestHeader('Authorization', 'Bearer ' + apiKey);
            request.setRequestHeader('Content-Type', 'application/json');

            var requestBody = {
                model: 'gpt-3.5-turbo', // Or your preferred model
                messages: [{ role: 'user', content: prompt }]
            };
            request.setRequestBody(JSON.stringify(requestBody));

            var response = request.execute();
            var httpResponseStatus = response.getStatusCode();
            var responseBody = response.getBody();

            if (httpResponseStatus === 200) {
                var parsedResponseBody = JSON.parse(responseBody);
                if (parsedResponseBody.choices && parsedResponseBody.choices.length > 0 && parsedResponseBody.choices[0].message) {
                    return parsedResponseBody.choices[0].message.content;
                } else {
                    gs.error('OpenAIIntegration: Unexpected response structure: ' + responseBody);
                    return 'Error: Could not parse OpenAI response.';
                }
            } else {
                gs.error('OpenAIIntegration: OpenAI API request failed with status ' + httpResponseStatus + ': ' + responseBody);
                return 'Error: OpenAI API request failed. Status: ' + httpResponseStatus;
            }
        } catch (ex) {
            gs.error('OpenAIIntegration: Exception during OpenAI API call: ' + ex.getMessage());
            return 'Error: Exception occurred while contacting OpenAI - ' + ex.getMessage();
        }
    },

    /**
     * AJAX function to analyze an incident
     * Called from client-side scripts
     */
    analyzeIncident: function() {
        var incidentSysId = this.getParameter('sysparm_incident_sys_id');
        var incidentData = this.getParameter('sysparm_incident_data');
        
        if (!incidentSysId) {
            return 'Error: No incident specified';
        }
        
        try {
            var incident = new GlideRecord('incident');
            if (!incident.get(incidentSysId)) {
                return 'Error: Incident not found';
            }
            
            // Create analysis prompt
            var prompt = 'Analyze this ServiceNow incident and provide detailed guidance:\n\n' +
                'Incident: ' + incident.number + '\n' +
                'Priority: ' + incident.priority.getDisplayValue() + '\n' +
                'State: ' + incident.state.getDisplayValue() + '\n' +
                'Short Description: ' + incident.short_description + '\n' +
                'Description: ' + incident.description + '\n' +
                'Category: ' + incident.category.getDisplayValue() + '\n' +
                'Assignment Group: ' + incident.assignment_group.getDisplayValue() + '\n\n' +
                'Please provide:\n' +
                '1. Root cause analysis\n' +
                '2. Detailed resolution steps\n' +
                '3. Similar incidents to check\n' +
                '4. Prevention recommendations\n\n' +
                'Format for ServiceNow work notes.';
            
            var response = this.sendPromptToOpenAI(prompt);
            
            // Log the interaction
            var interactionGR = new GlideRecord('x_openai_interaction');
            interactionGR.initialize();
            interactionGR.prompt = prompt;
            interactionGR.response = response;
            interactionGR.related_record = incidentSysId;
            interactionGR.status = response.startsWith('Error:') ? 'error' : 'completed';
            interactionGR.insert();
            
            return response;
            
        } catch (ex) {
            gs.error('OpenAI analyzeIncident error: ' + ex.getMessage());
            return 'Error: ' + ex.getMessage();
        }
    },

    /**
     * AJAX function to generate knowledge article content
     */
    generateKnowledge: function() {
        var incidentSysId = this.getParameter('sysparm_incident_sys_id');
        
        if (!incidentSysId) {
            return 'Error: No incident specified';
        }
        
        try {
            var incident = new GlideRecord('incident');
            if (!incident.get(incidentSysId)) {
                return 'Error: Incident not found';
            }
            
            // Create knowledge generation prompt
            var prompt = 'Create a comprehensive ServiceNow knowledge article based on this resolved incident:\n\n' +
                'Incident: ' + incident.number + '\n' +
                'Title: ' + incident.short_description + '\n' +
                'Problem Description: ' + incident.description + '\n' +
                'Resolution: ' + incident.close_notes + '\n' +
                'Category: ' + incident.category.getDisplayValue() + '\n\n' +
                'Generate a knowledge article with:\n' +
                '1. Clear problem statement\n' +
                '2. Symptoms and indicators\n' +
                '3. Step-by-step solution\n' +
                '4. Root cause explanation\n' +
                '5. Prevention measures\n' +
                '6. Related information and links\n\n' +
                'Use clear headings and professional formatting suitable for end users.';
            
            var response = this.sendPromptToOpenAI(prompt);
            
            // Log the interaction
            var interactionGR = new GlideRecord('x_openai_interaction');
            interactionGR.initialize();
            interactionGR.prompt = prompt;
            interactionGR.response = response;
            interactionGR.related_record = incidentSysId;
            interactionGR.status = response.startsWith('Error:') ? 'error' : 'completed';
            interactionGR.insert();
            
            return response;
            
        } catch (ex) {
            gs.error('OpenAI generateKnowledge error: ' + ex.getMessage());
            return 'Error: ' + ex.getMessage();
        }
    },

    /**
     * Generic OpenAI prompt execution for workflows
     * @param {string} prompt - The prompt to send
     * @param {string} relatedRecord - SysId of related record
     * @returns {string} - OpenAI response
     */
    executeWorkflowPrompt: function(prompt, relatedRecord) {
        try {
            var response = this.sendPromptToOpenAI(prompt);
            
            // Log the interaction
            var interactionGR = new GlideRecord('x_openai_interaction');
            interactionGR.initialize();
            interactionGR.prompt = prompt;
            interactionGR.response = response;
            interactionGR.related_record = relatedRecord || '';
            interactionGR.status = response.startsWith('Error:') ? 'error' : 'completed';
            interactionGR.insert();
            
            return response;
            
        } catch (ex) {
            gs.error('OpenAI executeWorkflowPrompt error: ' + ex.getMessage());
            return 'Error: ' + ex.getMessage();
        }
    },

    type: 'OpenAIIntegration'
});
