import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

// Validation constraints
const MIN_DISPLAY_ORDER = 1;
const MAX_DISPLAY_ORDER = 999;

export default function OptionManager({
  title,
  description,
  api,
  emptyIcon = '📋',
  tipText,
  singularName = 'option',
}) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOption, setEditingOption] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', display_order: 1 });

  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Form validation errors
  const [formErrors, setFormErrors] = useState({});

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    option: null,
    isLoading: false,
  });

  // Toggle confirmation modal state
  const [toggleModal, setToggleModal] = useState({
    isOpen: false,
    option: null,
  });

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    setLoading(true);
    try {
      const response = await api.getAll(false);
      setOptions(response.data || []);
    } catch (error) {
      console.error(`Failed to fetch ${title.toLowerCase()}:`, error);
      toast.error(`Failed to load ${title.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!form.name.trim()) {
      errors.name = `${singularName.charAt(0).toUpperCase() + singularName.slice(1)} name is required`;
    }
    if (form.display_order < MIN_DISPLAY_ORDER || form.display_order > MAX_DISPLAY_ORDER) {
      errors.display_order = `Display order must be between ${MIN_DISPLAY_ORDER} and ${MAX_DISPLAY_ORDER}`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form field changes
  const handleFormChange = (field, value) => {
    setForm({ ...form, [field]: value });
    setHasUnsavedChanges(true);
    // Clear specific field error
    if (formErrors[field]) {
      setFormErrors({ ...formErrors, [field]: null });
    }
  };

  // Handle display order with clamping
  const handleDisplayOrderChange = (value) => {
    const numValue = parseInt(value) || MIN_DISPLAY_ORDER;
    const clampedValue = Math.max(MIN_DISPLAY_ORDER, Math.min(MAX_DISPLAY_ORDER, numValue));
    handleFormChange('display_order', clampedValue);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      await api.create({
        name: form.name,
        description: form.description,
        display_order: form.display_order || options.length + 1,
        is_active: true,
      });
      toast.success(`${singularName.charAt(0).toUpperCase() + singularName.slice(1)} added`);
      resetForm();
      fetchOptions();
    } catch (error) {
      console.error(`Failed to add ${singularName}:`, error);
      toast.error(error.errorMessage || `Failed to add ${singularName}`);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      await api.update(editingOption.id, {
        name: form.name,
        description: form.description,
        display_order: form.display_order,
        is_active: editingOption.is_active,
      });
      toast.success(`${singularName.charAt(0).toUpperCase() + singularName.slice(1)} updated`);
      resetForm();
      fetchOptions();
    } catch (error) {
      console.error(`Failed to update ${singularName}:`, error);
      toast.error(error.errorMessage || `Failed to update ${singularName}`);
    }
  };

  // Show confirmation before toggle
  const handleToggle = (option) => {
    setToggleModal({
      isOpen: true,
      option,
    });
  };

  // Confirm toggle action
  const confirmToggle = async () => {
    const option = toggleModal.option;
    if (!option) return;

    try {
      await api.update(option.id, {
        name: option.name,
        description: option.description,
        display_order: option.display_order,
        is_active: !option.is_active,
      });
      toast.success(option.is_active ? `${singularName.charAt(0).toUpperCase() + singularName.slice(1)} deactivated` : `${singularName.charAt(0).toUpperCase() + singularName.slice(1)} activated`);
      fetchOptions();
    } catch (error) {
      console.error(`Failed to toggle ${singularName}:`, error);
      toast.error(error.errorMessage || `Failed to update ${singularName} status`);
    } finally {
      setToggleModal({ isOpen: false, option: null });
    }
  };

  const handleDelete = (option) => {
    setDeleteModal({
      isOpen: true,
      option,
      isLoading: false,
    });
  };

  const confirmDelete = async () => {
    const option = deleteModal.option;
    if (!option) return;

    setDeleteModal(prev => ({ ...prev, isLoading: true }));
    try {
      await api.delete(option.id);
      toast.success(`${singularName.charAt(0).toUpperCase() + singularName.slice(1)} deleted`);
      setDeleteModal({ isOpen: false, option: null, isLoading: false });
      fetchOptions();
    } catch (error) {
      console.error(`Failed to delete ${singularName}:`, error);
      toast.error(error.errorMessage || `Failed to delete ${singularName}`);
      setDeleteModal(prev => ({ ...prev, isLoading: false }));
    }
  };

  const startEdit = (option) => {
    setEditingOption(option);
    setForm({
      name: option.name,
      description: option.description || '',
      display_order: option.display_order,
    });
    setShowAddForm(false);
    setHasUnsavedChanges(false);
    setFormErrors({});
  };

  // Reset form state
  const resetForm = () => {
    setShowAddForm(false);
    setEditingOption(null);
    setForm({ name: '', description: '', display_order: 1 });
    setHasUnsavedChanges(false);
    setFormErrors({});
  };

  // Cancel with unsaved changes check
  const cancelForm = () => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
      return;
    }
    resetForm();
  };

  // Confirm discard changes
  const confirmDiscard = () => {
    setShowDiscardModal(false);
    resetForm();
  };

  // Bulk selection handlers
  const toggleSelection = (id) => {
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedIds(newSelection);
    setShowBulkActions(newSelection.size > 0);
  };

  const selectAll = () => {
    if (selectedIds.size === options.length) {
      setSelectedIds(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedIds(new Set(options.map(o => o.id)));
      setShowBulkActions(true);
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setShowBulkActions(false);
  };

  const bulkToggleActive = async (activate) => {
    try {
      for (const id of selectedIds) {
        const option = options.find(o => o.id === id);
        if (option && option.is_active !== activate) {
          await api.update(id, { ...option, is_active: activate });
        }
      }
      toast.success(`${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''} ${activate ? 'activated' : 'deactivated'}`);
      clearSelection();
      fetchOptions();
    } catch (error) {
      toast.error('Failed to update some items');
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center justify-between mb-4 pb-2 border-b">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingOption(null);
              setForm({ name: '', description: '', display_order: options.length + 1 });
              setHasUnsavedChanges(false);
              setFormErrors({});
            }}
            className="btn btn-primary"
          >
            + Add {singularName.charAt(0).toUpperCase() + singularName.slice(1)}
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">{description}</p>

        {/* Add/Edit Form */}
        {(showAddForm || editingOption) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-3">
              {editingOption ? `Edit ${singularName.charAt(0).toUpperCase() + singularName.slice(1)}` : `Add New ${singularName.charAt(0).toUpperCase() + singularName.slice(1)}`}
            </h3>
            <form onSubmit={editingOption ? handleUpdate : handleAdd} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="label">{singularName.charAt(0).toUpperCase() + singularName.slice(1)} Name *</label>
                  <input
                    type="text"
                    className={`input ${formErrors.name ? 'border-red-500' : ''}`}
                    placeholder={`e.g., ${title} example`}
                    value={form.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    aria-invalid={!!formErrors.name}
                    aria-describedby={formErrors.name ? 'name-error' : undefined}
                  />
                  {formErrors.name && (
                    <p id="name-error" className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div>
                  <label className="label">Display Order</label>
                  <input
                    type="number"
                    className={`input ${formErrors.display_order ? 'border-red-500' : ''}`}
                    placeholder="1"
                    min={MIN_DISPLAY_ORDER}
                    max={MAX_DISPLAY_ORDER}
                    value={form.display_order}
                    onChange={(e) => handleDisplayOrderChange(e.target.value)}
                    aria-invalid={!!formErrors.display_order}
                    aria-describedby="display-order-help"
                  />
                  {formErrors.display_order ? (
                    <p className="text-red-500 text-sm mt-1">{formErrors.display_order}</p>
                  ) : (
                    <p id="display-order-help" className="text-xs text-gray-500 mt-1">{MIN_DISPLAY_ORDER}-{MAX_DISPLAY_ORDER}, lower numbers appear first</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="label">Description (Optional)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Brief description"
                    value={form.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <button type="submit" className="btn btn-primary">
                  {editingOption ? 'Update' : 'Add'}
                </button>
                <button type="button" onClick={cancelForm} className="btn btn-secondary">
                  Cancel
                </button>
                {hasUnsavedChanges && (
                  <span className="text-xs text-amber-600">Unsaved changes</span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
            <span className="text-sm text-blue-800 font-medium">{selectedIds.size} selected</span>
            <button
              onClick={() => bulkToggleActive(true)}
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              Activate All
            </button>
            <button
              onClick={() => bulkToggleActive(false)}
              className="text-sm text-yellow-600 hover:text-yellow-700 font-medium"
            >
              Deactivate All
            </button>
            <button
              onClick={clearSelection}
              className="text-sm text-gray-600 hover:text-gray-700"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading {title.toLowerCase()}...</p>
          </div>
        ) : options.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">{emptyIcon}</div>
            <p>No {title.toLowerCase()} configured</p>
            <p className="text-sm mt-1">Add {title.toLowerCase()} to show them in the dropdown</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Select All Header */}
            {options.length > 1 && (
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
                <input
                  type="checkbox"
                  checked={selectedIds.size === options.length}
                  onChange={selectAll}
                  className="rounded border-gray-300"
                  aria-label="Select all items"
                />
                <span>Select all</span>
              </div>
            )}
            {options.map((option) => (
              <div
                key={option.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  option.is_active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-60'
                } ${selectedIds.has(option.id) ? 'ring-2 ring-blue-200' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(option.id)}
                    onChange={() => toggleSelection(option.id)}
                    className="rounded border-gray-300"
                    aria-label={`Select ${option.name}`}
                  />
                  <span className="text-sm text-gray-400 w-8">#{option.display_order}</span>
                  <div>
                    <span className={`font-medium ${option.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
                      {option.name}
                    </span>
                    {option.description && (
                      <p className="text-sm text-gray-500">{option.description}</p>
                    )}
                  </div>
                  {option.is_active ? (
                    <span className="sr-only">Active</span>
                  ) : (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded inline-flex items-center gap-1" role="status">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Inactive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(option)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggle(option)}
                    className={`text-sm ${option.is_active ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                  >
                    {option.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(option)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tip Card */}
      {tipText && (
        <div className="card bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> {tipText}
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, option: null, isLoading: false })}
        onConfirm={confirmDelete}
        title={`Delete ${singularName.charAt(0).toUpperCase() + singularName.slice(1)}`}
        message={`Are you sure you want to delete "${deleteModal.option?.name}"? This action cannot be undone.`}
        isLoading={deleteModal.isLoading}
      />

      {/* Discard Changes Confirmation Modal */}
      <ConfirmModal
        isOpen={showDiscardModal}
        onClose={() => setShowDiscardModal(false)}
        onConfirm={confirmDiscard}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        confirmText="Discard"
        confirmButtonClass="bg-yellow-600 hover:bg-yellow-700 text-white"
      />

      {/* Toggle Status Confirmation Modal */}
      <ConfirmModal
        isOpen={toggleModal.isOpen}
        onClose={() => setToggleModal({ isOpen: false, option: null })}
        onConfirm={confirmToggle}
        title={toggleModal.option?.is_active ? 'Deactivate Item?' : 'Activate Item?'}
        message={`Are you sure you want to ${toggleModal.option?.is_active ? 'deactivate' : 'activate'} "${toggleModal.option?.name}"?`}
        confirmText={toggleModal.option?.is_active ? 'Deactivate' : 'Activate'}
        confirmButtonClass={toggleModal.option?.is_active ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}
      />
    </div>
  );
}
