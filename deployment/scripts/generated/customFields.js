// ServiceNow-OpenAI Integration: Custom Fields Setup
// Generated: 2025-05-26T12:49:48.423Z
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
    
    gs.info('\n🎉 Custom fields setup completed!');
    gs.info('💡 The new fields will appear in the "OpenAI Analysis" section of incident forms.');
    gs.info('🔄 You may need to refresh your browser to see the changes.');
})();