# Copyright (c) 2024, omneyaeid827@gmail.com and contributors
# For license information, please see license.txt

import frappe
from frappe.core.page.permission_manager.permission_manager import get_permissions, update, add
from frappe.model.document import Document
from frappe.permissions import rights


class CopyRolesPermissions(Document):
    def validate(self):
        """
        Validate method to ensure the target role is not the same as the source role.
        Throws an error if they are the same.
        """
        if self.target_role == self.source_role:
            frappe.throw("Target Role can't be the same as Source Role")

    def on_update(self):
        """
        on_update method to copy permissions from the source role to the target role
        after the document is saved.
        """
        # Ensure both target and source roles are specified
        if not self.get("target_role") or not self.get("source_role"):
            frappe.throw("Both target and source roles must be specified")

        # Get permissions of the source role
        role_permissions = get_permissions(doctype=self.get("access_doctype"), role=self.source_role)

        # Iterate through each permission and copy it to the target role
        for perm in role_permissions:
            for right in rights:
                if perm.get(right, 0):
                    # Add permission to the target role
                    add(
                        parent=perm.get("parent"),
                        role=self.target_role,
                        permlevel=perm.get("permlevel", 0)
                    )
                    # Update permission with the specific rights and if_owner flag
                    update(
                        doctype=perm.get("parent"),
                        role=self.target_role,
                        permlevel=perm.get("permlevel", 0),
                        ptype=right,
                        value=perm.get(right, 0),
                        if_owner=perm.get("if_owner", 0)
                    )

        frappe.msgprint(f"Permissions from role {self.source_role} have been copied to role {self.target_role}.")
