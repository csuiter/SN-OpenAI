/**
 * ServiceNow-OpenAI Integration Deployment Validator
 * 
 * This comprehensive validation script checks all aspects of the deployment
 * and provides detailed feedback on what's working and what needs attention.
 * 
 * Run this in ServiceNow Scripts - Background after deployment
 */

(function validateOpenAIIntegration() {
    var results = {
        totalChecks: 0,
        passed: 0,
        failed: 0,
        warnings: 0,
        details: []
    };
    
    function addResult(category, test, status, message, recommendation) {
        results.totalChecks++;
        var result = {
            category: category,
            test: test,
            status: status,
            message: message,
            recommendation: recommendation || ''
        };
        
        results.details.push(result);
        
        switch (status) {
            case 'PASS':
                results.passed++;
                gs.info('✅ [' + category + '] ' + test + ': ' + message);
                break;
            case 'FAIL':
                results.failed++;
                gs.error('❌ [' + category + '] ' + test + ': ' + message);
                if (recommendation) {
                    gs.error('   💡 Recommendation: ' + recommendation);
                }
                break;
            case 'WARN':
                results.warnings++;
                gs.warn('⚠️  [' + category + '] ' + test + ': ' + message);
                if (recommendation) {
                    gs.warn('   💡 Recommendation: ' + recommendation);
                }
                break;
        }
    }
    
    // 1. System Properties Validation
    function validateSystemProperties() {
        // Required properties
        var requiredProps = [
            {
                name: 'openai.api_key',
                description: 'OpenAI API key',
                validateValue: function(value) {
                    return value && value.length > 10 && value.startsWith('sk-');
                }
            }
        ];
        
        // Optional properties
        var optionalProps = [
            'openai.auto_analysis_enabled',
            'openai.max_retries', 
            'openai.timeout_seconds',
            'openai.model'
        ];
        
        requiredProps.forEach(function(prop) {
            var propRecord = new GlideRecord('sys_properties');
            propRecord.addQuery('name', prop.name);
            propRecord.query();
            
            if (propRecord.next()) {
                var value = propRecord.getValue('value');
                if (prop.validateValue && !prop.validateValue(value)) {
                    addResult('System Properties', prop.description, 'FAIL', 
                        'Property exists but value appears invalid',
                        'Verify the ' + prop.description + ' is correct');
                } else if (value) {
                    addResult('System Properties', prop.description, 'PASS', 
                        'Property configured correctly');
                } else {
                    addResult('System Properties', prop.description, 'FAIL', 
                        'Property exists but has no value',
                        'Set a value for ' + prop.name);
                }
            } else {
                addResult('System Properties', prop.description, 'FAIL', 
                    'Required property not found',
                    'Create system property ' + prop.name);
            }
        });
        
        optionalProps.forEach(function(propName) {
            var propRecord = new GlideRecord('sys_properties');
            propRecord.addQuery('name', propName);
            propRecord.query();
            
            if (propRecord.next()) {
                addResult('System Properties', propName, 'PASS', 'Optional property configured');
            } else {
                addResult('System Properties', propName, 'WARN', 
                    'Optional property not configured',
                    'Consider creating ' + propName + ' for enhanced functionality');
            }
        });
    }
    
    // 2. Database Tables Validation
    function validateTables() {
        var tables = [
            {
                name: 'x_openai_interactions',
                label: 'OpenAI Interactions',
                requiredFields: ['request_id', 'prompt', 'response', 'status', 'created_on']
            }
        ];
        
        tables.forEach(function(table) {
            try {
                var testRecord = new GlideRecord(table.name);
                if (testRecord.isValid()) {
                    addResult('Database', table.label + ' Table', 'PASS', 'Table exists and is accessible');
                    
                    // Check required fields
                    table.requiredFields.forEach(function(field) {
                        if (testRecord.isValidField(field)) {
                            addResult('Database', table.label + ' Field: ' + field, 'PASS', 'Field exists');
                        } else {
                            addResult('Database', table.label + ' Field: ' + field, 'FAIL', 
                                'Required field missing',
                                'Verify update set was imported completely');
                        }
                    });
                } else {
                    addResult('Database', table.label + ' Table', 'FAIL', 
                        'Table does not exist or is not accessible',
                        'Import the update set containing table definitions');
                }
            } catch (e) {
                addResult('Database', table.label + ' Table', 'FAIL', 
                    'Error accessing table: ' + e.message,
                    'Check table permissions and existence');
            }
        });
    }
    
    // 3. Script Components Validation
    function validateScriptComponents() {
        var components = [
            {
                table: 'sys_script_include',
                name: 'OpenAIIntegration',
                label: 'OpenAI Script Include',
                type: 'Script Include'
            },
            {
                table: 'sys_script',
                name: 'Incident Auto-Analysis with OpenAI',
                label: 'Auto-Analysis Business Rule',
                type: 'Business Rule'
            },
            {
                table: 'sys_ui_action',
                name: 'Analyze with OpenAI',
                label: 'OpenAI UI Action',
                type: 'UI Action'
            },
            {
                table: 'sys_ui_script',
                name: 'OpenAI Client Script',
                label: 'OpenAI Client Script',
                type: 'Client Script'
            }
        ];
        
        components.forEach(function(component) {
            var record = new GlideRecord(component.table);
            record.addQuery('name', component.name);
            record.query();
            
            if (record.next()) {
                addResult('Scripts', component.label, 'PASS', component.type + ' exists');
                
                // Check if script is active
                if (record.isValidField('active') && record.getValue('active') == 'false') {
                    addResult('Scripts', component.label + ' Status', 'WARN', 
                        component.type + ' exists but is inactive',
                        'Activate the ' + component.type + ' if needed');
                } else if (record.isValidField('active')) {
                    addResult('Scripts', component.label + ' Status', 'PASS', 
                        component.type + ' is active');
                }
            } else {
                addResult('Scripts', component.label, 'FAIL', 
                    component.type + ' not found',
                    'Verify update set import included all script components');
            }
        });
    }
    
    // 4. User Roles and Permissions
    function validateRolesAndPermissions() {
        // Check if openai_user role exists
        var role = new GlideRecord('sys_user_role');
        role.addQuery('name', 'openai_user');
        role.query();
        
        if (role.next()) {
            addResult('Security', 'OpenAI User Role', 'PASS', 'Custom role exists');
            
            // Check if any users have this role
            var userRole = new GlideRecord('sys_user_has_role');
            userRole.addQuery('role', role.sys_id);
            userRole.query();
            
            if (userRole.hasNext()) {
                var count = userRole.getRowCount();
                addResult('Security', 'Role Assignment', 'PASS', 
                    count + ' users have openai_user role');
            } else {
                addResult('Security', 'Role Assignment', 'WARN', 
                    'No users assigned to openai_user role',
                    'Assign the role to users who need OpenAI integration access');
            }
        } else {
            addResult('Security', 'OpenAI User Role', 'WARN', 
                'Custom role not found',
                'Create openai_user role and assign to appropriate users');
        }
    }
    
    // 5. Network Connectivity Test
    function validateNetworkConnectivity() {
        try {
            // Test if we can make outbound HTTPS requests
            var request = new sn_ws.RESTMessageV2();
            request.setEndpoint('https://api.openai.com/v1/models');
            request.setHttpMethod('GET');
            
            var apiKey = gs.getProperty('openai.api_key');
            if (apiKey) {
                request.setRequestHeader('Authorization', 'Bearer ' + apiKey);
            }
            
            var response = request.execute();
            var statusCode = response.getStatusCode();
            
            if (statusCode == 200) {
                addResult('Network', 'OpenAI API Connectivity', 'PASS', 
                    'Successfully connected to OpenAI API');
            } else if (statusCode == 401) {
                addResult('Network', 'OpenAI API Connectivity', 'FAIL', 
                    'Connected but authentication failed',
                    'Verify OpenAI API key is correct');
            } else {
                addResult('Network', 'OpenAI API Connectivity', 'WARN', 
                    'Unexpected response code: ' + statusCode,
                    'Check network configuration and API key');
            }
        } catch (e) {
            addResult('Network', 'OpenAI API Connectivity', 'FAIL', 
                'Network connectivity test failed: ' + e.message,
                'Check firewall settings and network access to api.openai.com');
        }
    }
    
    // 6. Functional Test
    function validateFunctionality() {
        try {
            // Test if the main integration function exists and is callable
            var openaiIntegration = new OpenAIIntegration();
            if (openaiIntegration) {
                addResult('Functionality', 'Script Include Instance', 'PASS', 
                    'OpenAIIntegration class can be instantiated');
                
                // Test basic method existence
                if (typeof openaiIntegration.sendPromptToOpenAI === 'function') {
                    addResult('Functionality', 'Main API Method', 'PASS', 
                        'sendPromptToOpenAI method exists');
                } else {
                    addResult('Functionality', 'Main API Method', 'FAIL', 
                        'sendPromptToOpenAI method not found',
                        'Verify script include was imported correctly');
                }
            } else {
                addResult('Functionality', 'Script Include Instance', 'FAIL', 
                    'Cannot instantiate OpenAIIntegration class',
                    'Check script include import and syntax');
            }
        } catch (e) {
            addResult('Functionality', 'Script Include Test', 'FAIL', 
                'Error testing functionality: ' + e.message,
                'Review script include for syntax errors');
        }
    }
    
    // Run all validations
    gs.info('\n🔍 Starting ServiceNow-OpenAI Integration Validation...\n');
    
    validateSystemProperties();
    validateTables();
    validateScriptComponents();
    validateRolesAndPermissions();
    validateNetworkConnectivity();
    validateFunctionality();
    
    // Generate summary report
    gs.info('\n📊 VALIDATION SUMMARY');
    gs.info('═'.repeat(50));
    gs.info('Total Checks: ' + results.totalChecks);
    gs.info('✅ Passed: ' + results.passed);
    gs.info('❌ Failed: ' + results.failed);
    gs.info('⚠️  Warnings: ' + results.warnings);
    
    var successRate = Math.round((results.passed / results.totalChecks) * 100);
    gs.info('Success Rate: ' + successRate + '%');
    
    if (results.failed === 0) {
        gs.info('\n🎉 Excellent! Your ServiceNow-OpenAI integration is fully deployed and ready to use.');
        gs.info('💡 Next Steps:');
        gs.info('   • Test the integration by creating an incident and using "Analyze with OpenAI"');
        gs.info('   • Review the OpenAI Interactions table for results');
        gs.info('   • Configure auto-analysis settings as needed');
    } else {
        gs.warn('\n⚠️  Some issues were found. Please address the failed checks above.');
        gs.info('💡 Common Solutions:');
        gs.info('   • Re-import the update set if components are missing');
        gs.info('   • Verify system properties are configured correctly');
        gs.info('   • Check network connectivity to api.openai.com');
        gs.info('   • Ensure proper user roles and permissions');
    }
    
    gs.info('\n📋 For detailed setup instructions, refer to the SETUP_GUIDE.md');
    gs.info('🔗 Support: Check the project README for troubleshooting tips');
    
    return results;
})();
