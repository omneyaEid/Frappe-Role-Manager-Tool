frappe.ui.form.on("User", {
    refresh: function (frm) {
        // Check if the current user is the Administrator
        if (frappe.session.user === "Administrator") {
            frm.add_custom_button(
                __("Switch To User"),
                function () {
                    frappe.call({
                        method: 'role_manager_tool.methods.user.switch_to_user',
                        args: {
                            user: frm.doc.name, 
                        },
                        callback: function(response) {
                            if (response.message) {
                                window.location.reload();  // Refresh the page to reflect user switch
                            } else {
                                frappe.msgprint(__("Unable to switch user.")); // Handle case when switching fails
                            }
                        }
                    });
                },
                __("Actions") 
            );
        }
    }
});
