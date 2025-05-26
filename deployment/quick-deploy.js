#!/usr/bin/env node

/**
 * Quick Deploy CLI Tool
 * 
 * A simplified command-line tool for rapid ServiceNow deployment
 * Usage: node deployment/quick-deploy.js --instance=https://your-instance.service-now.com
 */

const fs = require('fs');
const path = require('path');

class QuickDeploy {
    constructor() {
        this.args = this.parseArgs();
    }

    parseArgs() {
        const args = {};
        process.argv.slice(2).forEach(arg => {
            if (arg.startsWith('--')) {
                const [key, value] = arg.split('=');
                args[key.substring(2)] = value || true;
            }
        });
        return args;
    }

    run() {
        console.log('\n🚀 ServiceNow-OpenAI Quick Deploy Tool\n');

        if (this.args.help) {
            this.showHelp();
            return;
        }

        if (!this.args.instance) {
            console.error('❌ Error: --instance parameter is required');
            console.log('\nUsage: node deployment/quick-deploy.js --instance=https://your-instance.service-now.com\n');
            process.exit(1);
        }

        this.generateQuickStartGuide();
    }

    generateQuickStartGuide() {
        const instance = this.args.instance;
        
        console.log('📋 QUICK DEPLOYMENT STEPS\n');
        console.log('Follow these steps in order:\n');

        console.log('1️⃣  IMPORT UPDATE SET');
        console.log(`   🔗 Open: ${instance}/nav_to.do?uri=sys_remote_update_set_list.do`);
        console.log('   📁 Upload: src/servicenow/ServiceNowOpenAIUpdateSet.xml');
        console.log('   ✅ Preview and Commit the update set\n');

        console.log('2️⃣  CONFIGURE API KEY');
        console.log(`   🔗 Open: ${instance}/nav_to.do?uri=sys_script_background.do`);
        console.log('   📋 Copy/paste this script:');
        console.log('   ┌─────────────────────────────────────────────┐');
        console.log('   │ // Set OpenAI API Key                      │');
        console.log('   │ var prop = new GlideRecord(\'sys_properties\');│');
        console.log('   │ prop.addQuery(\'name\', \'openai.api_key\');    │');
        console.log('   │ prop.query();                               │');
        console.log('   │ if (prop.next()) {                         │');
        console.log('   │   prop.setValue(\'value\', \'YOUR_API_KEY\');   │');
        console.log('   │   prop.update();                           │');
        console.log('   │ } else {                                   │');
        console.log('   │   prop.initialize();                       │');
        console.log('   │   prop.setValue(\'name\', \'openai.api_key\');  │');
        console.log('   │   prop.setValue(\'value\', \'YOUR_API_KEY\');   │');
        console.log('   │   prop.insert();                           │');
        console.log('   │ }                                          │');
        console.log('   │ gs.info(\'OpenAI API key configured\');       │');
        console.log('   └─────────────────────────────────────────────┘');
        console.log('   ⚠️  Replace YOUR_API_KEY with your actual OpenAI API key\n');

        console.log('3️⃣  VALIDATE DEPLOYMENT');
        console.log(`   🔗 Open: ${instance}/nav_to.do?uri=sys_script_background.do`);
        console.log('   📁 Copy/paste: deployment/validation/comprehensive-validator.js');
        console.log('   ▶️  Run the script to check everything is working\n');

        console.log('4️⃣  TEST INTEGRATION');
        console.log(`   🔗 Open: ${instance}/nav_to.do?uri=incident_list.do`);
        console.log('   📝 Create a new incident or open an existing one');
        console.log('   🔘 Click "Analyze with OpenAI" button');
        console.log('   📊 Check results in OpenAI Interactions table\n');

        console.log('🔗 QUICK LINKS:');
        console.log(`   • Update Sets: ${instance}/nav_to.do?uri=sys_remote_update_set_list.do`);
        console.log(`   • Scripts: ${instance}/nav_to.do?uri=sys_script_background.do`);
        console.log(`   • System Properties: ${instance}/nav_to.do?uri=sys_properties_list.do`);
        console.log(`   • Incidents: ${instance}/nav_to.do?uri=incident_list.do`);
        console.log(`   • OpenAI Interactions: ${instance}/nav_to.do?uri=x_openai_interactions_list.do\n`);

        // Generate deployment checklist file
        this.generateChecklistFile(instance);

        console.log('✅ Quick deployment guide generated!');
        console.log('📁 Saved checklist to: deployment/deployment-checklist.md\n');
    }

    generateChecklistFile(instance) {
        const checklist = `# ServiceNow-OpenAI Integration Deployment Checklist

## Instance: ${instance}
## Date: ${new Date().toISOString().split('T')[0]}

### Pre-Deployment
- [ ] ServiceNow instance is accessible
- [ ] Admin/import_admin access confirmed
- [ ] OpenAI API key ready
- [ ] Network access to api.openai.com confirmed

### Deployment Steps

#### 1. Import Update Set
- [ ] Navigate to: [Update Sets](${instance}/nav_to.do?uri=sys_remote_update_set_list.do)
- [ ] Click "Import Update Set from XML"
- [ ] Upload: \`src/servicenow/ServiceNowOpenAIUpdateSet.xml\`
- [ ] Preview update set
- [ ] Resolve any conflicts
- [ ] Commit update set

#### 2. Configure System Properties
- [ ] Navigate to: [Scripts - Background](${instance}/nav_to.do?uri=sys_script_background.do)
- [ ] Run API key configuration script
- [ ] Verify system property created: \`openai.api_key\`

#### 3. Validate Deployment
- [ ] Run comprehensive validation script
- [ ] All validations pass
- [ ] No critical errors reported

#### 4. Configure User Access
- [ ] Assign \`openai_user\` role to appropriate users
- [ ] Test UI button visibility
- [ ] Verify permissions

#### 5. Functional Testing
- [ ] Create test incident
- [ ] Click "Analyze with OpenAI" button
- [ ] Verify response appears
- [ ] Check OpenAI Interactions table
- [ ] Test auto-analysis (if enabled)

### Post-Deployment
- [ ] Document any customizations
- [ ] Train end users
- [ ] Monitor initial usage
- [ ] Set up ongoing maintenance schedule

### Troubleshooting
If issues occur:
1. Check system logs: [System Logs](${instance}/nav_to.do?uri=syslog_list.do)
2. Verify network connectivity
3. Validate API key format (starts with 'sk-')
4. Check user roles and permissions
5. Review update set import logs

### Support Resources
- Project README: [Documentation](../README.md)
- Setup Guide: [SETUP_GUIDE.md](../SETUP_GUIDE.md)
- Validation Script: [comprehensive-validator.js](validation/comprehensive-validator.js)

---
*Generated by ServiceNow-OpenAI Quick Deploy Tool*
`;

        fs.writeFileSync(
            path.join(__dirname, 'deployment-checklist.md'),
            checklist
        );
    }

    showHelp() {
        console.log('ServiceNow-OpenAI Quick Deploy Tool\n');
        console.log('Usage:');
        console.log('  node deployment/quick-deploy.js --instance=<url> [options]\n');
        console.log('Required:');
        console.log('  --instance=<url>    ServiceNow instance URL\n');
        console.log('Options:');
        console.log('  --help              Show this help message\n');
        console.log('Examples:');
        console.log('  node deployment/quick-deploy.js --instance=https://dev12345.service-now.com');
        console.log('  node deployment/quick-deploy.js --help\n');
    }
}

// Run if called directly
if (require.main === module) {
    const deployer = new QuickDeploy();
    deployer.run();
}

module.exports = QuickDeploy;
