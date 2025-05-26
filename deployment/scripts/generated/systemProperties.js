// ServiceNow-OpenAI Integration: System Properties Configuration
// Generated: 2025-05-26T12:49:48.423Z
// 
// This script configures all required and optional system properties
// for the ServiceNow-OpenAI integration.

(function configureSystemProperties() {
    var properties = [
        {
            name: 'openai.api_key',
            value: 'sk-demo123',
            description: 'OpenAI API key for ServiceNow integration',
            type: 'password',
            suffix: 'password'
        },
        {
            name: 'openai.auto_analysis_enabled',
            value: 'true',
            description: 'Enable automatic incident analysis with OpenAI',
            type: 'boolean',
            suffix: 'boolean'
        },
        {
            name: 'openai.timeout_seconds',
            value: '30',
            description: 'Timeout for OpenAI API requests in seconds',
            type: 'integer',
            suffix: 'integer'
        },
        {
            name: 'openai.max_retries',
            value: '3',
            description: 'Maximum retry attempts for OpenAI API calls',
            type: 'integer',
            suffix: 'integer'
        },
        {
            name: 'openai.model',
            value: 'gpt-3.5-turbo',
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

    gs.info('\n📊 System Properties Configuration Summary:');
    gs.info('   Created: ' + created);
    gs.info('   Updated: ' + updated);
    gs.info('   Errors: ' + errors);
    gs.info('   Total: ' + properties.length);

    if (errors === 0) {
        gs.info('\n🎉 All system properties configured successfully!');
    } else {
        gs.warn('\n⚠️  Some properties had errors. Please check the logs above.');
    }
})();