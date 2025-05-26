# Generated Deployment Scripts

These scripts have been automatically generated for your ServiceNow-OpenAI integration deployment.

## Execution Order

Run these scripts in ServiceNow Scripts - Background in the following order:

### 1. System Properties Setup
**File:** systemProperties.js
**Purpose:** Configures all required system properties including API key
**Requirements:** System Administrator role

```javascript
// Copy and paste the content of systemProperties.js
```

### 2. User Roles Configuration  
**File:** userRoles.js
**Purpose:** Creates roles and assigns them to specified users
**Requirements:** User Administrator role

```javascript
// Copy and paste the content of userRoles.js
```

### 3. Auto-Analysis Configuration
**File:** autoAnalysis.js  
**Purpose:** Configures automatic incident analysis settings
**Requirements:** System Administrator role

```javascript
// Copy and paste the content of autoAnalysis.js
```



## Validation

After running all scripts, execute the comprehensive validation script to ensure everything is configured correctly:

1. Navigate to Scripts - Background in ServiceNow
2. Copy and paste the content of: `deployment/validation/comprehensive-validator.js`
3. Run the script and review the results

## Quick Links

- **Scripts - Background:** System Definition > Scripts - Background
- **System Properties:** System Properties > Basic Configuration > System Properties  
- **User Administration:** User Administration > Users
- **Update Sets:** System Update Sets > Retrieved Update Sets

## Troubleshooting

If you encounter issues:

1. **Permission Errors:** Ensure you have the required administrative roles
2. **API Key Issues:** Verify your OpenAI API key starts with 'sk-' and is valid
3. **Network Issues:** Check that your ServiceNow instance can access api.openai.com
4. **Script Errors:** Review the execution logs for detailed error messages

## Support

For additional help:
- Check the main project README.md
- Review SETUP_GUIDE.md for detailed instructions
- Run the validation script for specific diagnostic information

---
*Generated: 2025-05-26T12:49:48.427Z*
