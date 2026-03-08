import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../services/api';

const SPECIALTIES = [
  { value: 'dental', label: 'Dental' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'general_physician', label: 'General Physician' },
  { value: 'pediatrics', label: 'Pediatrics' },
  { value: 'orthopedics', label: 'Orthopedics' },
];

const CATEGORIES = [
  { key: 'chief_complaints', label: 'Chief Complaints' },
  { key: 'diagnoses', label: 'Diagnoses' },
  { key: 'observations', label: 'Observations' },
  { key: 'tests', label: 'Tests' },
  { key: 'medicines', label: 'Medicines' },
  { key: 'symptoms', label: 'Symptoms' },
  { key: 'dosages', label: 'Dosages' },
  { key: 'durations', label: 'Durations' },
];

export default function FixtureTemplates() {
  const navigate = useNavigate();
  const [specialty, setSpecialty] = useState('dental');
  const [categories, setCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('chief_complaints');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ name: '', description: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, [specialty]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getFixtureTemplates(specialty);
      setCategories(response.data.categories || {});
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast.error('Failed to load templates');
      setCategories({});
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    setActionLoading(true);
    try {
      const items = categories[activeCategory] || [];
      await adminAPI.createFixtureTemplate({
        specialty,
        category: activeCategory,
        name: newItem.name.trim(),
        description: newItem.description.trim() || null,
        display_order: items.length + 1,
      });
      toast.success('Item added');
      setNewItem({ name: '', description: '' });
      setShowAddForm(false);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to add item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editData.name.trim()) return;
    setActionLoading(true);
    try {
      await adminAPI.updateFixtureTemplate(id, {
        name: editData.name.trim(),
        description: editData.description.trim() || null,
      });
      toast.success('Item updated');
      setEditingId(null);
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to update item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this template item?')) return;
    try {
      await adminAPI.deleteFixtureTemplate(id);
      toast.success('Item deleted');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleReset = async () => {
    if (!confirm(`Reset all ${specialty} templates back to defaults? This will remove any custom changes.`)) return;
    setActionLoading(true);
    try {
      const response = await adminAPI.resetFixtureTemplates(specialty);
      toast.success(response.data.message || 'Templates reset');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to reset templates');
    } finally {
      setActionLoading(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData({ name: item.name, description: item.description || '' });
  };

  const activeItems = categories[activeCategory] || [];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-gray-100 rounded-lg">
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fixture Templates</h1>
          <p className="text-gray-500">Manage default options that get seeded when a new clinic is created</p>
        </div>
      </div>

      {/* Specialty Selector + Reset */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <select
          value={specialty}
          onChange={(e) => {
            setSpecialty(e.target.value);
            setShowAddForm(false);
            setEditingId(null);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
        >
          {SPECIALTIES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <button
          onClick={handleReset}
          disabled={actionLoading}
          className="px-4 py-2 text-sm border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 disabled:opacity-50"
        >
          Reset to Defaults
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Category Tabs */}
          <div className="border-b border-gray-100 overflow-x-auto">
            <div className="flex min-w-max">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveCategory(cat.key);
                    setShowAddForm(false);
                    setEditingId(null);
                  }}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeCategory === cat.key
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {cat.label}
                  <span className="ml-1.5 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                    {(categories[cat.key] || []).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Items List */}
          <div className="divide-y divide-gray-50">
            {activeItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No items for this category. Add one below or use "Reset to Defaults".
              </div>
            ) : (
              activeItems.map((item, idx) => (
                <div key={item.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50">
                  {editingId === item.id ? (
                    /* Edit mode */
                    <div className="flex-1 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={editData.description}
                        onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Description"
                      />
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdate(item.id)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <>
                      <span className="text-xs text-gray-400 w-6 text-right">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => startEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Add Item */}
          <div className="border-t border-gray-100 p-4">
            {showAddForm ? (
              <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Name"
                  autoFocus
                  required
                />
                <input
                  type="text"
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description (optional)"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setNewItem({ name: '', description: '' }); }}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Item
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
