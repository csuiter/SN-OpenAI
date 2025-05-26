// ServiceNow-OpenAI Integration: Auto-Analysis Configuration
// Generated: 2025-05-26T12:49:48.423Z
//
// This script configures automatic analysis settings and business rules.

(function configureAutoAnalysis() {
    var autoAnalysisEnabled = true;
    
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
        gs.info('\n🎯 Auto-analysis will trigger for:');
        triggers.forEach(function(trigger) {
            gs.info('   • ' + trigger.description);
        });
        
        gs.info('\n📊 Analysis will include:');
        gs.info('   • Root cause analysis');
        gs.info('   • Resolution suggestions');
        gs.info('   • Knowledge article recommendations');
        gs.info('   • Impact and urgency assessment');
        
        gs.info('\n⚙️  To customize triggers, modify the business rule conditions.');
    } else {
        gs.info('\n🔇 Auto-analysis is disabled. Users can still trigger manual analysis.');
    }
    
    // Set up analysis categories
    var categories = [
        'technical_issue',
        'user_request', 
        'access_problem',
        'performance_issue',
        'application_error'
    ];
    
    gs.info('\n📝 Supported analysis categories: ' + categories.join(', '));
    
    gs.info('\n🎉 Auto-analysis configuration completed!');
    
    if (autoAnalysisEnabled) {
        gs.info('💡 Create a new incident to test the auto-analysis feature.');
    } else {
        gs.info('💡 Use the "Analyze with OpenAI" button for manual analysis.');
    }
})();