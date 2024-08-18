import frappe 
from frappe.config import get_modules_from_app


@frappe.whitelist()
def get_modules():
	modules_list = []
	for app in frappe.get_installed_apps():
		modules_list += get_modules_from_app(app)
	return modules_list
