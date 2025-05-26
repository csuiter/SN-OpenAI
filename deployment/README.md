# ServiceNow-OpenAI Integration - Easy Deployment

This directory contains automated deployment tools to make installing the ServiceNow-OpenAI integration as simple as possible.

## 🚀 Quick Start (5 Minutes)

### Option 1: Interactive Deployment
```bash
node deployment/deploy.js
```
Guides you through the entire deployment process with interactive prompts.

### Option 2: Quick Deploy CLI
```bash
node deployment/quick-deploy.js --instance=https://your-instance.service-now.com
```
Generates a quick deployment guide with direct links to your ServiceNow instance.

### Option 3: Generate Custom Scripts
```bash
node deployment/config-generator.js --apiKey=sk-your-key --usernames=admin,john.doe
```
Creates customized deployment scripts based on your requirements.

## 📁 Deployment Tools

| Tool | Purpose | Usage |
|------|---------|-------|
| `deploy.js` | Interactive full deployment | `node deployment/deploy.js` |
| `quick-deploy.js` | Quick deployment guide | `node deployment/quick-deploy.js --instance=<url>` |
| `config-generator.js` | Custom script generator | `node deployment/config-generator.js [options]` |

## 📋 Manual Deployment Steps

If you prefer manual deployment:

### 1. Import Update Set
1. Go to **System Update Sets > Retrieved Update Sets**
2. Click **Import Update Set from XML**
3. Upload: `src/servicenow/ServiceNowOpenAIUpdateSet.xml`
4. Preview and commit the update set

### 2. Configure API Key
1. Go to **Scripts - Background**
2. Run this script (replace YOUR_API_KEY):
```javascript
var prop = new GlideRecord('sys_properties');
prop.addQuery('name', 'openai.api_key');
prop.query();
if (prop.next()) {
    prop.setValue('value', 'YOUR_API_KEY');
    prop.update();
} else {
    prop.initialize();
    prop.setValue('name', 'openai.api_key');
    prop.setValue('value', 'YOUR_API_KEY');
    prop.insert();
}
gs.info('OpenAI API key configured');
```

### 3. Validate Deployment
1. Go to **Scripts - Background**
2. Copy and run: `deployment/validation/comprehensive-validator.js`
3. Verify all checks pass

### 4. Test Integration
1. Create or open an incident
2. Click **"Analyze with OpenAI"** button
3. Check results in **OpenAI Interactions** table

## 🛠️ Available Scripts

### Template Scripts
- `templates/update-set-installer.js` - Automated update set import
- `validation/comprehensive-validator.js` - Complete deployment validation

### Generated Scripts (Created by tools)
- `scripts/generated/systemProperties.js` - System properties configuration
- `scripts/generated/userRoles.js` - User role assignments
- `scripts/generated/autoAnalysis.js` - Auto-analysis configuration
- `scripts/generated/customFields.js` - Optional custom fields

## 🔧 Configuration Options

### Config Generator Options
```bash
# Basic configuration
node deployment/config-generator.js --apiKey=sk-your-key

# Full configuration
node deployment/config-generator.js \
  --apiKey=sk-your-key \
  --usernames=admin,john.doe,jane.smith \
  --autoAnalysis=true \
  --timeout=45 \
  --maxRetries=5 \
  --model=gpt-4 \
  --customFields=true
```

### Available Parameters
- `--apiKey` - Your OpenAI API key (required)
- `--usernames` - Comma-separated list of usernames to grant access
- `--autoAnalysis` - Enable automatic incident analysis (true/false)
- `--timeout` - API timeout in seconds (default: 30)
- `--maxRetries` - Maximum retry attempts (default: 3)
- `--model` - OpenAI model to use (default: gpt-3.5-turbo)
- `--customFields` - Add enhanced custom fields (true/false)

## ✅ Validation and Testing

### Run Comprehensive Validation
```bash
# In ServiceNow Scripts - Background
// Copy and paste: deployment/validation/comprehensive-validator.js
```

The validator checks:
- ✅ System properties configuration
- ✅ Database tables and fields
- ✅ Script components (includes, business rules, UI actions)
- ✅ User roles and permissions
- ✅ Network connectivity to OpenAI
- ✅ Functional testing

### Expected Results
- **Total Checks:** 15-20 validations
- **Success Rate:** Should be 100% for complete deployment
- **Warnings:** Optional components may show warnings (acceptable)

## 🔗 Quick ServiceNow Links

Replace `YOUR_INSTANCE` with your ServiceNow instance URL:

| Component | Direct Link |
|-----------|-------------|
| Update Sets | `YOUR_INSTANCE/nav_to.do?uri=sys_remote_update_set_list.do` |
| Scripts - Background | `YOUR_INSTANCE/nav_to.do?uri=sys_script_background.do` |
| System Properties | `YOUR_INSTANCE/nav_to.do?uri=sys_properties_list.do` |
| User Administration | `YOUR_INSTANCE/nav_to.do?uri=sys_user_list.do` |
| Incidents | `YOUR_INSTANCE/nav_to.do?uri=incident_list.do` |
| OpenAI Interactions | `YOUR_INSTANCE/nav_to.do?uri=x_openai_interactions_list.do` |

## 🆘 Troubleshooting

### Common Issues

#### Update Set Import Fails
- **Cause:** Permissions or conflicts
- **Solution:** Ensure you have `admin` or `import_admin` role
- **Check:** Review import logs for specific errors

#### API Key Validation Fails
- **Cause:** Invalid or expired API key
- **Solution:** Verify key starts with `sk-` and test at https://platform.openai.com
- **Check:** System Properties > `openai.api_key`

#### Network Connectivity Issues
- **Cause:** Firewall blocking api.openai.com
- **Solution:** Configure network access to OpenAI endpoints
- **Check:** Test with: `curl https://api.openai.com/v1/models`

#### UI Button Not Visible
- **Cause:** Missing user role assignment
- **Solution:** Assign `openai_user` role to users
- **Check:** User Administration > Users > [Username] > Roles

#### Analysis Not Working
- **Cause:** Business rule inactive or configuration error
- **Solution:** Check business rule is active and API key is valid
- **Check:** Run validation script for detailed diagnostics

### Getting Help

1. **Run Validation Script:** Most issues are identified automatically
2. **Check System Logs:** System Logs > All logs for detailed errors
3. **Review Documentation:** Main README.md and SETUP_GUIDE.md
4. **Test Components:** Use Scripts - Background to test individual functions

## 🚦 Deployment Checklist

- [ ] ServiceNow instance accessible with admin rights
- [ ] OpenAI API key ready and valid
- [ ] Network access to api.openai.com confirmed
- [ ] Update set imported and committed successfully
- [ ] System properties configured
- [ ] User roles assigned
- [ ] Validation script passes all checks
- [ ] Functional test completed (incident analysis)
- [ ] End user training planned

## 📞 Support

- **Documentation:** [Main README](../README.md) | [Setup Guide](../SETUP_GUIDE.md)
- **Issues:** Check validation output for specific guidance
- **Testing:** Use the comprehensive validation script
- **Updates:** Monitor project repository for updates

---

**🎉 Ready to deploy?** Start with: `node deployment/deploy.js`
