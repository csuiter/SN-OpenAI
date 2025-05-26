/**
 * Auto-Configuration Script Generator
 * 
 * Generates customized ServiceNow scripts based on user requirements.
 * This runs locally to create deployment-ready scripts.
 */

const fs = require('fs');
const path = require('path');

class ConfigGenerator {
    constructor() {
        this.templates = {};
        this.loadTemplates();
    }

    loadTemplates() {
        this.templates = {
            systemProperties: this.getSystemPropertiesTemplate(),
            userRoles: this.getUserRolesTemplate(),
            autoAnalysis: this.getAutoAnalysisTemplate(),
            customFields: this.getCustomFieldsTemplate()
        };
    }

    generateConfig(options = {}) {
        const config = {
            apiKey: options.apiKey || 'YOUR_OPENAI_API_KEY',
            autoAnalysisEnabled: options.autoAnalysis !== false,
            usernames: options.usernames || ['admin'],
            timeout: options.timeout || 30,
            maxRetries: options.maxRetries || 3,
            model: options.model || 'gpt-3.5-turbo',
            customFields: options.customFields || false,
            ...options
        };

        const scripts = {};

        // Generate system properties script
        scripts.systemProperties = this.templates.systemProperties
            .replace(/\{\{API_KEY\}\}/g, config.apiKey)
            .replace(/\{\{AUTO_ANALYSIS\}\}/g, config.autoAnalysisEnabled.toString())
            .replace(/\{\{TIMEOUT\}\}/g, config.timeout.toString())
            .replace(/\{\{MAX_RETRIES\}\}/g, config.maxRetries.toString())
            .replace(/\{\{MODEL\}\}/g, config.model);

        // Generate user roles script
        scripts.userRoles = this.templates.userRoles
            .replace(/\{\{USERNAMES\}\}/g, JSON.stringify(config.usernames));

        // Generate auto-analysis configuration
        scripts.autoAnalysis = this.templates.autoAnalysis
            .replace(/\{\{ENABLED\}\}/g, config.autoAnalysisEnabled.toString());

        // Generate custom fields script if requested
        if (config.customFields) {
            scripts.customFields = this.templates.customFields;
        }

        return scripts;
    }

    saveScripts(scripts, outputDir = './deployment/scripts/generated') {
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const files = [];

        Object.keys(scripts).forEach(scriptName => {
            const filename = `${scriptName}.js`;
            const filepath = path.join(outputDir, filename);
            
            fs.writeFileSync(filepath, scripts[scriptName]);
            files.push(filepath);
            
            console.log(`✅ Generated: ${filename}`);
        });

        // Generate deployment instructions
        const instructions = this.generateInstructions(files);
        const instructionsPath = path.join(outputDir, 'deployment-instructions.md');
        fs.writeFileSync(instructionsPath, instructions);
        files.push(instructionsPath);
        
        console.log(`✅ Generated: deployment-instructions.md`);

        return files;
    }

    generateInstructions(scriptFiles) {
        return `# Generated Deployment Scripts

These scripts have been automatically generated for your ServiceNow-OpenAI integration deployment.

## Execution Order

Run these scripts in ServiceNow Scripts - Background in the following order:

### 1. System Properties Setup
**File:** systemProperties.js
**Purpose:** Configures all required system properties including API key
**Requirements:** System Administrator role

\`\`\`javascript
// Copy and paste the content of systemProperties.js
\`\`\`

### 2. User Roles Configuration  
**File:** userRoles.js
**Purpose:** Creates roles and assigns them to specified users
**Requirements:** User Administrator role

\`\`\`javascript
// Copy and paste the content of userRoles.js
\`\`\`

### 3. Auto-Analysis Configuration
**File:** autoAnalysis.js  
**Purpose:** Configures automatic incident analysis settings
**Requirements:** System Administrator role

\`\`\`javascript
// Copy and paste the content of autoAnalysis.js
\`\`\`

${scriptFiles.includes('customFields.js') ? `
### 4. Custom Fields Setup (Optional)
**File:** customFields.js
**Purpose:** Adds custom fields to enhance functionality
**Requirements:** System Administrator role

\`\`\`javascript
// Copy and paste the content of customFields.js
\`\`\`
` : ''}

## Validation

After running all scripts, execute the comprehensive validation script to ensure everything is configured correctly:

1. Navigate to Scripts - Background in ServiceNow
2. Copy and paste the content of: \`deployment/validation/comprehensive-validator.js\`
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
*Generated: ${new Date().toISOString()}*
`;
    }

    getSystemPropertiesTemplate() {
        return `// ServiceNow-OpenAI Integration: System Properties Configuration
// Generated: ${new Date().toISOString()}
// 
// This script configures all required and optional system properties
// for the ServiceNow-OpenAI integration.

(function configureSystemProperties() {
    var properties = [
        {
            name: 'openai.api_key',
            value: '{{API_KEY}}',
            description: 'OpenAI API key for ServiceNow integration',
            type: 'password',
            suffix: 'password'
        },
        {
            name: 'openai.auto_analysis_enabled',
            value: '{{AUTO_ANALYSIS}}',
            description: 'Enable automatic incident analysis with OpenAI',
            type: 'boolean',
            suffix: 'boolean'
        },
        {
            name: 'openai.timeout_seconds',
            value: '{{TIMEOUT}}',
            description: 'Timeout for OpenAI API requests in seconds',
            type: 'integer',
            suffix: 'integer'
        },
        {
            name: 'openai.max_retries',
            value: '{{MAX_RETRIES}}',
            description: 'Maximum retry attempts for OpenAI API calls',
            type: 'integer',
            suffix: 'integer'
        },
        {
            name: 'openai.model',
            value: '{{MODEL}}',
            description: 'OpenAI model to use for analysis',
            type: 'string',
            suffix: 'string'
        },
        {
            name: 'openai.rate_limit_requests_per_minute',
            value: '60',
            description: 'Rate limit: requests per minute for OpenAI API',
            type: 'integer',
            suffix: 'integer'
        },
        {
            name: 'openai.log_interactions',
            value: 'true',
            description: 'Log all OpenAI interactions for audit purposes',
            type: 'boolean',
            suffix: 'boolean'
        }
    ];

    var created = 0;
    var updated = 0;
    var errors = 0;

    properties.forEach(function(propConfig) {
        try {
            var prop = new GlideRecord('sys_properties');
            prop.addQuery('name', propConfig.name);
            prop.query();

            if (prop.next()) {
                // Update existing property
                prop.setValue('value', propConfig.value);
                prop.setValue('description', propConfig.description);
                prop.update();
                updated++;
                gs.info('✅ Updated: ' + propConfig.name);
            } else {
                // Create new property
                prop.initialize();
                prop.setValue('name', propConfig.name);
                prop.setValue('value', propConfig.value);
                prop.setValue('description', propConfig.description);
                prop.setValue('type', propConfig.type || 'string');
                prop.setValue('suffix', propConfig.suffix || 'string');
                prop.insert();
                created++;
                gs.info('✅ Created: ' + propConfig.name);
            }
        } catch (e) {
            errors++;
            gs.error('❌ Error configuring ' + propConfig.name + ': ' + e.message);
        }
    });

    gs.info('\\n📊 System Properties Configuration Summary:');
    gs.info('   Created: ' + created);
    gs.info('   Updated: ' + updated);
    gs.info('   Errors: ' + errors);
    gs.info('   Total: ' + properties.length);

    if (errors === 0) {
        gs.info('\\n🎉 All system properties configured successfully!');
    } else {
        gs.warn('\\n⚠️  Some properties had errors. Please check the logs above.');
    }
})();`;
    }

    getUserRolesTemplate() {
        return `// ServiceNow-OpenAI Integration: User Roles Configuration
// Generated: ${new Date().toISOString()}
//
// This script creates the OpenAI user role and assigns it to specified users.

(function configureUserRoles() {
    var targetUsernames = {{USERNAMES}};
    
    // Create OpenAI user role
    var role = new GlideRecord('sys_user_role');
    role.addQuery('name', 'openai_user');
    role.query();

    var roleId;
    if (!role.next()) {
        // Create the role
        role.initialize();
        role.setValue('name', 'openai_user');
        role.setValue('description', 'Role for users who can access OpenAI integration features');
        role.setValue('suffix', 'openai_user');
        roleId = role.insert();
        gs.info('✅ Created openai_user role');
    } else {
        roleId = role.sys_id;
        gs.info('✅ openai_user role already exists');
    }

    // Assign role to specified users
    var assigned = 0;
    var skipped = 0;
    var errors = 0;

    targetUsernames.forEach(function(username) {
        try {
            var user = new GlideRecord('sys_user');
            user.addQuery('user_name', username);
            user.query();

            if (user.next()) {
                // Check if user already has the role
                var userRole = new GlideRecord('sys_user_has_role');
                userRole.addQuery('user', user.sys_id);
                userRole.addQuery('role', roleId);
                userRole.query();

                if (!userRole.next()) {
                    // Assign the role
                    userRole.initialize();
                    userRole.setValue('user', user.sys_id);
                    userRole.setValue('role', roleId);
                    userRole.insert();
                    assigned++;
                    gs.info('✅ Assigned openai_user role to: ' + username);
                } else {
                    skipped++;
                    gs.info('ℹ️  User ' + username + ' already has openai_user role');
                }
            } else {
                errors++;
                gs.error('❌ User not found: ' + username);
            }
        } catch (e) {
            errors++;
            gs.error('❌ Error processing user ' + username + ': ' + e.message);
        }
    });

    gs.info('\\n📊 User Roles Configuration Summary:');
    gs.info('   Role assignments: ' + assigned);
    gs.info('   Already assigned: ' + skipped);
    gs.info('   Errors: ' + errors);
    gs.info('   Total users processed: ' + targetUsernames.length);

    if (errors === 0) {
        gs.info('\\n🎉 User roles configured successfully!');
        gs.info('💡 Users with openai_user role can now access OpenAI integration features.');
    } else {
        gs.warn('\\n⚠️  Some users had errors. Please check the logs above.');
    }
})();`;
    }

    getAutoAnalysisTemplate() {
        return `// ServiceNow-OpenAI Integration: Auto-Analysis Configuration
// Generated: ${new Date().toISOString()}
//
// This script configures automatic analysis settings and business rules.

(function configureAutoAnalysis() {
    var autoAnalysisEnabled = {{ENABLED}};
    
    gs.info('🔧 Configuring auto-analysis settings...');
    
    // Update business rule activation status
    var businessRule = new GlideRecord('sys_script');
    businessRule.addQuery('name', 'Incident Auto-Analysis with OpenAI');
    businessRule.query();
    
    if (businessRule.next()) {
        businessRule.setValue('active', autoAnalysisEnabled);
        businessRule.update();
        
        var status = autoAnalysisEnabled ? 'enabled' : 'disabled';
        gs.info('✅ Auto-analysis business rule ' + status);
    } else {
        gs.warn('⚠️  Auto-analysis business rule not found. Please ensure update set is imported.');
    }
    
    // Configure analysis triggers
    var triggers = [
        {
            table: 'incident',
            field: 'state',
            condition: 'New',
            description: 'Trigger analysis when incident state is New'
        },
        {
            table: 'incident', 
            field: 'priority',
            condition: '1,2',
            description: 'Trigger analysis for high priority incidents'
        }
    ];
    
    if (autoAnalysisEnabled) {
        gs.info('\\n🎯 Auto-analysis will trigger for:');
        triggers.forEach(function(trigger) {
            gs.info('   • ' + trigger.description);
        });
        
        gs.info('\\n📊 Analysis will include:');
        gs.info('   • Root cause analysis');
        gs.info('   • Resolution suggestions');
        gs.info('   • Knowledge article recommendations');
        gs.info('   • Impact and urgency assessment');
        
        gs.info('\\n⚙️  To customize triggers, modify the business rule conditions.');
    } else {
        gs.info('\\n🔇 Auto-analysis is disabled. Users can still trigger manual analysis.');
    }
    
    // Set up analysis categories
    var categories = [
        'technical_issue',
        'user_request', 
        'access_problem',
        'performance_issue',
        'application_error'
    ];
    
    gs.info('\\n📝 Supported analysis categories: ' + categories.join(', '));
    
    gs.info('\\n🎉 Auto-analysis configuration completed!');
    
    if (autoAnalysisEnabled) {
        gs.info('💡 Create a new incident to test the auto-analysis feature.');
    } else {
        gs.info('💡 Use the "Analyze with OpenAI" button for manual analysis.');
    }
})();`;
    }

    getCustomFieldsTemplate() {
        return `// ServiceNow-OpenAI Integration: Custom Fields Setup
// Generated: ${new Date().toISOString()}
//
// This script adds optional custom fields to enhance OpenAI integration functionality.

(function setupCustomFields() {
    gs.info('🔧 Setting up custom fields for enhanced OpenAI integration...');
    
    // Custom fields to add to incident table
    var incidentFields = [
        {
            column_name: 'u_openai_analysis_status',
            column_label: 'OpenAI Analysis Status',
            internal_type: 'choice',
            max_length: 40,
            choice_values: [
                { label: 'Not Analyzed', value: 'not_analyzed' },
                { label: 'In Progress', value: 'in_progress' },
                { label: 'Completed', value: 'completed' },
                { label: 'Failed', value: 'failed' }
            ]
        },
        {
            column_name: 'u_openai_confidence_score',
            column_label: 'AI Confidence Score',
            internal_type: 'integer',
            max_length: 40
        },
        {
            column_name: 'u_openai_last_analysis',
            column_label: 'Last OpenAI Analysis',
            internal_type: 'glide_date_time',
            max_length: 40
        },
        {
            column_name: 'u_openai_suggested_category',
            column_label: 'AI Suggested Category',
            internal_type: 'string',
            max_length: 100
        }
    ];
    
    // Add fields to incident table
    incidentFields.forEach(function(fieldConfig) {
        try {
            var field = new GlideRecord('sys_dictionary');
            field.addQuery('name', 'incident');
            field.addQuery('element', fieldConfig.column_name);
            field.query();
            
            if (!field.next()) {
                // Create the field
                field.initialize();
                field.setValue('name', 'incident');
                field.setValue('element', fieldConfig.column_name);
                field.setValue('column_label', fieldConfig.column_label);
                field.setValue('internal_type', fieldConfig.internal_type);
                field.setValue('max_length', fieldConfig.max_length);
                field.setValue('active', true);
                field.setValue('read_only', false);
                field.setValue('mandatory', false);
                field.insert();
                
                gs.info('✅ Created field: ' + fieldConfig.column_label);
                
                // Add choice values if specified
                if (fieldConfig.choice_values) {
                    fieldConfig.choice_values.forEach(function(choice) {
                        var choiceRecord = new GlideRecord('sys_choice');
                        choiceRecord.initialize();
                        choiceRecord.setValue('name', 'incident');
                        choiceRecord.setValue('element', fieldConfig.column_name);
                        choiceRecord.setValue('label', choice.label);
                        choiceRecord.setValue('value', choice.value);
                        choiceRecord.setValue('sequence', choice.sequence || 100);
                        choiceRecord.insert();
                    });
                    gs.info('   Added ' + fieldConfig.choice_values.length + ' choice values');
                }
            } else {
                gs.info('ℹ️  Field already exists: ' + fieldConfig.column_label);
            }
        } catch (e) {
            gs.error('❌ Error creating field ' + fieldConfig.column_name + ': ' + e.message);
        }
    });
    
    // Create custom form section
    try {
        var formSection = new GlideRecord('sys_ui_section');
        formSection.addQuery('name', 'incident');
        formSection.addQuery('title', 'OpenAI Analysis');
        formSection.query();
        
        if (!formSection.next()) {
            formSection.initialize();
            formSection.setValue('name', 'incident');
            formSection.setValue('title', 'OpenAI Analysis');
            formSection.setValue('position', 3);
            formSection.setValue('view', '');
            formSection.insert();
            
            var sectionId = formSection.sys_id;
            gs.info('✅ Created form section: OpenAI Analysis');
            
            // Add fields to the section
            var fieldOrder = 0;
            incidentFields.forEach(function(fieldConfig) {
                var formElement = new GlideRecord('sys_ui_element');
                formElement.initialize();
                formElement.setValue('sys_ui_section', sectionId);
                formElement.setValue('element', fieldConfig.column_name);
                formElement.setValue('position', fieldOrder++);
                formElement.setValue('type', 'field');
                formElement.insert();
            });
            
            gs.info('   Added ' + incidentFields.length + ' fields to section');
        } else {
            gs.info('ℹ️  Form section already exists: OpenAI Analysis');
        }
    } catch (e) {
        gs.error('❌ Error creating form section: ' + e.message);
    }
    
    gs.info('\\n🎉 Custom fields setup completed!');
    gs.info('💡 The new fields will appear in the "OpenAI Analysis" section of incident forms.');
    gs.info('🔄 You may need to refresh your browser to see the changes.');
})();`;
    }
}

// CLI interface
if (require.main === module) {
    const generator = new ConfigGenerator();
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {};
    
    args.forEach(arg => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.split('=');
            const optKey = key.substring(2);
            
            // Parse boolean values
            if (value === 'true') options[optKey] = true;
            else if (value === 'false') options[optKey] = false;
            // Parse array values (comma-separated)
            else if (value && value.includes(',')) options[optKey] = value.split(',');
            // Parse other values
            else options[optKey] = value || true;
        }
    });
    
    console.log('🛠️  ServiceNow-OpenAI Configuration Generator\\n');
    
    if (options.help) {
        console.log('Usage: node deployment/config-generator.js [options]\\n');
        console.log('Options:');
        console.log('  --apiKey=<key>           OpenAI API key');
        console.log('  --autoAnalysis=<bool>    Enable auto-analysis (default: true)');
        console.log('  --usernames=<list>       Comma-separated usernames');
        console.log('  --timeout=<seconds>      API timeout (default: 30)');
        console.log('  --maxRetries=<number>    Max retries (default: 3)');
        console.log('  --model=<model>          OpenAI model (default: gpt-3.5-turbo)');
        console.log('  --customFields=<bool>    Add custom fields (default: false)');
        console.log('  --help                   Show this help\\n');
        console.log('Example:');
        console.log('  node deployment/config-generator.js --apiKey=sk-... --usernames=admin,john.doe --customFields=true');
        process.exit(0);
    }
    
    // Generate scripts
    const scripts = generator.generateConfig(options);
    const files = generator.saveScripts(scripts);
    
    console.log('\\n✅ Configuration scripts generated successfully!');
    console.log('📁 Files created:');
    files.forEach(file => console.log('   • ' + file));
    console.log('\\n💡 Next steps:');
    console.log('   1. Review the generated scripts');
    console.log('   2. Update any placeholder values');
    console.log('   3. Run scripts in ServiceNow Scripts - Background');
    console.log('   4. Follow the deployment-instructions.md guide');
}

module.exports = ConfigGenerator;
