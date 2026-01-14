// src/pages/NewIssue.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authcontexts';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const categories = [
  'Academy',
  'Management',
  'Hub',
  'External',
  'Other',
];

export default function NewIssue() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Other',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const issueData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        reporterId: user.uid,
        reporterName: user.displayName || user.email || 'Anonymous',
        status: 'Open',
        assigneeId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'issues'), issueData);

      // Optional: you could show a success toast here
      navigate('/issues', { replace: true });
      // or navigate(`/issues/${docRef.id}`) to go directly to the new issue
    } catch (err) {
      console.error('Error creating issue:', err);
      setError('Failed to create issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Create New Issue</h1>
      <p className="text-gray-600 mb-8">Everyone will be able to see and contribute to this issue.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="
              w-full px-4 py-3 border border-gray-300 rounded-md 
              focus:ring-2 focus:ring-primary focus:border-primary 
              outline-none transition-all
            "
            placeholder="Short, clear description of the issue"
          />
        </div>

        {/* Category */}
        <div className="mb-6">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="
              w-full px-4 py-3 border border-gray-300 rounded-md 
              focus:ring-2 focus:ring-primary focus:border-primary 
              bg-white outline-none transition-all
            "
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="mb-8">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={6}
            className="
              w-full px-4 py-3 border border-gray-300 rounded-md 
              focus:ring-2 focus:ring-primary focus:border-primary 
              outline-none transition-all resize-y min-h-[120px]
            "
            placeholder="Provide more context, steps to reproduce, screenshots links, etc..."
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="
              px-6 py-3 border border-gray-300 rounded-md 
              text-gray-700 hover:bg-gray-50 transition-colors
              order-2 sm:order-1
            "
          >
            Cancel
          </button>

          <button
  type="submit"
  disabled={loading}
  className={`
    group relative px-6 py-3
    bg-blue-700
    hover:bg-blue-600 cursor-pointer
    text-white font-semibold
    rounded-md shadow-md
    transition-all duration-300
    flex items-center justify-center gap-2.5
    focus:outline-none focus:ring-2 focus:ring-primary-light/60 focus:ring-offset-2
    disabled:opacity-60 disabled:shadow-sm disabled:cursor-not-allowed
    overflow-hidden
    order-1 sm:order-2
  `}
>
  {loading ? (
    <span className="flex items-center gap-3">
      <span className="relative flex h-5 w-5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-30"></span>
        <span className="relative inline-flex rounded-full h-5 w-5 border-2 border-white border-t-transparent animate-spin"></span>
      </span>
      Creating…
    </span>
  ) : (
    <>
      <svg className="w-5 h-5 transition-transform group-hover:rotate-90 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
      </svg>
      Create Issue
    </>
  )}
</button>
        </div>
      </form>
    </div>
  );
}