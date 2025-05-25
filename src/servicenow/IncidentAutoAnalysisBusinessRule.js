// Business Rule: Auto-analyze High Priority Incidents
// Table: Incident [incident]
// When: after insert, after update
// Condition: Priority is 1 - Critical or 2 - High

(function executeRule(current, previous) {
    
    // Only process if priority is Critical (1) or High (2)
    if (current.priority != '1' && current.priority != '2') {
        return;
    }
    
    // Only process if this is a new incident or priority just changed to high/critical
    if (previous && previous.priority == current.priority) {
        return;
    }
    
    // Check if OpenAI analysis is enabled via system property
    var enableAutoAnalysis = gs.getProperty('openai.auto_analysis.enabled', 'false');
    if (enableAutoAnalysis !== 'true') {
        return;
    }
    
    try {
        // Create workflow activity instance
        var workflowActivity = new OpenAIWorkflowActivity();
        
        // Generate analysis prompt
        var prompt = 'URGENT: Analyze this high-priority ServiceNow incident and provide immediate guidance:\n\n' +
            'Incident Number: ' + current.number + '\n' +
            'Priority: ' + current.priority.getDisplayValue() + '\n' +
            'Short Description: ' + current.short_description + '\n' +
            'Description: ' + current.description + '\n' +
            'Category: ' + current.category.getDisplayValue() + '\n' +
            'Subcategory: ' + current.subcategory.getDisplayValue() + '\n' +
            'Configuration Item: ' + current.cmdb_ci.getDisplayValue() + '\n\n' +
            'Please provide:\n' +
            '1. Immediate troubleshooting steps\n' +
            '2. Potential root causes\n' +
            '3. Escalation recommendations\n' +
            '4. Similar incident patterns to investigate\n\n' +
            'Format response for ServiceNow work notes.';
        
        // Execute OpenAI analysis asynchronously to avoid blocking
        var worker = new GlideScriptedHierarchicalWorker();
        worker.setProgressName('OpenAI Analysis for ' + current.number);
        worker.setBackground(true);
        worker.start();
        
        // Alternative: Direct execution (may block)
        // workflowActivity.executeOpenAIRequest(current, prompt, 'work_notes');
        
        gs.info('OpenAI analysis initiated for high-priority incident: ' + current.number);
        
    } catch (ex) {
        gs.error('OpenAI Business Rule Error for incident ' + current.number + ': ' + ex.getMessage());
    }
    
})(current, previous);
