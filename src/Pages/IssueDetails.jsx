
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/authcontexts';
import { format } from 'date-fns';
import { addAssignee } from '../lib/issues'; // Make sure this is imported correctly

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

  useEffect(() => {
    const issueRef = doc(db, 'issues', id);
    const unsubscribe = onSnapshot(issueRef, (docSnap) => {
      if (docSnap.exists()) {
        setIssue({ id: docSnap.id, ...docSnap.data() });
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
      // onSnapshot will update the issue state automatically
    } catch (err) {
      console.error('Error joining as assignee:', err);
      alert('Failed to join as assignee');
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
          className="mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
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

            {/* Status + Join Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                value={issue.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className="
                  px-4 py-2.5 border border-gray-300 rounded-lg bg-white
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  disabled:opacity-60 min-w-[160px]
                "
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              {!isAlreadyAssigned && issue.status !== 'Resolved' && (
                <button
                  onClick={handleJoinAsAssignee}
                  disabled={actionLoading}
                  className="
                    px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium
                    rounded-lg shadow-sm transition-all disabled:opacity-60
                    flex items-center gap-2
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
              )}
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
              <div className="text-gray-700">{createdDate}</div>
            </div>

            {resolvedDate && (
              <div>
                <div className="font-medium text-gray-800 mb-1">Resolved on</div>
                <div className="text-gray-700">{resolvedDate}</div>
              </div>
            )}
          </section>

          {/* Assignees / Collaborators */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Assigned To / Working On</h3>
            {hasAssignees ? (
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
          </section>
        </div>
      </div>

      <div className="mt-12 text-center text-gray-500 text-sm italic">
        Comments section coming soon...
      </div>
    </div>
  );
}