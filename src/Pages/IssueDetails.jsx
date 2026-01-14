// src/pages/IssueDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/authcontexts';
import { format } from 'date-fns';

const statusOptions = ['Open', 'In Progress', 'Resolved'];

export default function IssueDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

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
      // onSnapshot will automatically update the local state
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!issue || updating || !user) return;

    setUpdating(true);
    try {
      const issueRef = doc(db, 'issues', id);
      await updateDoc(issueRef, {
        assigneeId: user.uid,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error assigning issue:', err);
      alert('Failed to assign issue');
    } finally {
      setUpdating(false);
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
          className="mt-6 px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark"
        >
          Back to Dashboard
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {issue.title}
              </h1>
              <div className="flex flex-wrap gap-3">
                <span className={`
                  px-3 py-1 rounded-full text-sm font-medium
                  ${issue.status === 'Open' ? 'bg-yellow-100 text-yellow-800' : ''}
                  ${issue.status === 'In Progress' ? 'bg-blue-100 text-blue-800' : ''}
                  ${issue.status === 'Resolved' ? 'bg-green-100 text-green-800' : ''}
                `}>
                  {issue.status}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {issue.category}
                </span>
              </div>
            </div>

            {/* Status controls */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={issue.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className={`
                  px-4 py-2 border border-gray-300 rounded-md
                  bg-white focus:ring-2 focus:ring-primary focus:border-primary
                  disabled:opacity-60
                `}
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              {!issue.assigneeId && (
                <button
                  onClick={handleAssignToMe}
                  disabled={updating}
                  className={`
                    px-5 py-2 bg-primary text-white rounded-md
                    hover:bg-primary-dark transition-colors
                    disabled:opacity-60 flex items-center gap-2
                  `}
                >
                  {updating ? 'Assigning...' : 'Assign to Me'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6 sm:p-8">
          <div className="prose max-w-none text-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
            <p className="whitespace-pre-wrap">
              {issue.description || 'No description provided.'}
            </p>
          </div>

          {/* Metadata */}
          <div className="mt-10 pt-6 border-t border-gray-200 text-sm text-gray-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="font-medium text-gray-800">Reported by</div>
                <div>{issue.reporterName || '—'}</div>
              </div>
              <div>
                <div className="font-medium text-gray-800">Created</div>
                <div>{createdDate}</div>
              </div>
              {issue.assigneeId && (
                <div>
                  <div className="font-medium text-gray-800">Assigned to</div>
                  <div className="text-blue-600">Assigned (ID: {issue.assigneeId.slice(0,8)}...)</div>
                </div>
              )}
              {resolvedDate && (
                <div>
                  <div className="font-medium text-gray-800">Resolved on</div>
                  <div>{resolvedDate}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center text-gray-500 text-sm">
        Comments section coming soon...
      </div>
    </div>
  );
}