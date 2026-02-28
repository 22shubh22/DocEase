# Frontend Development Guide

## ✅ Completed Components

1. **Authentication**
   - ✅ `src/store/authStore.js` - Zustand auth store
   - ✅ `src/pages/Login.jsx` - Login page
   - ✅ `src/App.jsx` - Main app with routing
   - ✅ `src/services/api.js` - API client

2. **Layout**
   - ✅ `src/components/layout/DashboardLayout.jsx` - Main layout with sidebar
   - ✅ `src/pages/Dashboard.jsx` - Dashboard home page

3. **Configuration**
   - ✅ Vite setup
   - ✅ Tailwind CSS
   - ✅ React Query
   - ✅ React Router

## 📝 Components to Create

### 1. Patients Module

Create `src/pages/patients/PatientsList.jsx`:
```jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { patientsAPI } from '../../services/api';

export default function PatientsList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['patients', { page, search }],
    queryFn: () => search
      ? patientsAPI.search(search).then(res => res.data)
      : patientsAPI.getAll({ page, limit: 20 }).then(res => res.data),
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Patients</h1>
        <Link to="/patients/new" className="btn btn-primary">
          Add Patient
        </Link>
      </div>

      <div className="card">
        <input
          type="text"
          placeholder="Search by name, phone..."
          className="input mb-4"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Patient Code</th>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Age/Gender</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.patients?.map((patient) => (
                <tr key={patient.id}>
                  <td className="px-4 py-3">{patient.patientCode}</td>
                  <td className="px-4 py-3">{patient.fullName}</td>
                  <td className="px-4 py-3">{patient.phone}</td>
                  <td className="px-4 py-3">{patient.age} / {patient.gender}</td>
                  <td className="px-4 py-3">
                    <Link to={`/patients/${patient.id}`} className="text-primary-600">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

### 2. Patient Form

Create `src/pages/patients/PatientForm.jsx`:
```jsx
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { patientsAPI } from '../../services/api';

export default function PatientForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const mutation = useMutation({
    mutationFn: (data) => patientsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['patients']);
      navigate('/patients');
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Add New Patient</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Full Name *</label>
            <input
              className="input"
              {...register('fullName', { required: true })}
            />
            {errors.fullName && <span className="text-red-500 text-sm">Required</span>}
          </div>

          <div>
            <label className="label">Phone *</label>
            <input
              className="input"
              {...register('phone', { required: true })}
            />
            {errors.phone && <span className="text-red-500 text-sm">Required</span>}
          </div>

          <div>
            <label className="label">Age</label>
            <input
              type="number"
              className="input"
              {...register('age')}
            />
          </div>

          <div>
            <label className="label">Gender</label>
            <select className="input" {...register('gender')}>
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="label">Blood Group</label>
            <input className="input" {...register('bloodGroup')} />
          </div>

          <div>
            <label className="label">Emergency Contact</label>
            <input className="input" {...register('emergencyContact')} />
          </div>
        </div>

        <div>
          <label className="label">Address</label>
          <textarea className="input" rows="3" {...register('address')} />
        </div>

        <div className="flex gap-4">
          <button type="submit" className="btn btn-primary">
            Save Patient
          </button>
          <button
            type="button"
            onClick={() => navigate('/patients')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
```

### 3. OPD Queue

Create `src/pages/opd/OPDQueue.jsx`:
```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opdAPI } from '../../services/api';
import { format } from 'date-fns';

export default function OPDQueue() {
  const queryClient = useQueryClient();

  const { data: queue } = useQuery({
    queryKey: ['opdQueue'],
    queryFn: () => opdAPI.getQueue().then(res => res.data),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }) => opdAPI.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['opdQueue']);
    },
  });

  const getStatusBadge = (status) => {
    const badges = {
      WAITING: 'badge badge-warning',
      IN_PROGRESS: 'badge badge-info',
      COMPLETED: 'badge badge-success',
    };
    return badges[status] || 'badge';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Today's OPD Queue</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-gray-600">Total</p>
          <p className="text-3xl font-bold">{queue?.appointments?.length || 0}</p>
        </div>
        <div className="card">
          <p className="text-gray-600">Waiting</p>
          <p className="text-3xl font-bold text-yellow-600">
            {queue?.appointments?.filter(a => a.status === 'WAITING').length || 0}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-600">Completed</p>
          <p className="text-3xl font-bold text-green-600">
            {queue?.appointments?.filter(a => a.status === 'COMPLETED').length || 0}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="space-y-4">
          {queue?.appointments?.map((appointment) => (
            <div
              key={appointment.id}
              className="border rounded-lg p-4 flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-lg">
                  #{appointment.queueNumber} - {appointment.patient.fullName}
                </p>
                <p className="text-gray-600">{appointment.patient.phone}</p>
                <span className={getStatusBadge(appointment.status)}>
                  {appointment.status}
                </span>
              </div>

              <div className="flex gap-2">
                {appointment.status === 'WAITING' && (
                  <button
                    onClick={() => updateStatus.mutate({
                      id: appointment.id,
                      status: 'IN_PROGRESS'
                    })}
                    className="btn btn-primary btn-sm"
                  >
                    Start Consultation
                  </button>
                )}
                {appointment.status === 'IN_PROGRESS' && (
                  <button
                    onClick={() => updateStatus.mutate({
                      id: appointment.id,
                      status: 'COMPLETED'
                    })}
                    className="btn btn-primary btn-sm"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 4. Settings Page

Create `src/pages/Settings.jsx`:
```jsx
import { useQuery } from '@tanstack/react-query';
import { clinicAPI } from '../services/api';
import useAuthStore from '../store/authStore';

export default function Settings() {
  const { user } = useAuthStore();

  const { data: clinic } = useQuery({
    queryKey: ['clinic'],
    queryFn: () => clinicAPI.getInfo().then(res => res.data),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Clinic Information</h2>
        <div className="space-y-3">
          <div>
            <p className="text-gray-600">Clinic Name</p>
            <p className="font-medium">{clinic?.clinic?.name}</p>
          </div>
          <div>
            <p className="text-gray-600">Address</p>
            <p className="font-medium">{clinic?.clinic?.address}</p>
          </div>
          <div>
            <p className="text-gray-600">Phone</p>
            <p className="font-medium">{clinic?.clinic?.phone}</p>
          </div>
          <div>
            <p className="text-gray-600">Email</p>
            <p className="font-medium">{clinic?.clinic?.email}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
        <div className="space-y-3">
          <div>
            <p className="text-gray-600">Name</p>
            <p className="font-medium">{user?.fullName}</p>
          </div>
          <div>
            <p className="text-gray-600">Email</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div>
            <p className="text-gray-600">Role</p>
            <p className="font-medium capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 🚀 Quick Implementation Steps

1. Create all the page files listed above
2. Create placeholder components for remaining pages:
   - `PatientDetails.jsx`
   - `VisitForm.jsx`
   - `PrescriptionForm.jsx`
   - `Billing.jsx`
   - `InvoiceForm.jsx`

3. Add simple placeholder components:
```jsx
export default function PlaceholderPage() {
  return (
    <div className="card">
      <h1 className="text-2xl font-bold">Coming Soon</h1>
      <p className="text-gray-600 mt-2">This feature is under development</p>
    </div>
  );
}
```

4. Test the application:
```bash
cd frontend
npm install
npm run dev
```

5. Login with demo credentials and test navigation

## 📦 Additional UI Components Needed

Create `src/components/ui/LoadingSpinner.jsx`, `Modal.jsx`, `Alert.jsx` as reusable components.

## 🎯 Priority Order

1. ✅ Dashboard (Done)
2. ✅ Layout (Done)
3. **Next**: Patients List & Form
4. **Then**: OPD Queue
5. **Then**: Settings
6. **Finally**: Billing, Prescriptions, Visits

Follow this guide to complete the frontend. Each component follows the same pattern with React Query for data fetching and React Hook Form for forms.
