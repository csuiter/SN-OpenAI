/**
 * ServiceNow Update Set Auto-Installer
 * 
 * This script can be run in ServiceNow Scripts - Background to automatically
 * import and commit the OpenAI integration update set.
 * 
 * Instructions:
 * 1. Upload the ServiceNowOpenAIUpdateSet.xml file to your ServiceNow instance
 * 2. Note the sys_id of the uploaded update set
 * 3. Replace 'YOUR_UPDATE_SET_SYS_ID' below with the actual sys_id
 * 4. Run this script in Scripts - Background
 */

(function() {
    var updateSetSysId = 'YOUR_UPDATE_SET_SYS_ID'; // Replace with actual sys_id
    
    try {
        // Find the update set
        var updateSet = new GlideRecord('sys_remote_update_set');
        if (!updateSet.get(updateSetSysId)) {
            gs.error('Update set not found with sys_id: ' + updateSetSysId);
            return;
        }
        
        gs.info('Found update set: ' + updateSet.getValue('name'));
        
        // Check if already committed
        if (updateSet.getValue('state') == 'committed') {
            gs.info('Update set is already committed');
            return;
        }
        
        // Preview the update set first
        if (updateSet.getValue('state') != 'previewed') {
            gs.info('Previewing update set...');
            
            var preview = new UpdateSetPreview();
            preview.previewRemoteUpdateSet(updateSet);
            
            // Wait for preview to complete (you may need to run this script again)
            updateSet.query();
            if (updateSet.next() && updateSet.getValue('state') != 'previewed') {
                gs.info('Update set preview in progress. Please run this script again in a few moments.');
                return;
            }
        }
        
        // Check for conflicts
        var conflicts = new GlideRecord('sys_update_preview_conflict');
        conflicts.addQuery('remote_update_set', updateSetSysId);
        conflicts.query();
        
        if (conflicts.hasNext()) {
            gs.warn('Conflicts detected in update set. Please resolve manually before committing.');
            while (conflicts.next()) {
                gs.warn('Conflict: ' + conflicts.getValue('name') + ' - ' + conflicts.getValue('description'));
            }
            return;
        }
        
        // Commit the update set
        gs.info('Committing update set...');
        var commit = new UpdateSetCommit();
        commit.commitRemoteUpdateSet(updateSet);
        
        gs.info('✅ Update set committed successfully!');
        gs.info('ServiceNow-OpenAI integration components have been installed.');
        
    } catch (error) {
        gs.error('Error during update set installation: ' + error.message);
        gs.error('Stack trace: ' + error.stack);
    }
})();
