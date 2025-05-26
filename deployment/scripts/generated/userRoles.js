// ServiceNow-OpenAI Integration: User Roles Configuration
// Generated: 2025-05-26T12:49:48.423Z
//
// This script creates the OpenAI user role and assigns it to specified users.

(function configureUserRoles() {
    var targetUsernames = ["admin","demo.user"];
    
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

    gs.info('\n📊 User Roles Configuration Summary:');
    gs.info('   Role assignments: ' + assigned);
    gs.info('   Already assigned: ' + skipped);
    gs.info('   Errors: ' + errors);
    gs.info('   Total users processed: ' + targetUsernames.length);

    if (errors === 0) {
        gs.info('\n🎉 User roles configured successfully!');
        gs.info('💡 Users with openai_user role can now access OpenAI integration features.');
    } else {
        gs.warn('\n⚠️  Some users had errors. Please check the logs above.');
    }
})();