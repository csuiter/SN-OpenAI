# ServiceNow-OpenAI Integration

A comprehensive ServiceNow application that integrates OpenAI's GPT models to provide intelligent automation, analysis, and content generation capabilities within ServiceNow workflows.

## 🚀 Features

### Automated Intelligence
- **Auto-Analysis**: Automatically analyze high-priority incidents with AI
- **Smart Suggestions**: Generate resolution recommendations based on incident details
- **Knowledge Creation**: Auto-generate knowledge articles from resolved incidents
- **Workflow Integration**: Seamlessly integrate AI into ServiceNow workflows

### User Interface Components
- **Form Buttons**: One-click AI analysis directly from incident forms
- **Client Scripts**: Interactive AI integration with real-time feedback
- **UI Actions**: Custom actions for various AI-powered operations
- **Responsive Design**: Modern UI components that integrate with ServiceNow themes

### Data Management
- **Interaction Tracking**: Complete audit trail of all AI interactions
- **Batch Processing**: Scheduled jobs for processing and cleanup
- **Error Handling**: Comprehensive error logging and recovery
- **Performance Monitoring**: Built-in metrics and usage tracking

## 📁 Project Structure

```
src/
├── snOpenAI.js                                    # Node.js OpenAI integration module
└── servicenow/
    ├── OpenAIIntegrationScriptInclude.js         # Core ServiceNow-OpenAI integration
    ├── OpenAIWorkflowActivity.js                 # Workflow activity helpers
    ├── IncidentAutoAnalysisBusinessRule.js       # Auto-analysis business rule
    ├── OpenAIClientScript.js                     # Client-side integration scripts
    ├── OpenAIUIAction.js                         # UI action for manual analysis
    ├── OpenAIBatchProcessor.js                   # Scheduled job for batch processing
    ├── OpenAIInteractionTable.xml               # Custom table definition
    └── OpenAIInteractionTableFields.xml         # Table field definitions

tests/
└── snOpenAI.test.js                             # Test cases

docs/
├── SETUP_GUIDE.md                               # Detailed setup instructions
└── README.md                                    # This file
```

## 🛠️ Installation

### 🚀 Easy Deployment (Recommended)

**Option 1: Complete XML Update Set** (Recommended)
```bash
git clone https://github.com/your-org/SN-OpenAI.git
cd SN-OpenAI
npm install
npm run deploy:install  # Direct installation via REST API
```
Or manually import: `deployment/ServiceNow-OpenAI-Complete-UpdateSet.xml`

**Option 2: Interactive Deployment Wizard**
```bash
npm run deploy  # Guided setup with validation
```

**Option 3: ServiceNow Studio/IDE Integration**
```bash
# Clone repo directly in ServiceNow Studio
# Follow: deployment/ServiceNow-Studio-Installation-Guide.md
```

**Option 4: Quick Deployment CLI**
```bash
npm run deploy:quick -- --instance=https://your-instance.service-now.com
```

**Option 5: One-Line Shell Script**
```bash
./deployment/deploy.sh interactive
# or
./deployment/deploy.sh quick https://your-instance.service-now.com
```

The deployment tools will:
- ✅ Install complete update set with all components
- ✅ Validate your ServiceNow connection
- ✅ Test your OpenAI API key
- ✅ Generate customized deployment scripts
- ✅ Provide step-by-step instructions with direct links
- ✅ Create validation scripts for post-deployment testing

### 📋 Manual Installation

If you prefer manual setup:

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/SN-OpenAI.git
   cd SN-OpenAI
   ```

2. **Import ServiceNow Update Set**
   - Go to **System Update Sets > Retrieved Update Sets**
   - Import: `src/servicenow/ServiceNowOpenAIUpdateSet.xml`
   - Preview and commit the update set

3. **Configure API Key**
   - In ServiceNow Scripts - Background, run:
   ```javascript
   var prop = new GlideRecord('sys_properties');
   prop.addQuery('name', 'openai.api_key');
   prop.query();
   if (prop.next()) {
       prop.setValue('value', 'YOUR_OPENAI_API_KEY');
       prop.update();
   } else {
       prop.initialize();
       prop.setValue('name', 'openai.api_key');
       prop.setValue('value', 'YOUR_OPENAI_API_KEY');
       prop.insert();
   }
   ```

4. **Validate Deployment**
   - Run the validation script: `deployment/validation/comprehensive-validator.js`

For detailed manual setup instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md).

### Prerequisites
- ServiceNow instance (Paris release or later)
- OpenAI API account with valid API key
- Admin access to ServiceNow instance
- Network connectivity to `https://api.openai.com`
- Node.js 14+ (for deployment tools)

## 🔧 Configuration

### Automated Configuration
Use the config generator for customized setup:
```bash
npm run deploy:config -- --apiKey=sk-your-key --usernames=admin,john.doe --autoAnalysis=true
```

### System Properties
```javascript
// Required
openai.api_key = "your-openai-api-key-here"

// Optional
openai.auto_analysis.enabled = "true"
openai.interaction.retention_days = "90"
openai.default_model = "gpt-3.5-turbo"
```

### Security Setup
1. Create role: `openai_user`
2. Grant access to `x_openai_interaction` table
3. Assign role to appropriate users
4. Configure outbound network access

## 💻 Usage Examples

### Automatic Incident Analysis
```javascript
// Business rule automatically triggers for high-priority incidents
// No manual intervention required
```

### Manual Analysis from Form
```javascript
// Click "Analyze with AI" button on incident form
// AI analysis appears in work notes automatically
```

### Workflow Integration
```javascript
// In workflow script activity
var openAI = new OpenAIIntegration();
var prompt = "Analyze incident: " + current.short_description;
var response = openAI.sendPromptToOpenAI(prompt);
current.work_notes = response;
current.update();
```

### Custom Prompt Execution
```javascript
// Custom analysis with specific prompt
var workflowActivity = new OpenAIWorkflowActivity();
var customPrompt = "Provide detailed troubleshooting steps for: " + issue;
var result = workflowActivity.executeOpenAIRequest(current, customPrompt, 'resolution_notes');
```

### AJAX Call from Client Side
```javascript
var ga = new GlideAjax('OpenAIIntegration');
ga.addParam('sysparm_name', 'analyzeIncident');
ga.addParam('sysparm_incident_sys_id', incidentId);
ga.getXML(function(response) {
    var analysis = response.responseXML.documentElement.getAttribute('answer');
    // Process the AI response
});
```

## 🔍 Key Components

### Script Include: OpenAIIntegration
Core integration class that handles:
- API communication with OpenAI
- Error handling and logging
- Response processing and validation
- AJAX methods for client-side calls

### Workflow Activity: OpenAIWorkflowActivity
Workflow-specific functionality:
- Contextual prompt generation
- Incident analysis automation
- Knowledge article creation
- Record field updates

### Business Rule: Auto-Analysis
Automated processing:
- Triggers on high-priority incidents
- Background processing to avoid blocking
- Configurable via system properties
- Comprehensive error handling

### Client Script: Interactive UI
User interface enhancements:
- Dynamic button creation
- Real-time feedback
- Form integration
- Session state management

## 📊 Monitoring and Analytics

### Interaction Tracking
- All AI interactions logged in `x_openai_interaction` table
- Status tracking (new, in_progress, completed, error)
- Prompt and response storage
- Related record associations

### Usage Metrics
- 24-hour processing statistics
- Error rate monitoring
- Performance tracking
- Cost analysis data

### Scheduled Maintenance
- Daily batch processing job
- Automatic cleanup of old records
- Error retry mechanisms
- Usage reporting

## 🔒 Security Considerations

### API Key Management
- Store API key in encrypted system property
- Never expose in client-side code
- Regular key rotation recommended
- Monitor API usage in OpenAI dashboard

### Data Privacy
- Review AI prompts for sensitive data
- Implement data sanitization if needed
- Comply with organizational data policies
- Consider data residency requirements

### Access Control
- Role-based access to AI features
- Audit trail for all interactions
- Network security for API calls
- Regular security reviews

## 🚦 Error Handling

### Common Error Scenarios
1. **API Key Issues**: Invalid or missing API key
2. **Network Problems**: Connectivity to OpenAI services
3. **Rate Limiting**: API request quotas exceeded
4. **Response Parsing**: Malformed API responses
5. **ServiceNow Errors**: Platform-specific issues

### Error Resolution
- Comprehensive logging in ServiceNow logs
- User-friendly error messages
- Automatic retry mechanisms
- Fallback procedures

## 🧪 Testing

### Unit Tests
```bash
# Run Node.js tests
npm test
```

### Integration Testing
1. Test API connectivity
2. Verify prompt processing
3. Check response handling
4. Validate error scenarios
5. Test workflow integration

### User Acceptance Testing
1. Manual incident analysis
2. Automated analysis triggers
3. Knowledge article generation
4. UI component functionality

## 📈 Performance Optimization

### API Efficiency
- Batch processing for multiple requests
- Intelligent rate limiting
- Response caching where appropriate
- Model selection optimization

### ServiceNow Performance
- Asynchronous processing for heavy operations
- Proper indexing on custom tables
- Efficient GlideRecord queries
- Memory management best practices

## 🔄 Continuous Improvement

### Prompt Engineering
- Regular review and optimization of prompts
- A/B testing for different prompt variations
- User feedback integration
- Domain-specific customizations

### Model Updates
- Stay current with OpenAI model releases
- Evaluate new model capabilities
- Update integration for enhanced features
- Performance comparison testing

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request
5. Code review and merge

### Coding Standards
- Follow ServiceNow development best practices
- Use proper error handling
- Include comprehensive comments
- Write unit tests for new features

## 📞 Support

### Documentation
- [Setup Guide](SETUP_GUIDE.md) - Detailed installation instructions
- [API Reference](docs/API.md) - Complete API documentation
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

### Community
- GitHub Issues for bug reports
- Feature requests via GitHub
- Community discussions
- Regular updates and releases

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for providing powerful AI capabilities
- ServiceNow community for best practices and guidance
- Contributors and testers who helped improve this integration

## 📋 Changelog

### v1.0.0 (Current)
- Initial release with core functionality
- Incident analysis automation
- Knowledge article generation
- Comprehensive ServiceNow integration
- Full documentation and setup guides

### Planned Features
- Multi-language support
- Advanced prompt templates
- Integration with additional ServiceNow modules
- Enhanced analytics and reporting
- Mobile app support

---

**Ready to revolutionize your ServiceNow experience with AI?** Start with our [Setup Guide](SETUP_GUIDE.md) and transform your IT service management today!
   npm install
   ```
2. Run tests:
   ```zsh
   npx jest
   ```

## Project Structure
- `src/snOpenAI.js` — Main integration logic
- `tests/snOpenAI.test.js` — Jest tests
- `.github/copilot-instructions.md` — Copilot instructions

---
*Created: May 24, 2025*
