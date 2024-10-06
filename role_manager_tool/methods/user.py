import frappe
from frappe.auth import LoginManager


@frappe.whitelist()
def switch_to_user(user):
    """Switch to another user's account if the current user is a superadmin."""
    
    # Check if the current user is a superadmin (Administrator)
    if frappe.session.user != "Administrator":
        frappe.throw(_("Only the Administrator can switch users."))

    # Attempt to switch to the specified user
    login_manager = LoginManager()
    
    # Clear cache for the current user
    frappe.clear_cache(user=frappe.session.user)

    # Switch user using the LoginManager
    try:
        login_manager.login_as(user)  # Log in as the specified user
        login_manager.post_login()  # Handle post-login processes
        login_manager.make_session()  # Create a new session
        login_manager.set_user_info()  # Set user information in session
        
        # Set a response message
        frappe.local.response["message"] = f"Switched to {user} successfully."
        frappe.local.response["home_page"] = "/app"  # Redirect to the app home page
    except Exception as e:
        frappe.throw(str(e))
