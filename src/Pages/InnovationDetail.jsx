// src/pages/InnovationDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/authcontexts';
import {
  updateSolutionWithHistory,
  addComment,
  getCommentsWithListener
} from '../lib/innovations';
import { format } from 'date-fns';
import useIsAuthorized  from '../hooks/useIsAuthorised';

export default function InnovationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isAuthorized = useIsAuthorized();

  const [record, setRecord] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [solutionText, setSolutionText] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Archive confirmation modal state
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  useEffect(() => {
    const unsubRecord = onSnapshot(doc(db, 'innovations', id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRecord({ id: snap.id, ...data });
        setSolutionText(data.currentSolution || '');
      } else {
        setError('Innovation record not found');
      }
      setLoading(false);
    });

    const unsubComments = getCommentsWithListener(id, setComments);

    return () => {
      unsubRecord();
      unsubComments();
    };
  }, [id]);

  const handleUpdateSolution = async () => {
    if (!solutionText.trim()) return alert('Please enter a solution');

    setActionLoading(true);
    try {
      const updater = {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0] || 'Anonymous'
      };

      await updateSolutionWithHistory(id, solutionText, updater);

      setSolutionText('');
      alert('Solution updated successfully! Previous version saved in history.');
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update solution. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setActionLoading(true);
    try {
      await addComment(id, {
        text: newComment,
        userId: user.uid,
        userName: user.displayName || user.email,
      });
      setNewComment('');
    } catch (err) {
      alert('Failed to post comment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    setActionLoading(true);
    try {
      const ref = doc(db, 'innovations', id);
      await updateDoc(ref, {
        isArchived: true,
        archivedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowArchiveConfirm(false);
      navigate('/innovation-records');
      alert('Innovation archived successfully');
    } catch (err) {
      console.error('Archive error:', err);
      alert('Failed to archive innovation');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-8">{error || 'This record could not be found'}</p>
        <button
          onClick={() => navigate('/innovation-records')}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
        >
          Back to Innovation Records
        </button>
      </div>
    );
  }

  const hasLink = record.link && record.link.trim() !== '';
  const hasHistory = record.solutionHistory?.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Bar with Back + Archive (Archive only for authorized) */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/innovation-records')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
        >
          ← Back to Innovation Records
        </button>

        {isAuthorized && (
          <button
            onClick={() => setShowArchiveConfirm(true)}
            disabled={actionLoading}
            className="
              px-6 py-2.5 bg-orange-600 hover:bg-orange-700 
              text-white font-medium 
              rounded-lg shadow-sm 
              transition-colors disabled:opacity-60 
              flex items-center gap-2
            "
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
            Archive
          </button>
        )}
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight">
            {record.title || record.problem || 'Untitled Innovation'}
          </h1>
        </div>

        {/* Content */}
        <div className="p-8 space-y-12">
          {/* Problem */}
          {record.problem && (
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Problem Addressed</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-6 rounded-xl border border-gray-200">
                {record.problem}
              </p>
            </section>
          )}

          {/* Solution with History */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900">Detailed Solution</h2>
              {hasHistory && (
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
                >
                  View History ({record.solutionHistory.length} versions)
                </button>
              )}
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap min-h-[120px]">
                {record.currentSolution || 'No solution documented yet.'}
              </p>

              {record.solver?.name && (
                <p className="mt-6 text-sm text-gray-600">
                  Last updated by <span className="font-medium">{record.solver.name}</span>
                </p>
              )}

              {hasLink && (
                <div className="mt-6">
                  <a
                    href={record.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
                  >
                    View Solution →
                  </a>
                </div>
              )}
            </div>

            {/* Conditional edit form */}
            {isAuthorized ? (
              <div className="mt-8">
                <textarea
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  rows={5}
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y transition-all"
                  placeholder="Propose an improvement or update the solution..."
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleUpdateSolution}
                    disabled={actionLoading || !solutionText.trim()}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-60"
                  >
                    {actionLoading ? 'Saving...' : 'Save Improvement'}
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 italic text-center">
                Only authorized team members can propose improvements or edit this solution.
              </p>
            )}
          </section>

          {/* Contributors */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contributors</h2>
            {record.participants?.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {record.participants.map((p, index) => (
                  <div
                    key={index}
                    className={`px-5 py-2 rounded-full text-sm font-medium shadow-sm ${
                      p.role === 'creator' ? 'bg-indigo-100 text-indigo-800' : 'bg-blue-50 text-blue-800'
                    }`}
                  >
                    {p.name}
                    {p.role === 'creator' && (
                      <span className="ml-2 text-xs bg-indigo-200 px-2 py-0.5 rounded-full">
                        Creator
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No contributors listed yet.</p>
            )}
          </section>

          {/* Timeline */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Started</h3>
              <p className="text-gray-700">
                {record.startDate?.toDate()
                  ? format(record.startDate.toDate(), 'MMMM d, yyyy')
                  : 'Not specified'}
              </p>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed</h3>
              <p className="text-gray-700">
                {record.endDate?.toDate()
                  ? format(record.endDate.toDate(), 'MMMM d, yyyy')
                  : 'Still active / ongoing'}
              </p>
            </div>
          </section>

          {/* Comments & Improvements */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Comments & Improvements</h2>

            {comments.length === 0 ? (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <p className="text-gray-500 italic text-lg">
                  No comments yet. Be the first to share thoughts or improvements!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-6"
                  >
                    <p className="text-gray-800 leading-relaxed">{comment.text}</p>
                    <p className="mt-4 text-sm text-gray-500">
                      {comment.userName} •{' '}
                      {comment.createdAt?.toDate()
                        ? format(comment.createdAt.toDate(), 'MMM d, yyyy • HH:mm')
                        : '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} className="mt-10">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
                className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y transition-all"
                placeholder="Share your thoughts, questions, or improvement ideas..."
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={actionLoading || !newComment.trim()}
                  className="px-8 py-3 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-lg transition-colors disabled:opacity-60"
                >
                  {actionLoading ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Solution Version History</h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-light"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8">
              {record.solutionHistory?.length > 0 ? (
                <div className="space-y-6">
                  {[...record.solutionHistory]
                    .reverse()
                    .map((entry, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 border border-gray-200 rounded-xl p-6"
                      >
                        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mb-4">
                          {entry.text}
                        </p>
                        <p className="text-sm text-gray-500">
                          Updated by <span className="font-medium">{entry.updatedBy?.name || 'Unknown'}</span> •{' '}
                          {entry.updatedAt?.toDate()
                            ? format(entry.updatedAt.toDate(), 'MMM d, yyyy • HH:mm')
                            : '—'}
                        </p>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center italic py-8">
                  No previous versions yet.
                </p>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal - only for authorized */}
      {isAuthorized && showArchiveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Archive Innovation?</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to archive this innovation record? 
              <br />
              It will be hidden from the main list but can still be accessed later.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleArchive}
                disabled={actionLoading}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {actionLoading ? 'Archiving...' : 'Archive'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}