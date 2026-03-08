import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import { chiefComplaintsAPI, diagnosisOptionsAPI, observationOptionsAPI, testOptionsAPI, medicineOptionsAPI, dosageOptionsAPI, durationOptionsAPI, symptomOptionsAPI, clinicAPI } from '../services/api';

// Settings Components
import PermissionsManager from '../components/settings/PermissionsManager';
import SubUserManager from '../components/settings/SubUserManager';
import OptionManager from '../components/settings/OptionManager';
import PasswordSettings from '../components/settings/PasswordSettings';
import TemplateDesigner from '../components/print/TemplateDesigner';
import SettingsSidebar from '../components/settings/SettingsSidebar';
import PluginManager from '../components/settings/PluginManager';
import AuditLogViewer from '../components/settings/AuditLogViewer';
import DpdpSettings from '../components/settings/DpdpSettings';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'password';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isOwner, setIsOwner] = useState(false);
  const [isCheckingOwner, setIsCheckingOwner] = useState(user?.role === 'DOCTOR');

  const isDoctor = user?.role === 'DOCTOR';

  // Check owner status for Team Permissions tab
  useEffect(() => {
    const checkOwnerStatus = async () => {
      if (user?.role === 'DOCTOR') {
        setIsCheckingOwner(true);
        try {
          const response = await clinicAPI.getInfo();
          setIsOwner(response.data.is_owner);
        } catch (error) {
          console.error('Failed to check owner status:', error);
          toast.error('Failed to load owner status');
        } finally {
          setIsCheckingOwner(false);
        }
      }
    };
    checkOwnerStatus();
  }, [user]);

  // Scroll to top when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sections = [
    {
      label: 'Account',
      items: [
        { id: 'password', label: 'Profile & Password', icon: '👤' },
      ],
    },
    ...(isDoctor && isOwner ? [{
      label: 'Team',
      items: [
        { id: 'team', label: 'Team Members', icon: '👥' },
        { id: 'permissions', label: 'Permissions', icon: '🔐' },
      ],
    }] : []),
    {
      label: 'Plugins',
      items: [
        { id: 'plugins', label: 'Manage Plugins', icon: '🧩' },
      ],
    },
    ...(isDoctor && isOwner && user?.enabled_plugins?.dpdp_compliance ? [{
      label: 'Compliance',
      items: [
        { id: 'audit-logs', label: 'Audit Logs', icon: '📜' },
        { id: 'dpdp', label: 'DPDP Compliance', icon: '🛡️' },
      ],
    }] : []),
    {
      label: 'Print',
      items: [
        { id: 'print-template', label: 'Print Template', icon: '🖨️' },
      ],
    },
    ...(isDoctor ? [{
      label: 'Clinical Options',
      items: [
        { id: 'complaints', label: 'Chief Complaints', icon: '📋' },
        { id: 'symptoms', label: 'Symptoms', icon: '🤒' },
        { id: 'diagnosis', label: 'Diagnosis', icon: '🩺' },
        { id: 'observations', label: 'Observations', icon: '👁️' },
        { id: 'tests', label: 'Tests', icon: '🧪' },
        { id: 'medicines', label: 'Medicines', icon: '💊', highlight: true },
        { id: 'dosages', label: 'Dosages', icon: '📏' },
        { id: 'durations', label: 'Durations', icon: '⏱️' },
      ],
    }] : []),
  ];

  // Option configurations for reusable OptionManager
  const optionConfigs = {
    complaints: {
      title: 'Chief Complaints',
      description: 'Configure the common complaints that appear in the OPD queue dropdown. Patients can still enter custom complaints if needed.',
      api: chiefComplaintsAPI,
      emptyIcon: '📋',
      singularName: 'complaint',
      tipText: 'Use the display order to arrange complaints. Lower numbers appear first in the dropdown. Deactivated complaints won\'t appear in the OPD queue but are kept for historical records.',
    },
    symptoms: {
      title: 'Symptom Options',
      description: 'Configure common symptoms that appear in the visit form dropdown. Doctors can still enter custom symptoms if needed.',
      api: symptomOptionsAPI,
      emptyIcon: '🤒',
      singularName: 'symptom',
      tipText: 'Use the display order to arrange symptoms. Lower numbers appear first in the dropdown. Deactivated symptoms won\'t appear in the visit form but are kept for historical records.',
    },
    diagnosis: {
      title: 'Diagnosis Options',
      description: 'Configure common diagnoses that appear in the visit form dropdown. Doctors can still enter custom diagnoses if needed.',
      api: diagnosisOptionsAPI,
      emptyIcon: '🩺',
      singularName: 'diagnosis',
      tipText: 'Use the display order to arrange diagnoses. Lower numbers appear first in the dropdown. Deactivated diagnoses won\'t appear in the visit form but are kept for historical records.',
    },
    observations: {
      title: 'Clinical Observations',
      description: 'Configure common clinical observations that appear in the visit form dropdown. Doctors can still enter custom observations if needed.',
      api: observationOptionsAPI,
      emptyIcon: '👁️',
      singularName: 'observation',
      tipText: 'Use the display order to arrange observations. Lower numbers appear first in the dropdown. Deactivated observations won\'t appear in the visit form but are kept for historical records.',
    },
    tests: {
      title: 'Recommended Tests',
      description: 'Configure common tests that appear in the visit form dropdown. Doctors can still enter custom tests if needed.',
      api: testOptionsAPI,
      emptyIcon: '🧪',
      singularName: 'test',
      tipText: 'Use the display order to arrange tests. Lower numbers appear first in the dropdown. Deactivated tests won\'t appear in the visit form but are kept for historical records.',
    },
    medicines: {
      title: 'Medicine Options',
      description: 'Configure common medicines that appear in the prescription dropdown. Doctors can still enter custom medicines if needed.',
      api: medicineOptionsAPI,
      emptyIcon: '💊',
      singularName: 'medicine',
      tipText: 'Use the display order to arrange medicines. Lower numbers appear first in the dropdown. Deactivated medicines won\'t appear in the prescription form but are kept for historical records.',
    },
    dosages: {
      title: 'Dosage Options',
      description: 'Configure common dosages that appear in the prescription dropdown. Doctors can still enter custom dosages if needed.',
      api: dosageOptionsAPI,
      emptyIcon: '📏',
      singularName: 'dosage',
      tipText: 'Use the display order to arrange dosages. Lower numbers appear first in the dropdown. Deactivated dosages won\'t appear in the prescription form but are kept for historical records.',
    },
    durations: {
      title: 'Duration Options',
      description: 'Configure common durations that appear in the prescription dropdown. Doctors can still enter custom durations if needed.',
      api: durationOptionsAPI,
      emptyIcon: '⏱️',
      singularName: 'duration',
      tipText: 'Use the display order to arrange durations. Lower numbers appear first in the dropdown. Deactivated durations won\'t appear in the prescription form but are kept for historical records.',
    },
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'team':
        if (isDoctor && isOwner) {
          return (
            <div className="card">
              <SubUserManager />
            </div>
          );
        }
        return null;

      case 'permissions':
        if (isDoctor && isOwner) {
          return (
            <div className="card">
              <PermissionsManager />
            </div>
          );
        }
        return null;

      case 'complaints':
      case 'symptoms':
      case 'diagnosis':
      case 'observations':
      case 'tests':
      case 'medicines':
      case 'dosages':
      case 'durations':
        if (isDoctor) {
          const config = optionConfigs[activeTab];
          return (
            <OptionManager
              key={activeTab}
              title={config.title}
              description={config.description}
              api={config.api}
              emptyIcon={config.emptyIcon}
              singularName={config.singularName}
              tipText={config.tipText}
            />
          );
        }
        return null;

      case 'plugins':
        return <PluginManager isOwner={isOwner} />;

      case 'audit-logs':
        if (isDoctor && isOwner) {
          return <AuditLogViewer />;
        }
        return null;

      case 'dpdp':
        if (isDoctor && isOwner) {
          return <DpdpSettings />;
        }
        return null;

      case 'print-template':
        return <TemplateDesigner user={user} />;

      case 'password':
        return <PasswordSettings user={user} />;

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and clinic preferences</p>
      </div>

      {/* Sidebar + Content layout */}
      <div className="md:flex md:gap-8">
        <SettingsSidebar
          sections={sections}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isCheckingOwner && isDoctor ? (
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-48 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-100 rounded-lg"></div>
            </div>
          ) : (
            renderTabContent()
          )}
        </div>
      </div>
    </div>
  );
}
