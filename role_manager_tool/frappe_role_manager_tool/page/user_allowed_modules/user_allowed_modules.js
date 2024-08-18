frappe.pages['user-allowed-modules'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'User Allowed Modules',
        single_column: true,
    });
    new AllowedModules(page);
}

class AllowedModules {
    constructor(page) {
        this.page = page;
        this.make_form();
        this.save_action();
    }

    make_form() {
        this.form = new frappe.ui.FieldGroup({
            fields: [
                {
                    label: __("Users"),
                    fieldname: "user",
                    fieldtype: "MultiSelectList",
                    options: "User",
                    get_data: function (txt) {
                        return frappe.db.get_link_options("User", txt);
                    },
                },
                {
                    fieldtype: "Column Break",
                },
                {
                    fieldtype: "Section Break",
                },
                {
                    fieldtype: "HTML",
                    fieldname: "preview",
                },
            ],
            body: this.page.body,
        });
        this.form.make();
        this.get_all_modules();
    }

    get_all_modules() {
        frappe.call({
            method: 'role_manager_tool.methods.modules.get_modules',
            callback: (response) => {
                const all_modules = response.message;
                this.render_module_editor(all_modules);
            }
        });
    }

    render_module_editor(all_modules) {
        // Get the HTML field
        const html_field = this.form.fields_dict['preview'].$wrapper;

        // Create a dummy form to pass to ModuleEditor
        const dummy_form = {
            doc: {
                block_modules: [], // Initialize with empty array or relevant data
                __onload: {
                    all_modules: all_modules.map(module => module.module_name) // Map to your module structure
                }
            }
        };

        // Create the ModuleEditor instance
        const module_editor = new frappe.ModuleEditor(dummy_form, html_field[0]);

        // Set all options as unchecked by default
        module_editor.multicheck.selected_options = [];
        module_editor.multicheck.refresh_input();
    }

    apply_selected_modules() {
        // Get the Multicheck field from the form
        const multicheck = this.form.fields_dict['preview'].multicheck;

        if (!multicheck) {
            console.error('Multicheck field is not initialized');
            return;
        }

        // Get checked options from the multicheck
        const checked_options = multicheck.get_checked_options();

        // Debug: Log checked options
        console.log('Checked Options:', checked_options);

        // Apply the selected modules to the users
        frappe.call({
            method: 'role_manager_tool.methods.modules.apply_modules',
            args: {
                selected_modules: checked_options
            },
            callback: (response) => {
                if (response.message) {
                    frappe.msgprint(__('Modules successfully updated for users.'));
                }
            }
        });
    }

    save_action() {
        this.page.set_primary_action(
            __("Apply"),
            () => this.apply_selected_modules(),
            "small-add"
        );
    }
}
