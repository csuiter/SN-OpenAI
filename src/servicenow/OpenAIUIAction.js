// UI Action: Analyze with OpenAI
// Table: Incident
// Action name: openai_analyze
// Show insert: false
// Show update: true
// Client: true
// Form button: true
// List banner button: false

// Client Script
function openaiAnalyze() {
    if (!g_form.getValue('short_description')) {
        alert('Please provide a short description before analyzing with AI.');
        return false;
    }
    
    // Show loading message
    var loadingMsg = 'Analyzing incident with OpenAI...';
    g_form.addInfoMessage(loadingMsg);
    
    // Call server-side action
    var processor = new GlideAjax('OpenAIIntegration');
    processor.addParam('sysparm_name', 'analyzeIncident');
    processor.addParam('sysparm_incident_sys_id', g_form.getUniqueValue());
    
    processor.getXML(function(response) {
        var answer = response.responseXML.documentElement.getAttribute('answer');
        
        if (answer && !answer.startsWith('Error:')) {
            // Add to work notes
            var currentNotes = g_form.getValue('work_notes') || '';
            var timestamp = new Date().toLocaleString();
            var newNotes = currentNotes + 
                '\n\n[' + timestamp + '] AI Analysis:\n' + 
                answer + '\n';
            
            g_form.setValue('work_notes', newNotes);
            g_form.clearMessages();
            g_form.addInfoMessage('AI analysis completed and added to work notes.');
        } else {
            g_form.clearMessages();
            g_form.addErrorMessage('AI analysis failed: ' + (answer || 'Unknown error'));
        }
    });
    
    return false; // Prevent form submission
}
