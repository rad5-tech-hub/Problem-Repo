// src/pages/InnovationRecords.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInnovationsWithListener } from '../lib/innovations';
// import { db } from '../lib/firebase';
import { format } from 'date-fns';
import NewInnovationModal from '../components/NewInnovationModal';
import { useAuth } from '../context/authcontexts';
import { AUTHORIZED_EMAILS } from '../config/authorisedUsers';
import isAuthorizedUser from '../hooks/useIsAuthorised';

export default function InnovationRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'archived'

  const { user } = useAuth();
  const isAuthorized = isAuthorizedUser(user);

  useEffect(() => {
    const unsubscribe = getInnovationsWithListener((data) => {
      // Client-side filter based on view mode
      const filtered = viewMode === 'archived'
        ? data.filter((r) => r.isArchived === true)
        : data.filter((r) => r.isArchived !== true); // missing = active

      setRecords(filtered);
      setLoading(false);
    });
    return unsubscribe;
  }, [viewMode]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      {/* Gradient Header with Tabs & New Button */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-10 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Innovation Records</h1>
            <p className="mt-3 text-blue-100 text-lg">
              {viewMode === 'active' ? 'Active Innovations' : 'Archived Innovations'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* View Mode Tabs */}
            <div className="inline-flex rounded-xl border border-white/20 bg-white/10 p-1 backdrop-blur-sm">
              <button
                onClick={() => setViewMode('active')}
                className={`px-6 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all min-w-[110px] ${
                  viewMode === 'active'
                    ? 'bg-white shadow-md text-blue-700'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setViewMode('archived')}
                className={`px-6 py-2.5 text-sm font-medium rounded-lg cursor-pointer transition-all min-w-[110px] ${
                  viewMode === 'archived'
                    ? 'bg-white shadow-md text-blue-700'
                    : 'text-white hover:bg-white/20'
                }`}
              >
                Archived
              </button>
            </div>

            {/* Only show "New Innovation" button to authorized users */}
            {isAuthorized && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-white hover:bg-gray-100 cursor-pointer text-blue-700 font-medium rounded-xl shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Document Innovation
              </button>
            )}
          </div>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            No {viewMode === 'active' ? 'Active' : 'Archived'} Innovations Yet
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {viewMode === 'active'
              ? 'Start documenting your team\'s breakthroughs and solutions here.'
              : 'No archived innovations yet.'}
          </p>

          {isAuthorized && viewMode === 'active' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-medium rounded-xl shadow-lg transition-all transform hover:scale-105"
            >
              + Document First Innovation
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map((record) => (
            <div
              key={record.id}
              className="group bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden"
            >
              <Link to={`/innovation-records/${record.id}`} className="block p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-700 transition-colors">
                  {record.title || record.problem || 'Untitled Innovation'}
                </h3>

                <p className="text-gray-600 mb-6 line-clamp-3">
                  {record.currentSolution?.substring(0, 150) || 'No description available'}...
                </p>

                <div className="flex flex-wrap gap-2 text-xs">
                  {record.startDate && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                      Started {format(record.startDate.toDate(), 'MMM d, yyyy')}
                    </span>
                  )}
                  {record.endDate && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full">
                      Completed {format(record.endDate.toDate(), 'MMM d, yyyy')}
                    </span>
                  )}
                  {record.isArchived && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full">
                      Archived
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* New Innovation Modal */}
      <NewInnovationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}