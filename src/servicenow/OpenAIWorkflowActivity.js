var OpenAIWorkflowActivity = Class.create();
OpenAIWorkflowActivity.prototype = {
    initialize: function() {
    },

    /**
     * Execute OpenAI request workflow activity
     * @param {GlideRecord} current - Current record in workflow
     * @param {string} prompt - The prompt to send to OpenAI
     * @param {string} targetField - Field to store the response (optional)
     * @returns {string} - OpenAI response
     */
    executeOpenAIRequest: function(current, prompt, targetField) {
        try {
            // Create OpenAI interaction record
            var interactionGR = new GlideRecord('x_openai_interaction');
            interactionGR.initialize();
            interactionGR.prompt = prompt;
            interactionGR.status = 'in_progress';
            interactionGR.related_record = current.getUniqueValue();
            var interactionSysId = interactionGR.insert();
            
            // Call OpenAI integration
            var openAI = new OpenAIIntegration();
            var response = openAI.sendPromptToOpenAI(prompt);
            
            // Update interaction record with response
            interactionGR = new GlideRecord('x_openai_interaction');
            if (interactionGR.get(interactionSysId)) {
                interactionGR.response = response;
                
                if (response.startsWith('Error:')) {
                    interactionGR.status = 'error';
                    gs.error('OpenAI Workflow Activity: ' + response);
                } else {
                    interactionGR.status = 'completed';
                    
                    // If target field specified, update the current record
                    if (targetField && current.isValidField(targetField)) {
                        current.setValue(targetField, response);
                        current.update();
                        gs.info('OpenAI response stored in field: ' + targetField);
                    }
                }
                interactionGR.update();
            }
            
            return response;
            
        } catch (ex) {
            gs.error('OpenAI Workflow Activity Error: ' + ex.getMessage());
            return 'Error: Workflow activity failed - ' + ex.getMessage();
        }
    },

    /**
     * Generate contextual prompt based on record data
     * @param {GlideRecord} record - ServiceNow record
     * @param {string} promptTemplate - Template with placeholders
     * @returns {string} - Processed prompt
     */
    generateContextualPrompt: function(record, promptTemplate) {
        var prompt = promptTemplate;
        
        // Replace common placeholders with record values
        var fields = ['number', 'short_description', 'description', 'state', 'priority', 'category'];
        
        fields.forEach(function(field) {
            if (record.isValidField(field)) {
                var placeholder = '${' + field + '}';
                var value = record.getDisplayValue(field) || record.getValue(field) || '';
                prompt = prompt.replace(new RegExp('\\$\\{' + field + '\\}', 'g'), value);
            }
        });
        
        return prompt;
    },

    /**
     * Analyze incident and suggest resolution
     * @param {GlideRecord} incident - Incident record
     * @returns {string} - AI-generated resolution suggestion
     */
    analyzeIncident: function(incident) {
        var promptTemplate = 'Analyze this ServiceNow incident and suggest a resolution:\n\n' +
            'Number: ${number}\n' +
            'Short Description: ${short_description}\n' +
            'Description: ${description}\n' +
            'Priority: ${priority}\n' +
            'Category: ${category}\n\n' +
            'Please provide a structured resolution suggestion including:\n' +
            '1. Root cause analysis\n' +
            '2. Step-by-step resolution steps\n' +
            '3. Prevention measures';
            
        var prompt = this.generateContextualPrompt(incident, promptTemplate);
        return this.executeOpenAIRequest(incident, prompt, 'work_notes');
    },

    /**
     * Generate knowledge article content
     * @param {GlideRecord} record - Source record
     * @param {string} articleType - Type of article to generate
     * @returns {string} - AI-generated content
     */
    generateKnowledgeContent: function(record, articleType) {
        var promptTemplate = 'Create a ServiceNow knowledge article based on this ' + record.getTableName() + ':\n\n' +
            'Title: ${short_description}\n' +
            'Details: ${description}\n\n' +
            'Generate a comprehensive knowledge article including:\n' +
            '1. Problem statement\n' +
            '2. Solution steps\n' +
            '3. Additional notes\n' +
            '4. Related information';
            
        var prompt = this.generateContextualPrompt(record, promptTemplate);
        return this.executeOpenAIRequest(record, prompt);
    },

    type: 'OpenAIWorkflowActivity'
};
