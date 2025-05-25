// Client Script: OpenAI Integration Helper
// Type: Form
// Table: Incident [incident]

function onLoad() {
    // Add OpenAI integration button to form
    if (g_user.hasRole('itil') || g_user.hasRole('admin')) {
        addOpenAIButton();
    }
}

function addOpenAIButton() {
    // Create OpenAI analysis button
    var analysisButton = document.createElement('button');
    analysisButton.id = 'openai_analysis_btn';
    analysisButton.className = 'btn btn-primary';
    analysisButton.innerHTML = '<i class="icon-robot"></i> Analyze with AI';
    analysisButton.style.marginLeft = '10px';
    analysisButton.onclick = function() {
        analyzeWithOpenAI();
    };
    
    // Create knowledge generation button
    var knowledgeButton = document.createElement('button');
    knowledgeButton.id = 'openai_knowledge_btn';
    knowledgeButton.className = 'btn btn-secondary';
    knowledgeButton.innerHTML = '<i class="icon-book"></i> Generate Knowledge';
    knowledgeButton.style.marginLeft = '10px';
    knowledgeButton.onclick = function() {
        generateKnowledge();
    };
    
    // Add buttons to form header
    var formHeader = document.querySelector('.form-header') || document.querySelector('#form_header');
    if (formHeader) {
        formHeader.appendChild(analysisButton);
        formHeader.appendChild(knowledgeButton);
    }
}

function analyzeWithOpenAI() {
    // Disable button and show loading
    var button = document.getElementById('openai_analysis_btn');
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="icon-loading"></i> Analyzing...';
    }
    
    // Gather incident data
    var incidentData = {
        number: g_form.getValue('number'),
        short_description: g_form.getValue('short_description'),
        description: g_form.getValue('description'),
        priority: g_form.getDisplayValue('priority'),
        category: g_form.getDisplayValue('category'),
        subcategory: g_form.getDisplayValue('subcategory'),
        state: g_form.getDisplayValue('state')
    };
    
    // Call server-side function via AJAX
    var ga = new GlideAjax('OpenAIIntegration');
    ga.addParam('sysparm_name', 'analyzeIncident');
    ga.addParam('sysparm_incident_sys_id', g_form.getUniqueValue());
    ga.addParam('sysparm_incident_data', JSON.stringify(incidentData));
    
    ga.getXML(function(response) {
        var answer = response.responseXML.documentElement.getAttribute('answer');
        
        // Re-enable button
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="icon-robot"></i> Analyze with AI';
        }
        
        if (answer && !answer.startsWith('Error:')) {
            // Add analysis to work notes
            var currentWorkNotes = g_form.getValue('work_notes') || '';
            var newWorkNotes = currentWorkNotes + 
                '\n\n=== AI Analysis ===\n' + 
                answer + 
                '\n=== End AI Analysis ===\n';
            
            g_form.setValue('work_notes', newWorkNotes);
            g_form.flash('work_notes', '#90EE90', 1000); // Flash green
            
            // Show success message
            g_form.addInfoMessage('AI analysis completed and added to work notes.');
        } else {
            // Show error message
            g_form.addErrorMessage('AI analysis failed: ' + (answer || 'Unknown error'));
        }
    });
}

function generateKnowledge() {
    // Show confirmation dialog
    if (!confirm('Generate a knowledge article based on this incident?')) {
        return;
    }
    
    var button = document.getElementById('openai_knowledge_btn');
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="icon-loading"></i> Generating...';
    }
    
    // Call server-side function
    var ga = new GlideAjax('OpenAIIntegration');
    ga.addParam('sysparm_name', 'generateKnowledge');
    ga.addParam('sysparm_incident_sys_id', g_form.getUniqueValue());
    
    ga.getXML(function(response) {
        var answer = response.responseXML.documentElement.getAttribute('answer');
        
        // Re-enable button
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="icon-book"></i> Generate Knowledge';
        }
        
        if (answer && !answer.startsWith('Error:')) {
            // Open new knowledge article with generated content
            var url = '/kb_knowledge.do?sys_id=-1&sysparm_query=GOTOnull' +
                '&sysparm_stack=kb_knowledge_list.do' +
                '&sysparm_view=&sysparm_view_forced=true';
            
            // Store generated content in session to populate new article
            sessionStorage.setItem('openai_generated_content', answer);
            sessionStorage.setItem('openai_source_incident', g_form.getUniqueValue());
            
            window.open(url, '_blank');
            g_form.addInfoMessage('Knowledge article template generated. Opening new article...');
        } else {
            g_form.addErrorMessage('Knowledge generation failed: ' + (answer || 'Unknown error'));
        }
    });
}

// Function to populate knowledge article from session storage
function populateKnowledgeFromSession() {
    if (g_form.getTableName() === 'kb_knowledge') {
        var generatedContent = sessionStorage.getItem('openai_generated_content');
        var sourceIncident = sessionStorage.getItem('openai_source_incident');
        
        if (generatedContent) {
            g_form.setValue('text', generatedContent);
            
            if (sourceIncident) {
                // Set category or other fields based on source incident
                g_form.setValue('source', 'Generated from incident: ' + sourceIncident);
            }
            
            // Clear session storage
            sessionStorage.removeItem('openai_generated_content');
            sessionStorage.removeItem('openai_source_incident');
        }
    }
}
