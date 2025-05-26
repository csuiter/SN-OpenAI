#!/usr/bin/env node

/**
 * ServiceNow-OpenAI Integration Deployment Script
 * 
 * This script automates the deployment of the ServiceNow-OpenAI integration
 * by providing interactive setup, validation, and deployment tools.
 * 
 * Usage: node deployment/deploy.js [options]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const https = require('https');
const { URL } = require('url');

class ServiceNowDeployer {
    constructor() {
        this.config = {};
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async deploy() {
        console.log('\n🚀 ServiceNow-OpenAI Integration Deployment Tool\n');
        console.log('This tool will help you deploy the integration to your ServiceNow instance.\n');

        try {
            await this.collectInstanceInfo();
            await this.validateConnection();
            await this.validateOpenAIKey();
            await this.generateDeploymentFiles();
            await this.showDeploymentInstructions();
        } catch (error) {
            console.error('\n❌ Deployment failed:', error.message);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    async collectInstanceInfo() {
        console.log('📋 Step 1: ServiceNow Instance Information\n');
        
        this.config.instanceUrl = await this.question('ServiceNow instance URL (e.g., https://your-instance.service-now.com): ');
        this.config.username = await this.question('ServiceNow username: ');
        this.config.password = await this.question('ServiceNow password: ', true);
        this.config.openaiApiKey = await this.question('OpenAI API key: ', true);
        
        // Validate URL format
        try {
            new URL(this.config.instanceUrl);
        } catch (error) {
            throw new Error('Invalid ServiceNow instance URL format');
        }
        
        console.log('\n✅ Instance information collected\n');
    }

    async validateConnection() {
        console.log('🔍 Step 2: Validating ServiceNow Connection\n');
        
        const testUrl = `${this.config.instanceUrl}/api/now/table/sys_user?sysparm_limit=1`;
        const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
        
        try {
            await this.makeHttpRequest(testUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });
            console.log('✅ ServiceNow connection successful\n');
        } catch (error) {
            throw new Error(`ServiceNow connection failed: ${error.message}`);
        }
    }

    async validateOpenAIKey() {
        console.log('🔍 Step 3: Validating OpenAI API Key\n');
        
        try {
            await this.makeHttpRequest('https://api.openai.com/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.openaiApiKey}`,
                    'Accept': 'application/json'
                }
            });
            console.log('✅ OpenAI API key validation successful\n');
        } catch (error) {
            throw new Error(`OpenAI API key validation failed: ${error.message}`);
        }
    }

    async generateDeploymentFiles() {
        console.log('📦 Step 4: Generating Deployment Files\n');
        
        // Create deployment configuration
        const deploymentConfig = {
            instance: {
                url: this.config.instanceUrl,
                username: this.config.username
            },
            openai: {
                apiKey: this.config.openaiApiKey
            },
            deployment: {
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        };

        // Save configuration (without sensitive data for logging)
        const safeConfig = { ...deploymentConfig };
        safeConfig.instance.password = '[HIDDEN]';
        safeConfig.openai.apiKey = '[HIDDEN]';
        
        fs.writeFileSync(
            path.join(__dirname, 'deployment-config.json'),
            JSON.stringify(safeConfig, null, 2)
        );

        // Generate system properties script
        await this.generateSystemPropertiesScript();
        
        // Generate user role assignment script
        await this.generateUserRoleScript();
        
        // Generate validation script
        await this.generateValidationScript();
        
        console.log('✅ Deployment files generated\n');
    }

    async generateSystemPropertiesScript() {
        const script = `
// System Properties Setup Script
// Run this in ServiceNow Scripts - Background

// Create or update OpenAI API key system property
var prop = new GlideRecord('sys_properties');
prop.addQuery('name', 'openai.api_key');
prop.query();

if (prop.next()) {
    prop.setValue('value', '${this.config.openaiApiKey}');
    prop.setValue('description', 'OpenAI API key for ServiceNow integration');
    prop.update();
    gs.info('Updated OpenAI API key system property');
} else {
    prop.initialize();
    prop.setValue('name', 'openai.api_key');
    prop.setValue('value', '${this.config.openaiApiKey}');
    prop.setValue('description', 'OpenAI API key for ServiceNow integration');
    prop.setValue('type', 'string');
    prop.setValue('suffix', 'string');
    prop.insert();
    gs.info('Created OpenAI API key system property');
}

// Create optional configuration properties
var configs = [
    {
        name: 'openai.auto_analysis_enabled',
        value: 'true',
        description: 'Enable automatic incident analysis with OpenAI'
    },
    {
        name: 'openai.max_retries',
        value: '3',
        description: 'Maximum retry attempts for OpenAI API calls'
    },
    {
        name: 'openai.timeout_seconds',
        value: '30',
        description: 'Timeout for OpenAI API requests in seconds'
    },
    {
        name: 'openai.model',
        value: 'gpt-3.5-turbo',
        description: 'OpenAI model to use for analysis'
    }
];

configs.forEach(function(config) {
    var prop = new GlideRecord('sys_properties');
    prop.addQuery('name', config.name);
    prop.query();
    
    if (!prop.next()) {
        prop.initialize();
        prop.setValue('name', config.name);
        prop.setValue('value', config.value);
        prop.setValue('description', config.description);
        prop.setValue('type', 'string');
        prop.setValue('suffix', 'string');
        prop.insert();
        gs.info('Created system property: ' + config.name);
    }
});

gs.info('System properties configuration completed');
`;

        fs.writeFileSync(
            path.join(__dirname, 'scripts/setup-system-properties.js'),
            script.trim()
        );
    }

    async generateUserRoleScript() {
        const script = `
// User Role Assignment Script
// Run this in ServiceNow Scripts - Background
// Replace 'your_username' with actual usernames

// Create OpenAI user role if it doesn't exist
var role = new GlideRecord('sys_user_role');
role.addQuery('name', 'openai_user');
role.query();

if (!role.next()) {
    role.initialize();
    role.setValue('name', 'openai_user');
    role.setValue('description', 'Role for users who can access OpenAI integration features');
    role.setValue('suffix', 'openai_user');
    role.insert();
    gs.info('Created openai_user role');
}

// Example: Assign role to admin user (modify as needed)
var userRoles = [
    'admin'  // Add your usernames here
];

userRoles.forEach(function(username) {
    var user = new GlideRecord('sys_user');
    user.addQuery('user_name', username);
    user.query();
    
    if (user.next()) {
        var userRole = new GlideRecord('sys_user_has_role');
        userRole.addQuery('user', user.sys_id);
        userRole.addQuery('role.name', 'openai_user');
        userRole.query();
        
        if (!userRole.next()) {
            userRole.initialize();
            userRole.setValue('user', user.sys_id);
            
            var roleRecord = new GlideRecord('sys_user_role');
            roleRecord.addQuery('name', 'openai_user');
            roleRecord.query();
            
            if (roleRecord.next()) {
                userRole.setValue('role', roleRecord.sys_id);
                userRole.insert();
                gs.info('Assigned openai_user role to: ' + username);
            }
        }
    }
});

gs.info('User role assignment completed');
`;

        fs.writeFileSync(
            path.join(__dirname, 'scripts/setup-user-roles.js'),
            script.trim()
        );
    }

    async generateValidationScript() {
        const script = `
// Post-Deployment Validation Script
// Run this in ServiceNow Scripts - Background

var validation = {
    passed: 0,
    failed: 0,
    results: []
};

function validateComponent(name, check, errorMsg) {
    try {
        if (check()) {
            validation.passed++;
            validation.results.push('✅ ' + name + ': PASSED');
            return true;
        } else {
            validation.failed++;
            validation.results.push('❌ ' + name + ': FAILED - ' + errorMsg);
            return false;
        }
    } catch (e) {
        validation.failed++;
        validation.results.push('❌ ' + name + ': ERROR - ' + e.message);
        return false;
    }
}

// Validate system properties
validateComponent(
    'OpenAI API Key Property',
    function() {
        var prop = new GlideRecord('sys_properties');
        prop.addQuery('name', 'openai.api_key');
        prop.query();
        return prop.next() && prop.getValue('value');
    },
    'OpenAI API key system property not found or empty'
);

// Validate OpenAI interaction table
validateComponent(
    'OpenAI Interaction Table',
    function() {
        var table = new GlideRecord('x_openai_interactions');
        return table.isValid();
    },
    'OpenAI interaction table not found'
);

// Validate script include
validateComponent(
    'OpenAI Script Include',
    function() {
        var scriptInclude = new GlideRecord('sys_script_include');
        scriptInclude.addQuery('name', 'OpenAIIntegration');
        scriptInclude.query();
        return scriptInclude.next();
    },
    'OpenAI script include not found'
);

// Validate business rule
validateComponent(
    'Incident Auto-Analysis Business Rule',
    function() {
        var br = new GlideRecord('sys_script');
        br.addQuery('name', 'Incident Auto-Analysis with OpenAI');
        br.query();
        return br.next();
    },
    'Auto-analysis business rule not found'
);

// Validate UI action
validateComponent(
    'OpenAI Analysis UI Action',
    function() {
        var uiAction = new GlideRecord('sys_ui_action');
        uiAction.addQuery('name', 'Analyze with OpenAI');
        uiAction.query();
        return uiAction.next();
    },
    'OpenAI UI action not found'
);

// Display results
gs.info('\\n=== ServiceNow-OpenAI Integration Validation Results ===');
validation.results.forEach(function(result) {
    gs.info(result);
});

gs.info('\\nSummary: ' + validation.passed + ' passed, ' + validation.failed + ' failed');

if (validation.failed === 0) {
    gs.info('\\n🎉 All validations passed! Your ServiceNow-OpenAI integration is ready to use.');
} else {
    gs.warn('\\n⚠️  Some validations failed. Please check the update set import and configuration.');
}
`;

        fs.writeFileSync(
            path.join(__dirname, 'scripts/validate-deployment.js'),
            script.trim()
        );
    }

    async showDeploymentInstructions() {
        console.log('📋 Step 5: Deployment Instructions\n');
        
        console.log('Your deployment files have been generated! Follow these steps:\n');
        
        console.log('1️⃣  Import Update Set:');
        console.log(`   • Go to ${this.config.instanceUrl}/nav_to.do?uri=sys_remote_update_set_list.do`);
        console.log('   • Click "Import Update Set from XML"');
        console.log('   • Upload: src/servicenow/ServiceNowOpenAIUpdateSet.xml');
        console.log('   • Preview and commit the update set\n');
        
        console.log('2️⃣  Configure System Properties:');
        console.log(`   • Go to ${this.config.instanceUrl}/nav_to.do?uri=sys_script_background.do`);
        console.log('   • Copy and run: deployment/scripts/setup-system-properties.js\n');
        
        console.log('3️⃣  Setup User Roles:');
        console.log('   • Edit deployment/scripts/setup-user-roles.js');
        console.log('   • Add your usernames to the userRoles array');
        console.log('   • Run the script in Scripts - Background\n');
        
        console.log('4️⃣  Validate Deployment:');
        console.log('   • Run: deployment/scripts/validate-deployment.js');
        console.log('   • Verify all components are working\n');
        
        console.log('5️⃣  Test the Integration:');
        console.log('   • Create or open an incident');
        console.log('   • Click "Analyze with OpenAI" button');
        console.log('   • Check the results in the OpenAI Interactions table\n');
        
        console.log('📁 Generated Files:');
        console.log('   • deployment/deployment-config.json');
        console.log('   • deployment/scripts/setup-system-properties.js');
        console.log('   • deployment/scripts/setup-user-roles.js');
        console.log('   • deployment/scripts/validate-deployment.js\n');
        
        console.log('🔗 Quick Links:');
        console.log(`   • Update Sets: ${this.config.instanceUrl}/nav_to.do?uri=sys_remote_update_set_list.do`);
        console.log(`   • Scripts - Background: ${this.config.instanceUrl}/nav_to.do?uri=sys_script_background.do`);
        console.log(`   • System Properties: ${this.config.instanceUrl}/nav_to.do?uri=sys_properties_list.do`);
        console.log(`   • OpenAI Interactions: ${this.config.instanceUrl}/nav_to.do?uri=x_openai_interactions_list.do\n`);
        
        console.log('✅ Deployment preparation completed successfully!\n');
    }

    async question(prompt, isPassword = false) {
        return new Promise((resolve) => {
            if (isPassword) {
                // Hide password input
                process.stdout.write(prompt);
                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.setEncoding('utf8');
                
                let password = '';
                process.stdin.on('data', function(char) {
                    char = char + '';
                    switch (char) {
                        case '\n':
                        case '\r':
                        case '\u0004':
                            process.stdin.setRawMode(false);
                            process.stdin.pause();
                            process.stdout.write('\n');
                            resolve(password);
                            break;
                        case '\u0003':
                            process.exit();
                            break;
                        case '\u007f': // Backspace
                            if (password.length > 0) {
                                password = password.slice(0, -1);
                                process.stdout.write('\b \b');
                            }
                            break;
                        default:
                            password += char;
                            process.stdout.write('*');
                            break;
                    }
                });
            } else {
                this.rl.question(prompt, resolve);
            }
        });
    }

    async makeHttpRequest(url, options) {
        return new Promise((resolve, reject) => {
            const request = https.request(url, options, (response) => {
                let data = '';
                response.on('data', chunk => data += chunk);
                response.on('end', () => {
                    if (response.statusCode >= 200 && response.statusCode < 300) {
                        resolve(data);
                    } else {
                        reject(new Error(`HTTP ${response.statusCode}: ${data}`));
                    }
                });
            });

            request.on('error', reject);
            request.setTimeout(10000, () => {
                request.destroy();
                reject(new Error('Request timeout'));
            });

            request.end();
        });
    }
}

// Run deployment if called directly
if (require.main === module) {
    const deployer = new ServiceNowDeployer();
    deployer.deploy().catch(console.error);
}

module.exports = ServiceNowDeployer;
