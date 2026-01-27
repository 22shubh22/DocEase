import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { permissionsAPI } from '../../services/api';

const PERMISSION_GROUPS = [
  {
    title: 'Patient Management',
    permissions: [
      { key: 'can_view_patients', label: 'View patients' },
      { key: 'can_create_patients', label: 'Create patients' },
      { key: 'can_edit_patients', label: 'Edit patients' },
      { key: 'can_delete_patients', label: 'Delete patients' },
    ],
  },
  {
    title: 'OPD Management',
    permissions: [
      { key: 'can_view_opd', label: 'View OPD queue' },
      { key: 'can_manage_opd', label: 'Manage OPD (add/update)' },
    ],
  },
  {
    title: 'Visit Management',
    permissions: [
      { key: 'can_view_visits', label: 'View visits' },
      { key: 'can_create_visits', label: 'Create visits' },
      { key: 'can_edit_visits', label: 'Edit visits' },
    ],
  },
  {
    title: 'Billing',
    permissions: [
      { key: 'can_view_invoices', label: 'View invoices' },
      { key: 'can_create_invoices', label: 'Create invoices' },
      { key: 'can_edit_invoices', label: 'Edit invoices' },
      { key: 'can_view_collections', label: 'View collections' },
    ],
  },
  {
    title: 'Settings',
    permissions: [
      { key: 'can_manage_clinic_options', label: 'Manage clinic options' },
      { key: 'can_edit_print_settings', label: 'Edit print settings' },
    ],
  },
];

export default function PermissionsManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState(null);
  const [saving, setSaving] = useState(false);

  const modalRef = useRef(null);
  const triggerButtonRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  // Focus trap, escape key handling, and body scroll lock for modal
  useEffect(() => {
    if (!selectedUser) return;

    const modal = modalRef.current;
    if (!modal) return;

    const handleKeyDown = (e) => {
      // Handle Escape key
      if (e.key === 'Escape' && !saving) {
        handleCloseModal();
        return;
      }

      // Handle Tab for focus trap
      if (e.key !== 'Tab') return;

      const focusableSelector = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const focusableElements = Array.from(modal.querySelectorAll(focusableSelector));

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus the first focusable element in the modal
    setTimeout(() => {
      const firstFocusable = modal.querySelector('button:not([disabled])');
      firstFocusable?.focus();
    }, 0);

    // Prevent body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedUser, saving]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await permissionsAPI.getClinicUsers();
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load team members');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (user) => {
    setSelectedUser(user);

    // Get permissions - use existing or create defaults
    if (user.permissions) {
      setEditingPermissions({ ...user.permissions });
    } else {
      // Use role defaults
      const defaults = user.role === 'DOCTOR' ? {
        can_view_patients: true,
        can_create_patients: true,
        can_edit_patients: true,
        can_delete_patients: true,
        can_view_opd: true,
        can_manage_opd: true,
        can_view_visits: true,
        can_create_visits: true,
        can_edit_visits: true,
        can_view_invoices: true,
        can_create_invoices: true,
        can_edit_invoices: true,
        can_view_collections: true,
        can_manage_clinic_options: true,
        can_edit_print_settings: true,
      } : {
        can_view_patients: true,
        can_create_patients: true,
        can_edit_patients: true,
        can_delete_patients: false,
        can_view_opd: true,
        can_manage_opd: true,
        can_view_visits: true,
        can_create_visits: false,
        can_edit_visits: false,
        can_view_invoices: true,
        can_create_invoices: true,
        can_edit_invoices: true,
        can_view_collections: true,
        can_manage_clinic_options: false,
        can_edit_print_settings: false,
      };
      setEditingPermissions(defaults);
    }
  };

  const handleTogglePermission = (key) => {
    setEditingPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePermissions = async () => {
    if (!selectedUser || !editingPermissions) return;

    try {
      setSaving(true);
      await permissionsAPI.updateUserPermissions(selectedUser.id, editingPermissions);
      toast.success('Permissions updated successfully');
      setSelectedUser(null);
      setEditingPermissions(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to update permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      await permissionsAPI.resetToDefaults(selectedUser.id);
      toast.success('Permissions reset to defaults');
      setSelectedUser(null);
      setEditingPermissions(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to reset permissions');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setEditingPermissions(null);
    // Return focus to the trigger button
    setTimeout(() => {
      triggerButtonRef.current?.focus();
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Team Permissions</h3>
          <p className="mt-1 text-sm text-gray-500">
            Manage what your team members can access and do
          </p>
        </div>
      </div>

      {/* User List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-600 font-medium">
                        {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {user.full_name}
                        {user.is_owner && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            Owner
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'DOCTOR'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                    role="status"
                    aria-label={`User is ${user.is_active ? 'active' : 'inactive'}`}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {user.is_owner ? (
                    <span className="text-gray-400">Full Access</span>
                  ) : (
                    <button
                      ref={triggerButtonRef}
                      onClick={() => handleEditUser(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit Permissions
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No team members found
          </div>
        )}
      </div>

      {/* Edit Permissions Modal */}
      {selectedUser && editingPermissions && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="permissions-modal-title"
        >
          <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 id="permissions-modal-title" className="text-lg font-medium text-gray-900">
                  Edit Permissions: {selectedUser.full_name}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {selectedUser.role} - {selectedUser.email}
              </p>
            </div>

            <div className="px-6 py-4 space-y-6">
              {PERMISSION_GROUPS.map((group) => (
                <div key={group.title} className="space-y-3">
                  <h4 className="font-medium text-gray-900">{group.title}</h4>
                  <div className="space-y-2">
                    {group.permissions.map((permission) => (
                      <div
                        key={permission.key}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50"
                      >
                        <span id={`label-${permission.key}`} className="text-sm text-gray-700">
                          {permission.label}
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={editingPermissions[permission.key]}
                          aria-labelledby={`label-${permission.key}`}
                          onClick={() => handleTogglePermission(permission.key)}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            editingPermissions[permission.key] ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              editingPermissions[permission.key] ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={handleResetToDefaults}
                disabled={saving}
                className="text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Reset to Defaults
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCloseModal}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePermissions}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {saving && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
