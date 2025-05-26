# ServiceNow IDE Git Integration Guide

This guide shows how to install the ServiceNow-OpenAI integration using ServiceNow Studio (IDE) with direct git repository access.

## Option 1: Complete Update Set XML Installation

### Quick Installation Steps:
1. **Download the Update Set**: Get `ServiceNow-OpenAI-Complete-UpdateSet.xml` from the deployment folder
2. **Import to ServiceNow**:
   - Navigate to **System Update Sets > Retrieved Update Sets**
   - Click **Import Update Set from XML**
   - Upload the `ServiceNow-OpenAI-Complete-UpdateSet.xml` file
   - Click **Upload**
3. **Preview and Commit**:
   - Click **Preview Update Set**
   - Review the components (should show ~15+ items)
   - Click **Commit Update Set**
4. **Configure**:
   - Go to **System Properties > System**
   - Set `openai.api_key` to your OpenAI API key
   - Set `openai.auto_analysis.enabled` to `true` (optional)

## Option 2: ServiceNow Studio Git Integration

### Prerequisites:
- ServiceNow Paris release or later
- Admin access to your ServiceNow instance
- Git repository access credentials

### Step 1: Create Application in Studio
1. **Open ServiceNow Studio**:
   - Navigate to **System Applications > Studio**
   - Click **Create Application**

2. **Application Settings**:
   - **Name**: `ServiceNow OpenAI Integration`
   - **Scope**: `x_openai_integration` (or your preferred scope)
   - **Version**: `1.0.0`
   - **Source Control**: Select **Import from Source Control**

### Step 2: Connect Git Repository
1. **Repository Configuration**:
   - **URL**: `https://github.com/csuiter/SN-OpenAI.git`
   - **Branch**: `main`
   - **Credentials**: Your GitHub credentials
   - **Path**: `/src/servicenow/` (to import only ServiceNow components)

2. **Import Components**:
   - Studio will scan and import all ServiceNow components
   - Components imported:
     - Script Include: `OpenAIIntegration`
     - Business Rule: `OpenAI Auto Analysis`
     - UI Action: `Analyze with AI`
     - Table: `x_openai_interaction`
     - System Properties
     - User Role: `openai_user`

### Step 3: Manual Component Creation
If automatic import doesn't work, create components manually:

#### A. Create Custom Table
```javascript
// Navigate to: System Definition > Tables
// Create new table: x_openai_interaction
// Add fields:
- prompt (String, 4000)
- response (String, 8000) 
- related_record (String, 32)
- status (Choice: pending, completed, error)
```

#### B. Create Script Include
```javascript
// Navigate to: System Definition > Script Includes
// Name: OpenAIIntegration
// Copy content from: src/servicenow/OpenAIIntegrationScriptInclude.js
```

#### C. Create Business Rule
```javascript
// Navigate to: System Definition > Business Rules
// Table: incident
// When: after insert, after update
// Condition: priority=1^ORpriority=2
// Copy content from: src/servicenow/IncidentAutoAnalysisBusinessRule.js
```

#### D. Create UI Action
```javascript
// Navigate to: System UI > UI Actions
// Table: incident
// Name: Analyze with AI
// Copy content from: src/servicenow/OpenAIUIAction.js
```

### Step 4: Configure System Properties
1. **Navigate to**: System Properties > System
2. **Create Properties**:
   ```
   Name: openai.api_key
   Type: String
   Category: OpenAI Integration
   Description: OpenAI API key for integration
   Value: [YOUR_OPENAI_API_KEY]
   
   Name: openai.auto_analysis.enabled
   Type: True/False
   Category: OpenAI Integration  
   Description: Enable automatic analysis for high priority incidents
   Value: false (set to true to enable auto-analysis)
   ```

### Step 5: Set Up User Roles
1. **Navigate to**: User Administration > Roles
2. **Create Role**: `openai_user`
3. **Assign to Users**: Add role to users who should access OpenAI features

## Option 3: Manual File-by-File Import

If you prefer to manually import each component:

### Import Order:
1. **Table Definition**: Import `OpenAIInteractionTable.xml`
2. **Table Fields**: Import `OpenAIInteractionTableFields.xml`  
3. **Script Include**: Create from `OpenAIIntegrationScriptInclude.js`
4. **Business Rule**: Create from `IncidentAutoAnalysisBusinessRule.js`
5. **UI Action**: Create from `OpenAIUIAction.js`
6. **Client Script**: Create from `OpenAIClientScript.js`
7. **Workflow Activity**: Create from `OpenAIWorkflowActivity.js`
8. **Batch Processor**: Create from `OpenAIBatchProcessor.js`

### Component Locations:
```
src/servicenow/
├── OpenAIIntegrationScriptInclude.js     → Script Include
├── IncidentAutoAnalysisBusinessRule.js   → Business Rule  
├── OpenAIUIAction.js                     → UI Action
├── OpenAIClientScript.js                 → Client Script
├── OpenAIWorkflowActivity.js             → Workflow Activity
├── OpenAIBatchProcessor.js               → Scheduled Job
├── OpenAIInteractionTable.xml            → Table Definition
└── OpenAIInteractionTableFields.xml      → Field Definitions
```

## Post-Installation Testing

### Test the Installation:
1. **Create Test Incident**:
   - Navigate to **Incident > Create New**
   - Set Priority to "1 - Critical" or "2 - High"
   - Add short description and description
   - Save the incident

2. **Test Manual Analysis**:
   - Open the incident
   - Click **Analyze with AI** button
   - Check work notes for AI analysis

3. **Test Auto-Analysis** (if enabled):
   - Create another high-priority incident
   - Check if AI analysis is automatically added to work notes

### Verification Checklist:
- [ ] Custom table `x_openai_interaction` exists
- [ ] Script Include `OpenAIIntegration` is active
- [ ] Business Rule `OpenAI Auto Analysis` is active
- [ ] UI Action `Analyze with AI` appears on incident forms
- [ ] System property `openai.api_key` is configured
- [ ] Role `openai_user` exists and is assigned to users
- [ ] Test incident gets analyzed successfully

## Troubleshooting

### Common Issues:
1. **API Key Not Found**: Set `openai.api_key` system property
2. **No Analysis Button**: Check user has `openai_user` role
3. **Auto-Analysis Not Working**: Set `openai.auto_analysis.enabled` to `true`
4. **Network Errors**: Ensure ServiceNow can reach `api.openai.com`

### Debug Steps:
1. Check **System Logs > System Log > All** for OpenAI errors
2. Verify **System Properties** are set correctly
3. Test **Script Include** in **Scripts - Background**:
   ```javascript
   var openai = new OpenAIIntegration();
   var response = openai.sendPromptToOpenAI('Test prompt');
   gs.info('Response: ' + response);
   ```

## Support and Documentation

- **Full Documentation**: See `SETUP_GUIDE.md` in repository root
- **Deployment Tools**: Use scripts in `/deployment/` folder for automated setup
- **GitHub Repository**: https://github.com/csuiter/SN-OpenAI
- **Issues**: Report problems on GitHub Issues

---

**Note**: The complete XML update set (`ServiceNow-OpenAI-Complete-UpdateSet.xml`) is the recommended installation method as it includes all components pre-configured and ready to use.
