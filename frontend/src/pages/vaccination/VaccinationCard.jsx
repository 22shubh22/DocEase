import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { vaccinationAPI } from '../../services/api';
import VaccinationCardView from '../../components/vaccination/VaccinationCardView';

export default function VaccinationCard() {
  const { id: patientId } = useParams();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCard = async () => {
    try {
      const response = await vaccinationAPI.getCard(patientId);
      setCard(response.data);
    } catch (error) {
      toast.error(error.errorMessage || 'Failed to load vaccination card');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCard();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!card) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Vaccination Card</h1>
          <p className="text-gray-600 mt-1">{card.patient_name}</p>
        </div>
        <Link to={`/patients/${patientId}`} className="btn btn-secondary">
          Back to Patient
        </Link>
      </div>

      <div className="card">
        <VaccinationCardView
          card={card}
          patientId={patientId}
          onDoseRecorded={fetchCard}
        />
      </div>
    </div>
  );
}
