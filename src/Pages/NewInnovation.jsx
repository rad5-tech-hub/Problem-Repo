// New page: Create New Innovation
// src/pages/NewInnovation.jsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontexts';
import { createInnovation, addParticipant	 } from '../lib/innovations';

export default function NewInnovation() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ problem: '', solution: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!formData.problem.trim()) return setError('Problem description required');
  setLoading(true);
  try {
    const innovationData = {
      problem: formData.problem,
      solution: formData.solution || null,
      createdBy: { uid: user.uid, name: user.displayName || user.email },
    };
    const docRef = await createInnovation(innovationData);
    // Auto-join creator as participant (optional - or let them join manually)
    await addParticipant(docRef.id, { uid: user.uid, name: user.displayName || user.email });
    navigate('/innovation-records');
  } catch (err) {
    setError('Failed to create record');
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">New Innovation Record</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
        {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">{error}</div>}
        <div className="mb-6">
          <label htmlFor="problem" className="block text-sm font-medium text-gray-700 mb-2">Problem *</label>
          <textarea id="problem" name="problem" value={formData.problem} onChange={handleChange} rows={4} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="Describe the problem" required />
        </div>
        <div className="mb-8">
          <label htmlFor="solution" className="block text-sm font-medium text-gray-700 mb-2">Initial Solution (optional)</label>
          <textarea id="solution" name="solution" value={formData.solution} onChange={handleChange} rows={6} className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all" placeholder="Any initial ideas?" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 border cursor-pointer border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors order-2 sm:order-1">Cancel</button>
          <button type="submit" disabled={loading} className={`px-6 py-3 bg-blue-500 cursor-pointer text-white font-medium rounded-md hover:bg-primary-dark focus:ring-2 focus:ring-primary-light focus:ring-offset-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed order-1 sm:order-2`}>
            {loading ? <><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> Creating...</> : 'Create Record'}
          </button>
        </div>
      </form>
    </div>
  );
}