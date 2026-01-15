
import { useState } from 'react';
import { useAuth } from '../context/authcontexts';
import { createInnovation, } from '../lib/innovations';
import { serverTimestamp } from 'firebase/firestore';

export default function NewInnovationModal({ isOpen, onClose }) {
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    problem: '',
    solution: '',
    link: '',
    startDate: '',
    endDate: '',
  });

  const [contributors, setContributors] = useState([]);
  const [newContributor, setNewContributor] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddContributor = () => {
    if (!newContributor.trim()) return;
    setContributors([...contributors, { name: newContributor.trim() }]);
    setNewContributor('');
  };

  const handleRemoveContributor = (index) => {
    setContributors(contributors.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddContributor();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.solution.trim()) {
      setError('Title and Detailed Solution are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const innovationData = {
        title: formData.title.trim(),
        problem: formData.problem.trim(),
        currentSolution: formData.solution.trim(),
        link: formData.link.trim() || null,
        startDate: formData.startDate ? new Date(formData.startDate) : serverTimestamp(),
        endDate: formData.endDate ? new Date(formData.endDate) : null,
        createdBy: {
          uid: user.uid,
          name: user.displayName || user.email.split('@')[0] || 'Anonymous',
        },
        participants: [
          
          {
            name: user.displayName || user.email.split('@')[0] || 'Anonymous',
            role: 'creator',
          },
         
          ...contributors,
        ],
        status: 'Completed',
        createdAt: serverTimestamp(),
      };

      await createInnovation(innovationData);
      onClose();
    } catch (err) {
      console.error('Error creating innovation:', err);
      setError('Failed to save innovation record. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Document New Innovation</h2>
              <p className="text-gray-600 mt-1 text-sm">
                Share the problem solved, what was built, and who contributed.
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-light"
            >
              ×
            </button>
          </div>
        </div>

       
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
                   <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Innovation Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="e.g., Smart Task Prioritizer Dashboard"
            />
          </div>

         
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Problem Addressed
            </label>
            <textarea
              name="problem"
              value={formData.problem}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y transition-all"
              placeholder="Describe the problem this innovation solved..."
            />
          </div>

          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detailed Solution <span className="text-red-500">*</span>
            </label>
            <textarea
              name="solution"
              value={formData.solution}
              onChange={handleChange}
              rows={7}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y transition-all"
              placeholder="Explain what was built, how it works, technologies used, impact..."
            />
          </div>

          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link to Solution (GitHub, Figma, Deployed URL, etc.)
            </label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="https://github.com/username/repo"
            />
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Completion Date</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

         
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contributors (people who worked on it)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={newContributor}
                onChange={(e) => setNewContributor(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type name and press Enter or click Add"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={handleAddContributor}
                disabled={!newContributor.trim()}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Add
              </button>
            </div>

           
            {contributors.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {contributors.map((contributor, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-800 rounded-full text-sm"
                  >
                    {contributor.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveContributor(index)}
                      className="text-blue-600 hover:text-blue-800 font-bold"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </span>
              ) : (
                'Document Innovation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}