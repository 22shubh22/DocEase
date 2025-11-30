import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';

// Mock patients for selection
const mockPatients = [
  { id: '1', patientCode: 'PT-0001', fullName: 'Rajesh Kumar', age: 45, phone: '+91 9876543210' },
  { id: '2', patientCode: 'PT-0002', fullName: 'Priya Sharma', age: 32, phone: '+91 9876543211' },
  { id: '3', patientCode: 'PT-0003', fullName: 'Amit Patel', age: 58, phone: '+91 9876543212' },
];

// Common service items
const commonServices = [
  { name: 'Consultation Fee', defaultPrice: 500 },
  { name: 'Follow-up Visit', defaultPrice: 300 },
  { name: 'Blood Test - CBC', defaultPrice: 400 },
  { name: 'Blood Sugar Test', defaultPrice: 150 },
  { name: 'ECG', defaultPrice: 300 },
  { name: 'X-Ray', defaultPrice: 600 },
  { name: 'Injection', defaultPrice: 200 },
  { name: 'Dressing', defaultPrice: 250 },
];

// In-memory invoice storage
const invoiceStore = {
  invoices: [],
  nextInvoiceNumber: 1001,

  add(invoice) {
    const newInvoice = {
      ...invoice,
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${this.nextInvoiceNumber++}`,
      invoiceDate: new Date().toISOString(),
      status: 'UNPAID',
    };
    this.invoices.push(newInvoice);
    return newInvoice;
  },

  getAll() {
    return this.invoices;
  }
};

export default function Billing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId');

  const [selectedPatient, setSelectedPatient] = useState(
    patientIdFromUrl ? mockPatients.find(p => p.id === patientIdFromUrl) : null
  );
  const [items, setItems] = useState([
    { id: 1, description: '', quantity: 1, price: 0, amount: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: {
      patientId: patientIdFromUrl || '',
      paymentMethod: 'CASH',
    }
  });

  const watchedPatientId = watch('patientId');

  // Update selected patient when selection changes
  useState(() => {
    if (watchedPatientId) {
      const patient = mockPatients.find(p => p.id === watchedPatientId);
      setSelectedPatient(patient);
    }
  }, [watchedPatientId]);

  const addItem = () => {
    setItems([...items, {
      id: items.length + 1,
      description: '',
      quantity: 1,
      price: 0,
      amount: 0
    }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated.amount = (updated.quantity || 0) * (updated.price || 0);
        }
        return updated;
      }
      return item;
    }));
  };

  const addCommonService = (service) => {
    const newItem = {
      id: items.length + 1,
      description: service.name,
      quantity: 1,
      price: service.defaultPrice,
      amount: service.defaultPrice
    };
    setItems([...items, newItem]);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.amount || 0), 0);
  };

  const calculateTax = (subtotal, taxRate) => {
    return (subtotal * (taxRate || 0)) / 100;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const taxRate = parseFloat(watch('taxRate') || 0);
    const discount = parseFloat(watch('discount') || 0);
    const tax = calculateTax(subtotal, taxRate);
    return subtotal + tax - discount;
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSuccessMessage('');

    // Validate items
    const validItems = items.filter(item => item.description && item.price > 0);
    if (validItems.length === 0) {
      alert('Please add at least one item with description and price');
      setIsSubmitting(false);
      return;
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const invoiceData = {
        patientId: selectedPatient.id,
        patientName: selectedPatient.fullName,
        patientCode: selectedPatient.patientCode,
        items: validItems,
        subtotal: calculateSubtotal(),
        taxRate: parseFloat(data.taxRate || 0),
        tax: calculateTax(calculateSubtotal(), parseFloat(data.taxRate || 0)),
        discount: parseFloat(data.discount || 0),
        total: calculateTotal(),
        paymentMethod: data.paymentMethod,
        notes: data.notes,
      };

      const newInvoice = invoiceStore.add(invoiceData);

      console.log('Invoice created:', newInvoice);
      console.log('All invoices:', invoiceStore.getAll());

      setSuccessMessage(`Invoice ${newInvoice.invoiceNumber} created successfully!`);

      setTimeout(() => {
        navigate(`/patients/${selectedPatient.id}`);
      }, 1500);

    } catch (error) {
      console.error('Error creating invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Invoice</h1>
        <p className="text-gray-600 mt-1">Generate billing invoice for patient</p>
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Selection */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Patient Information
          </h2>
          <div>
            <label className="label">Select Patient *</label>
            <select
              className="input"
              {...register('patientId', { required: 'Please select a patient' })}
              onChange={(e) => {
                const patient = mockPatients.find(p => p.id === e.target.value);
                setSelectedPatient(patient);
              }}
            >
              <option value="">Choose a patient...</option>
              {mockPatients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.patientCode} - {patient.fullName}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
            )}
          </div>
        </div>

        {/* Quick Add Common Services */}
        <div className="card bg-blue-50 border border-blue-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Add Common Services</h3>
          <div className="flex flex-wrap gap-2">
            {commonServices.map((service, index) => (
              <button
                key={index}
                type="button"
                onClick={() => addCommonService(service)}
                className="px-3 py-1.5 bg-white border border-blue-300 rounded-lg text-sm hover:bg-blue-100 transition-colors"
              >
                {service.name} - ₹{service.defaultPrice}
              </button>
            ))}
          </div>
        </div>

        {/* Invoice Items */}
        <div className="card">
          <div className="flex justify-between items-center mb-4 pb-2 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Invoice Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="btn btn-secondary text-sm"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-lg">
                <div className="col-span-12 sm:col-span-5">
                  <label className="label text-xs">Description *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Service/Item description"
                    value={item.description}
                    onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="label text-xs">Quantity</label>
                  <input
                    type="number"
                    className="input"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="label text-xs">Price (₹)</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="col-span-3 sm:col-span-2">
                  <label className="label text-xs">Amount (₹)</label>
                  <input
                    type="number"
                    className="input bg-gray-100"
                    value={item.amount}
                    disabled
                  />
                </div>
                <div className="col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="px-2 py-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    disabled={items.length === 1}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calculations */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
            Payment Details
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="label">Tax Rate (%)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.01"
                  {...register('taxRate')}
                />
              </div>
              <div>
                <label className="label">Discount (₹)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  min="0"
                  step="0.01"
                  {...register('discount')}
                />
              </div>
              <div>
                <label className="label">Payment Method *</label>
                <select className="input" {...register('paymentMethod')}>
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="NET_BANKING">Net Banking</option>
                  <option value="INSURANCE">Insurance</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax ({watch('taxRate') || 0}%):</span>
                <span className="font-medium">₹{calculateTax(calculateSubtotal(), parseFloat(watch('taxRate') || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">-₹{(parseFloat(watch('discount') || 0)).toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="text-lg font-bold text-gray-900">Total:</span>
                <span className="text-lg font-bold text-primary-600">₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <label className="label">Notes (Optional)</label>
            <textarea
              className="input"
              rows="3"
              placeholder="Additional notes or payment instructions"
              {...register('notes')}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : '✓ Create Invoice'}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            💡 Invoice will be created with status UNPAID. You can mark it as paid later.
          </p>
        </div>
      </form>

      {/* Debug Info */}
      <div className="card mt-6 bg-gray-50">
        <h3 className="font-semibold text-gray-900 mb-2">Debug: Invoices in Memory</h3>
        <p className="text-sm text-gray-600">
          Total invoices created: {invoiceStore.getAll().length}
        </p>
        {invoiceStore.getAll().length > 0 && (
          <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
            {JSON.stringify(invoiceStore.getAll(), null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
