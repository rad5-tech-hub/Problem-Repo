
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInnovationsWithListener } from '../lib/innovations';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';
import NewInnovationModal from '../components/NewInnovationModal';

export default function InnovationRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '' });

  useEffect(() => {
    const unsubscribe = getInnovationsWithListener((data) => {
      setRecords(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleDeleteClick = (id, title) => {
    setDeleteModal({ open: true, id, title });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await deleteDoc(doc(db, 'innovations', deleteModal.id));
     
      setDeleteModal({ open: false, id: null, title: '' });
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete innovation. Please try again.');
    }
  };

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
      
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 mb-10 text-white">
        <div className="flex sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Innovation Records</h1>
            <p className="mt-3 text-blue-100 text-lg">
              Documented solutions that solved real problems
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-blue-600 cursor-pointer hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            + Document Innovation
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">No Innovations Yet</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start documenting your team's breakthroughs and solutions here.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            + Document First Innovation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {records.map(record => (
            <div
              key={record.id}
              className="group bg-white rounded-2xl border border-gray-200 shadow-md hover:shadow-xl hover:border-blue-300 transition-all duration-300 overflow-hidden relative"
            >
              <Link to={`/innovation-records/${record.id}`} className="block p-6 pr-16">
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
                </div>
              </Link>

             
              <button
                onClick={() => setDeleteModal({ open: true, id: record.id, title: record.title || record.problem })}
                className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-red-600 focus:outline-none"
                title="Delete this record"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

     
      <NewInnovationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      
      {deleteModal.open && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Delete Innovation?</h3>
            <p className="text-gray-600 mb-8">
              Are you sure you want to permanently delete
              <br />
              <span className="font-medium break-words">"{deleteModal.title}"</span>?
              <br />
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteModal({ open: false, id: null, title: '' })}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}