import { useQuery } from '@tanstack/react-query';
import { opdAPI, patientsAPI } from '../services/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['opdStats'],
    queryFn: () => opdAPI.getStats().then(res => res.data),
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients', { page: 1, limit: 5 }],
    queryFn: () => patientsAPI.getAll({ page: 1, limit: 5 }).then(res => res.data),
  });

  const statsCards = [
    {
      title: 'Today\'s Appointments',
      value: stats?.totalAppointments || 0,
      icon: '📅',
      color: 'bg-blue-50 text-blue-700',
    },
    {
      title: 'Completed',
      value: stats?.completedAppointments || 0,
      icon: '✅',
      color: 'bg-green-50 text-green-700',
    },
    {
      title: 'Pending',
      value: stats?.pendingAppointments || 0,
      icon: '⏳',
      color: 'bg-yellow-50 text-yellow-700',
    },
    {
      title: 'Today\'s Revenue',
      value: `₹${stats?.totalRevenue || 0}`,
      icon: '💰',
      color: 'bg-purple-50 text-purple-700',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/opd" className="btn btn-primary mt-4 sm:mt-0">
          View OPD Queue
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`text-4xl ${stat.color} p-3 rounded-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Patients */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Patients</h2>
          <Link to="/patients" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient Code</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age/Gender</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {patientsData?.patients?.map((patient) => (
                <tr key={patient.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{patient.patient_code || patient.patientCode}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{patient.full_name || patient.fullName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{patient.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{patient.age} / {patient.gender}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/patients/new" className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-center py-4">
            <div className="text-4xl mb-2">➕</div>
            <h3 className="font-semibold text-gray-900">Add New Patient</h3>
          </div>
        </Link>
        <Link to="/opd" className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🏥</div>
            <h3 className="font-semibold text-gray-900">Manage OPD Queue</h3>
          </div>
        </Link>
        <Link to="/billing/new" className="card hover:shadow-md transition-shadow cursor-pointer">
          <div className="text-center py-4">
            <div className="text-4xl mb-2">💳</div>
            <h3 className="font-semibold text-gray-900">Create Invoice</h3>
          </div>
        </Link>
      </div>
    </div>
  );
}
