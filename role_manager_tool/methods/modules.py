import json
import frappe
from frappe import _ 
from frappe.config import get_modules_from_app
from frappe.utils.background_jobs import enqueue


@frappe.whitelist()
def get_modules():
    try:
        modules_list = []
        for app in frappe.get_installed_apps():
            modules_list += get_modules_from_app(app)
        return modules_list
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error in get_modules')
        return {"error": str(e)}


@frappe.whitelist()
def add_modules(users, selected_modules):
    try:
        if isinstance(users, str):
            users = json.loads(users)

        if isinstance(selected_modules, str):
            selected_modules = json.loads(selected_modules)

        if not isinstance(users, list):
            frappe.throw(_("Invalid users input. It should be a list."))

        if not selected_modules:
            frappe.throw(_("No modules selected to apply."))

        if len(users) < 10:
            add_modules_to_users(users, selected_modules)
        else:
            enqueue(add_modules_job, users=users, selected_modules=selected_modules)

        return "done"
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error in add_modules')
        return {"error": str(e)}


@frappe.whitelist()
def remove_modules(users, selected_modules):
    try:
        if isinstance(users, str):
            users = json.loads(users)

        if isinstance(selected_modules, str):
            selected_modules = json.loads(selected_modules)

        if not isinstance(users, list):
            frappe.throw(_("Invalid users input. It should be a list."))

        if not selected_modules:
            frappe.throw(_("No modules selected to remove."))

        if len(users) < 10:
            remove_modules_from_users(users, selected_modules)
        else:
            enqueue(remove_modules_job, users=users, selected_modules=selected_modules)

        return "done"
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error in remove_modules')
        return {"error": str(e)}


def add_modules_to_users(users, selected_modules):
    try:
        if not users:
            users = frappe.get_all('User', filters={'enabled': 1}, pluck='name')

        for user in users:
            user_doc = frappe.get_doc('User', user)
            block_modules = user_doc.get('block_modules', [])

            # Remove the selected modules from block_modules
            updated_block_modules = [bm for bm in block_modules if bm.module not in selected_modules]

            if len(block_modules) != len(updated_block_modules):
                user_doc.set('block_modules', updated_block_modules)
                user_doc.save(ignore_permissions=True)

        frappe.db.commit()
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error in add_modules_to_users')
        raise  # Raise to propagate error


def add_modules_job(users, selected_modules):
    add_modules_to_users(users, selected_modules)


def remove_modules_from_users(users, selected_modules):
    try:
        if not users:
            users = frappe.get_all('User', filters={'enabled': 1}, pluck='name')

        for user in users:
            user_doc = frappe.get_doc('User', user)
            block_modules = user_doc.get('block_modules', [])

            # Create a set for easy lookup of currently blocked modules
            block_modules_set = {bm.module for bm in block_modules}

            # Add selected modules to block_modules if not already blocked
            for selected_module in selected_modules:
                if selected_module not in block_modules_set:
                    # Append to the block_modules child table
                    new_module_doc = user_doc.append("block_modules")
                    new_module_doc.module = selected_module

            user_doc.save(ignore_permissions=True)

        frappe.db.commit()

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), 'Error in remove_modules_from_users')
        raise  # Raise to propagate error

	
def remove_modules_job(users, selected_modules):
    remove_modules_from_users(users, selected_modules)
