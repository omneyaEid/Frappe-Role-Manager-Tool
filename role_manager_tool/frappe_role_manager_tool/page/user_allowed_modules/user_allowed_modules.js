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
        this.remove_modules();
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
    
        // Create the ModuleEditor instance and attach multicheck to this instance
        const module_editor = new ModuleEditor(dummy_form, html_field[0]);
    
        // Attach multicheck to the class instance (this)
        this.multicheck = module_editor.multicheck;  // Attach directly to this
    
        // Set all options as unchecked by default
        this.multicheck.selected_options = [];
        this.multicheck.refresh_input();
    }

    apply_selected_modules() {
        const multicheck = this.multicheck;
        const selected_users = this.form.get_value('user') || [];
    
        if (!multicheck) {
            console.error('Multicheck field is not initialized');
            return;
        }
    
        // Get checked options from the multicheck
        const selected_modules = multicheck.get_checked_options();
    
        // Debug: Log selected users and modules
        console.log('Selected Users:', selected_users);
        console.log('Selected Modules:', selected_modules);
    
        // If no users are selected, it means apply to all users
        frappe.call({
            method: 'role_manager_tool.methods.modules.add_modules',
            args: {
                users: selected_users,  // Send selected users or empty list for all users
                selected_modules: selected_modules
            },
            callback: (response) => {
                if (response.message) {
                    frappe.msgprint(__('Modules successfully updated for users.'));
                }
            }
        });
    }

    remove_selected_modules() {
        const multicheck = this.multicheck;
        const selected_users = this.form.get_value('user') || [];
    
        if (!multicheck) {
            console.error('Multicheck field is not initialized');
            return;
        }
    
        // Get checked options from the multicheck
        const selected_modules = multicheck.get_checked_options();
    
        // Debug: Log selected users and modules
        console.log('Selected Users:', selected_users);
        console.log('Selected Modules:', selected_modules);
    
        // If no users are selected, it means apply to all users
        frappe.call({
            method: 'role_manager_tool.methods.modules.remove_modules',
            args: {
                users: selected_users,  // Send selected users or empty list for all users
                selected_modules: selected_modules
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
            __("Add Modules"),
            () => this.apply_selected_modules(),
            "small-add"
        );
    }

    remove_modules() {
        this.page.set_secondary_action(
            __("Remove Modules"),
            () => this.remove_selected_modules(),
            "remove"
        );
    }
}

class ModuleEditor {
    constructor(frm, wrapper) {
        this.frm = frm;
        this.wrapper = wrapper;
        this.dirty = false;  // Custom dirty flag to track changes
        const block_modules = this.frm.doc.block_modules.map((row) => row.module);
        
        this.multicheck = frappe.ui.form.make_control({
            parent: wrapper,
            df: {
                fieldname: "block_modules",
                fieldtype: "MultiCheck",
                select_all: true,
                columns: "15rem",
                get_data: () => {
                    return this.frm.doc.__onload.all_modules.map((module) => {
                        return {
                            label: __(module),
                            value: module,
                            checked: !block_modules.includes(module),
                        };
                    });
                },
                on_change: () => {
                    this.set_modules_in_table();
                    this.set_dirty();  // Mark form as dirty when a change is made
                },
            },
            render_input: true,
        });
    }

    // Method to set the dirty flag to true
    set_dirty() {
        this.dirty = true;
        console.log("Form marked as dirty");
    }

    // Optional: Method to reset the dirty flag after saving changes
    reset_dirty() {
        this.dirty = false;
        console.log("Form marked as clean");
    }

    // Method to check if the form is dirty
    is_dirty() {
        return this.dirty;
    }

    show() {
        const block_modules = this.frm.doc.block_modules.map((row) => row.module);
        const all_modules = this.frm.doc.__onload.all_modules;
        this.multicheck.selected_options = all_modules.filter((m) => !block_modules.includes(m));
        this.multicheck.refresh_input();
    }

    set_modules_in_table() {
        let block_modules = this.frm.doc.block_modules || [];
        let unchecked_options = this.multicheck.get_unchecked_options();

        block_modules.map((module_doc) => {
            if (!unchecked_options.includes(module_doc.module)) {
                frappe.model.clear_doc(module_doc.doctype, module_doc.name);
            }
        });

        unchecked_options.map((module) => {
            if (!block_modules.find((d) => d.module === module)) {
                let module_doc = frappe.model.add_child(
                    this.frm.doc,
                    "Block Module",
                    "block_modules"
                );
                module_doc.module = module;
            }
        });
    }
};
