// Scheduled Job: OpenAI Batch Processor
// Run: Daily at 2:00 AM
// Description: Process pending OpenAI interactions and cleanup old records

var OpenAIBatchProcessor = Class.create();
OpenAIBatchProcessor.prototype = {
    initialize: function() {
        this.processedCount = 0;
        this.errorCount = 0;
        this.cleanupCount = 0;
    },

    /**
     * Main execution function for scheduled job
     */
    execute: function() {
        gs.info('OpenAI Batch Processor: Starting batch processing...');
        
        try {
            // Process pending interactions
            this.processPendingInteractions();
            
            // Cleanup old interactions
            this.cleanupOldInteractions();
            
            // Generate summary report
            this.generateSummaryReport();
            
            gs.info('OpenAI Batch Processor completed successfully. ' +
                'Processed: ' + this.processedCount + 
                ', Errors: ' + this.errorCount + 
                ', Cleaned up: ' + this.cleanupCount);
                
        } catch (ex) {
            gs.error('OpenAI Batch Processor failed: ' + ex.getMessage());
        }
    },

    /**
     * Process pending OpenAI interactions
     */
    processPendingInteractions: function() {
        var pendingGR = new GlideRecord('x_openai_interaction');
        pendingGR.addQuery('status', 'new');
        pendingGR.addQuery('sys_created_on', '>', 'javascript:gs.daysAgoStart(7)'); // Only process recent records
        pendingGR.orderBy('sys_created_on');
        pendingGR.setLimit(50); // Process max 50 per run to avoid timeouts
        pendingGR.query();
        
        while (pendingGR.next()) {
            try {
                pendingGR.status = 'in_progress';
                pendingGR.update();
                
                var openAI = new OpenAIIntegration();
                var response = openAI.sendPromptToOpenAI(pendingGR.prompt.toString());
                
                pendingGR.response = response;
                pendingGR.status = response.startsWith('Error:') ? 'error' : 'completed';
                pendingGR.update();
                
                this.processedCount++;
                
                // Small delay to avoid rate limiting
                gs.sleep(1000);
                
            } catch (ex) {
                gs.error('Error processing OpenAI interaction ' + pendingGR.getUniqueValue() + ': ' + ex.getMessage());
                pendingGR.status = 'error';
                pendingGR.response = 'Batch processing error: ' + ex.getMessage();
                pendingGR.update();
                this.errorCount++;
            }
        }
    },

    /**
     * Cleanup old OpenAI interaction records
     */
    cleanupOldInteractions: function() {
        // Get cleanup retention period from system property (default 90 days)
        var retentionDays = parseInt(gs.getProperty('openai.interaction.retention_days', '90'));
        
        var oldInteractionsGR = new GlideRecord('x_openai_interaction');
        oldInteractionsGR.addQuery('sys_created_on', '<', 'javascript:gs.daysAgoStart(' + retentionDays + ')');
        oldInteractionsGR.query();
        
        while (oldInteractionsGR.next()) {
            oldInteractionsGR.deleteRecord();
            this.cleanupCount++;
        }
        
        gs.info('Cleaned up ' + this.cleanupCount + ' OpenAI interaction records older than ' + retentionDays + ' days');
    },

    /**
     * Generate usage summary report
     */
    generateSummaryReport: function() {
        // Calculate usage metrics for the last 24 hours
        var startTime = new GlideDateTime();
        startTime.addDaysUTC(-1);
        
        var metricsGR = new GlideAggregate('x_openai_interaction');
        metricsGR.addQuery('sys_created_on', '>', startTime.getDisplayValue());
        metricsGR.addAggregate('COUNT');
        metricsGR.groupBy('status');
        metricsGR.query();
        
        var metrics = {
            completed: 0,
            error: 0,
            in_progress: 0,
            new: 0
        };
        
        while (metricsGR.next()) {
            var status = metricsGR.status.toString();
            var count = parseInt(metricsGR.getAggregate('COUNT'));
            metrics[status] = count;
        }
        
        // Store metrics in system properties for reporting
        gs.setProperty('openai.metrics.last_24h.completed', metrics.completed.toString());
        gs.setProperty('openai.metrics.last_24h.errors', metrics.error.toString());
        gs.setProperty('openai.metrics.last_24h.total', (metrics.completed + metrics.error + metrics.in_progress + metrics.new).toString());
        
        gs.info('OpenAI 24h metrics - Completed: ' + metrics.completed + 
            ', Errors: ' + metrics.error + 
            ', Total: ' + (metrics.completed + metrics.error + metrics.in_progress + metrics.new));
    },

    type: 'OpenAIBatchProcessor'
};

// Execute the batch processor
var processor = new OpenAIBatchProcessor();
processor.execute();
