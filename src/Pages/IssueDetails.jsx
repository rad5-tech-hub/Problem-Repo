// src/pages/IssueDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp, } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/authcontexts';
import { format } from 'date-fns';
import { addAssignee } from '../lib/issues';

const statusOptions = ['Open', 'In Progress', 'Resolved'];

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', category: 'Other' });

  // Archive confirmation modal
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  useEffect(() => {
    const issueRef = doc(db, 'issues', id);
    const unsubscribe = onSnapshot(issueRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        setIssue(data);
        setEditForm({
          title: data.title || '',
          description: data.description || '',
          category: data.category || 'Other',
        });
      } else {
        setError('Issue not found');
      }
      setLoading(false);
    }, (err) => {
      console.error('Error loading issue:', err);
      setError('Failed to load issue');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    if (!issue || updating) return;
    setUpdating(true);
    try {
      const issueRef = doc(db, 'issues', id);
      const updateData = {
        status: newStatus,
        updatedAt: serverTimestamp(),
      };
      if (newStatus === 'Resolved' && issue.status !== 'Resolved') {
        updateData.resolvedAt = serverTimestamp();
      }
      await updateDoc(issueRef, updateData);
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleJoinAsAssignee = async () => {
    setActionLoading(true);
    try {
      await addAssignee(id, user);
    } catch (err) {
      alert('Failed to join as assignee');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      alert('Title is required');
      return;
    }

    setUpdating(true);
    try {
      const issueRef = doc(db, 'issues', id);
      await updateDoc(issueRef, {
        title: editForm.title.trim(),
        description: editForm.description.trim(),
        category: editForm.category,
        updatedAt: serverTimestamp(),
      });
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Error updating issue:', err);
      alert('Failed to save changes');
    } finally {
      setUpdating(false);
    }
  };

  const handleArchive = async () => {
    setActionLoading(true);
    try {
      const issueRef = doc(db, 'issues', id);
      await updateDoc(issueRef, {
        isArchived: true,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowArchiveConfirm(false);
      navigate('/issues');
      alert('Issue archived successfully');
    } catch (err) {
      console.error('Error archiving issue:', err);
      alert('Failed to archive issue');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded w-3/4"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Oops...</h2>
        <p className="text-gray-600">{error || 'Issue not found'}</p>
        <button
          onClick={() => navigate('/issues')}
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 cursor-pointer text-white rounded-lg transition-colors"
        >
          Back to Issues
        </button>
      </div>
    );
  }

  const createdDate = issue.createdAt?.toDate?.()
    ? format(issue.createdAt.toDate(), 'PPP p')
    : '—';

  const resolvedDate = issue.resolvedAt?.toDate?.()
    ? format(issue.resolvedAt.toDate(), 'PPP p')
    : null;

  const isAlreadyAssigned = issue.assignees?.some(a => a.uid === user.uid);
  const hasAssignees = issue.assignees?.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Back & Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <button
          onClick={() => navigate('/issues')}
          className="inline-flex items-center gap-2 cursor-pointer px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
        >
          ← Back to Issues
        </button>

        <div className="flex flex-wrap gap-3 justify-end">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 cursor-pointer text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Issue
          </button>

          <button
            onClick={() => setShowArchiveConfirm(true)}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 cursor-pointer text-white font-medium rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Archive
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                {issue.title}
              </h1>
              <div className="flex flex-wrap gap-3">
                <span className={`
                  px-4 py-1.5 rounded-full text-sm font-medium border
                  ${issue.status === 'Open' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' : ''}
                  ${issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-300' : ''}
                  ${issue.status === 'Resolved' ? 'bg-green-100 text-green-800 border-green-300' : ''}
                `}>
                  {issue.status}
                </span>
                <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-300">
                  {issue.category}
                </span>
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <select
                value={issue.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="
                  px-4 py-2.5 border border-gray-300 rounded-lg bg-white
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  disabled:opacity-60 cursor-pointer min-w-[160px]
                "
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6 sm:p-8 space-y-10">
          {/* Description */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-6 rounded-xl border border-gray-200">
              {issue.description || 'No description provided.'}
            </p>
          </section>

          {/* Metadata */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 border-t border-gray-200 pt-8">
            <div>
              <div className="font-medium text-gray-800 mb-1">Reported by</div>
              <div className="text-gray-700">{issue.reporterName || '—'}</div>
            </div>

            <div>
              <div className="font-medium text-gray-800 mb-1">Created</div>
              <div className="text-gray-700">{issue.createdAt ? format(issue.createdAt.toDate(), 'PPP p') : '—'}</div>
            </div>

            {issue.resolvedAt && (
              <div>
                <div className="font-medium text-gray-800 mb-1">Resolved on</div>
                <div className="text-gray-700">{format(issue.resolvedAt.toDate(), 'PPP p')}</div>
              </div>
            )}
          </section>

          {/* Assignees / Collaborators */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Assigned To / Working On</h3>
            {issue.assignees?.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {issue.assignees.map((assignee, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 bg-blue-50 text-blue-800 rounded-full text-sm font-medium shadow-sm flex items-center gap-2"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                      {assignee.name[0].toUpperCase()}
                    </div>
                    {assignee.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic bg-gray-50 p-6 rounded-xl border border-gray-200 text-center">
                No one assigned yet
              </p>
            )}

            {/* Join Button */}
            {!isAlreadyAssigned && issue.status !== 'Resolved' && (
              <div className="mt-6">
                <button
                  onClick={handleJoinAsAssignee}
                  disabled={actionLoading}
                  className="
                    px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium
                    rounded-lg shadow-sm transition-all disabled:opacity-60
                    flex items-center cursor-pointer gap-2
                  "
                >
                  {actionLoading ? (
                    <>
                      <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                      Joining...
                    </>
                  ) : (
                    'Assign to Me / Join'
                  )}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Edit Issue</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-500 cursor-pointer hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {['Academy', 'Management', 'Hub', 'External', 'Other'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                />
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-3 bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-8 py-3 bg-blue-600 cursor-pointer hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60"
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Archive Issue?</h3>
            <p className="text-gray-600 mb-8">
              Are you sure you want to archive this issue? It will be hidden from active views but can still be accessed later.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="px-6 py-3 bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={actionLoading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white  cursor-pointer rounded-lg transition-colors disabled:opacity-60"
              >
                {actionLoading ? 'Archiving...' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 text-center text-gray-500 text-sm italic">
        Comments section coming soon...
      </div>
    </div>
  );
}