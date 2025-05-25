# ServiceNow-OpenAI Integration Setup Guide

## Overview
This ServiceNow-OpenAI integration provides seamless AI-powered analysis and content generation capabilities within ServiceNow workflows. The solution includes automated incident analysis, knowledge article generation, and customizable AI prompts for various use cases.

## Prerequisites
- ServiceNow instance (Paris release or later recommended)
- OpenAI API account and API key
- Admin or appropriate role access to ServiceNow

## Installation Steps

### 1. Import Application Components

1. **Import Script Include**
   - Navigate to **System Definition > Script Includes**
   - Create new Script Include named `OpenAIIntegration`
   - Copy content from `OpenAIIntegrationScriptInclude.js`
   - Set as **Client callable: true**
   - Set **Access: public**

2. **Create Custom Table**
   - Import table definition from `OpenAIInteractionTable.xml`
   - Import field definitions from `OpenAIInteractionTableFields.xml`
   - Verify table `x_openai_interaction` is created with fields:
     - prompt (String 8000)
     - response (String 8000)
     - status (Choice: new, in_progress, completed, error)
     - related_record (String 40)

3. **Import Business Rules**
   - Create Business Rule for auto-analysis from `IncidentAutoAnalysisBusinessRule.js`
   - Table: Incident
   - When: after insert, after update
   - Condition: Priority is 1-Critical or 2-High

4. **Import Client Scripts**
   - Create Client Script from `OpenAIClientScript.js`
   - Type: Form
   - Table: Incident
   - Apply to: All views

5. **Import UI Actions**
   - Create UI Action from `OpenAIUIAction.js`
   - Table: Incident
   - Action name: openai_analyze
   - Show on: Update forms only

6. **Create Scheduled Job**
   - Navigate to **System Scheduler > Scheduled Jobs**
   - Create new job using `OpenAIBatchProcessor.js`
   - Schedule: Daily at 2:00 AM

### 2. Configure System Properties

1. **Set OpenAI API Key**
   ```
   Navigate to: System Properties > System Properties
   Create new property:
   - Name: openai.api_key
   - Value: [Your OpenAI API Key]
   - Type: String
   - Description: OpenAI API key for integration
   ```

2. **Configure Auto-Analysis (Optional)**
   ```
   Property: openai.auto_analysis.enabled
   Value: true
   Description: Enable automatic AI analysis for high-priority incidents
   ```

3. **Set Retention Period (Optional)**
   ```
   Property: openai.interaction.retention_days
   Value: 90
   Description: Number of days to retain OpenAI interaction records
   ```

### 3. Configure Security and Access

1. **Create OpenAI Role**
   - Navigate to **User Administration > Roles**
   - Create role: `openai_user`
   - Add required table access:
     - `x_openai_interaction` (read, write)
     - `incident` (read, write for work_notes)

2. **Assign Role to Users**
   - Add `openai_user` role to appropriate users
   - ITIL and admin users should have access by default

3. **Configure Network Access**
   - Ensure ServiceNow instance can reach `https://api.openai.com`
   - Add to **System Web Services > Outbound HTTP Requests** if needed

## Usage Instructions

### Automatic Analysis
- High-priority incidents (Critical/High) will be automatically analyzed when created or updated
- AI analysis appears in work notes within 1-2 minutes
- Disable via system property: `openai.auto_analysis.enabled = false`

### Manual Analysis
1. **From Incident Form:**
   - Click "Analyze with AI" button
   - AI analysis will be added to work notes
   - Use "Generate Knowledge" button for knowledge articles

2. **From Client Script:**
   - Form automatically loads OpenAI integration buttons
   - Available for users with ITIL or admin roles

### Workflow Integration
```javascript
// Example workflow script activity
var openAI = new OpenAIIntegration();
var prompt = "Analyze this incident: " + current.short_description;
var response = openAI.sendPromptToOpenAI(prompt);
current.work_notes = response;
current.update();
```

### Batch Processing
- Scheduled job runs daily to process pending interactions
- Cleans up old interaction records based on retention policy
- Generates usage metrics stored in system properties

## API Usage Examples

### Basic Prompt Execution
```javascript
var openAI = new OpenAIIntegration();
var response = openAI.sendPromptToOpenAI("Explain ServiceNow best practices");
gs.info("AI Response: " + response);
```

### Workflow Activity Usage
```javascript
var workflowActivity = new OpenAIWorkflowActivity();
var analysis = workflowActivity.analyzeIncident(current);
current.work_notes = analysis;
current.update();
```

### AJAX Call from Client
```javascript
var ga = new GlideAjax('OpenAIIntegration');
ga.addParam('sysparm_name', 'analyzeIncident');
ga.addParam('sysparm_incident_sys_id', g_form.getUniqueValue());
ga.getXML(function(response) {
    var answer = response.responseXML.documentElement.getAttribute('answer');
    g_form.setValue('work_notes', answer);
});
```

## Monitoring and Troubleshooting

### System Logs
- Check **System Logs > All** for OpenAI-related errors
- Search for: "OpenAI" or "OpenAIIntegration"

### Interaction Records
- Navigate to **x_openai_interaction.list** to view all AI interactions
- Monitor status field for errors
- Review prompts and responses for debugging

### Common Issues

1. **API Key Errors**
   - Verify `openai.api_key` system property is set
   - Check API key validity in OpenAI dashboard
   - Ensure no extra spaces or characters

2. **Network Connectivity**
   - Test outbound connectivity to `api.openai.com`
   - Check firewall and proxy settings
   - Verify HTTPS is allowed

3. **Rate Limiting**
   - OpenAI APIs have rate limits
   - Batch processor includes delays to prevent limits
   - Consider upgrading OpenAI plan for higher limits

4. **Response Parsing Errors**
   - Check OpenAI response format in interaction records
   - Verify model compatibility (gpt-3.5-turbo recommended)

### Performance Monitoring
- Monitor system properties for usage metrics:
  - `openai.metrics.last_24h.completed`
  - `openai.metrics.last_24h.errors`
  - `openai.metrics.last_24h.total`

## Customization

### Custom Prompts
Modify prompts in the Script Include or Workflow Activity to suit your needs:

```javascript
// Custom incident analysis prompt
var prompt = 'As a ServiceNow expert, analyze this incident and provide:\n' +
    '1. Root cause analysis\n' +
    '2. Resolution steps\n' +
    '3. Prevention measures\n\n' +
    'Incident: ' + current.short_description;
```

### Additional Tables
Extend the integration to other tables by:
1. Creating similar business rules
2. Adding client scripts to forms
3. Modifying the Script Include for table-specific logic

### Custom Fields
Add custom fields to the `x_openai_interaction` table:
- Model used (gpt-3.5-turbo, gpt-4, etc.)
- Token count
- Response time
- User who initiated

## Support and Maintenance

### Regular Maintenance
1. Monitor API usage and costs in OpenAI dashboard
2. Review and cleanup old interaction records
3. Update prompts based on user feedback
4. Monitor error rates and adjust accordingly

### Updates
- Keep OpenAI API integration current with latest models
- Update ServiceNow components as platform evolves
- Test new features in development environment first

### Best Practices
1. **Security**: Never expose API keys in client-side code
2. **Performance**: Use appropriate delays between API calls
3. **Cost Management**: Monitor usage and implement limits if needed
4. **User Training**: Educate users on effective prompt writing
5. **Quality Control**: Review AI responses before using in production

## License and Terms
This integration requires compliance with:
- OpenAI Terms of Service
- ServiceNow licensing terms
- Your organization's data governance policies

Ensure sensitive data is handled appropriately and review AI responses before implementation.
