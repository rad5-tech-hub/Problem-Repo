// src/pages/InnovationDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/authcontexts';
import { 
  updateInnovation, 
  addParticipant, 
  addComment, 
  getCommentsWithListener, 
  updateStatus 
} from '../lib/innovations';
import { format } from 'date-fns';

const statusOptions = ['Unattended', 'In Progress', 'Solved', 'Completed'];

const statusStyles = {
  Unattended: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-300',
    label: 'Waiting for team'
  },
  'In Progress': {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-300',
    label: 'Team working'
  },
  Solved: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-300',
    label: 'Solution found'
  },
  Completed: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-300',
    label: 'Finished'
  }
};

export default function InnovationDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [solutionText, setSolutionText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const unsubRecord = onSnapshot(doc(db, 'innovations', id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRecord({ id: snap.id, ...data });
        setSolutionText(data.solution || '');
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

  const currentUserJoined = record?.participants?.some(p => p.uid === user.uid);
  const isCompleted = record?.status === 'Completed';

  const handleJoinTeam = async () => {
    setActionLoading(true);
    try {
      const participant = {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0] || 'Anonymous',
        role: 'participant'
      };
      await addParticipant(id, participant);
    } catch (err) {
      alert('Failed to join the team');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWorking = async () => {
    setActionLoading(true);
    try {
      await updateInnovation(id, { status: 'In Progress' });
    } catch (err) {
      alert('Failed to start working');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSolution = async () => {
    if (!solutionText.trim()) return alert('Please enter a solution');

    setActionLoading(true);
    try {
      const solver = {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0] || 'Anonymous'
      };

      await updateInnovation(id, { solution: solutionText }, solver);

      // Clear textarea after successful save
      setSolutionText('');

      // Optional success feedback
      alert('Solution saved successfully!');
    } catch (err) {
      console.error('Solution update error:', err);
      alert('Failed to save solution. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === record.status) return;
    setActionLoading(true);
    try {
      await updateStatus(id, newStatus);
    } catch (err) {
      console.error(err);
      alert('Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAskToJoin = async () => {
    setActionLoading(true);
    try {
      const participant = {
        uid: user.uid,
        name: user.displayName || user.email.split('@')[0] || 'Anonymous',
        role: 'participant'
      };

      // Auto-start if Unattended
      if (record.status === 'Unattended') {
        await updateStatus(id, 'In Progress');
      }

      await addParticipant(id, participant);
    } catch (err) {
      console.error(err);
      alert('Failed to join the team');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkCompleted = async () => {
    setActionLoading(true);
    try {
      await updateInnovation(id, { endDate: serverTimestamp() });
    } catch (err) {
      alert('Failed to mark as completed');
      console.error(err);
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

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error || !record) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
      <p className="text-gray-600 mb-8">{error || 'This record could not be found'}</p>
      <button onClick={() => navigate('/innovation-records')} className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Back to Innovation Records
      </button>
    </div>
  );

  const style = statusStyles[record.status] || statusStyles.Unattended;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/innovation-records')} 
        className="mb-6 px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
      >
        ← Back to Innovation Records
      </button>

      {/* Header Card */}
      <div className={`rounded-xl shadow-sm border ${style.border} ${style.bg} p-6 mb-8`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${style.text} border ${style.border} mb-3`}>
              {record.status} · {style.label}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{record.problem}</h1>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            {/* Status Selector */}
            <div className="relative min-w-[200px]">
              <select
                value={record.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={actionLoading}
                className={`
                  w-full appearance-none pl-4 pr-10 py-3 bg-white border border-gray-300
                  rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  text-gray-800 font-medium cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed
                `}
              >
                {statusOptions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-600">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            {/* Join Button - Hidden when Completed */}
            {!currentUserJoined && !isCompleted && (
              <button
                onClick={handleAskToJoin}
                disabled={actionLoading}
                className={`
                  px-7 py-3 font-medium rounded-lg shadow-md transition-all transform hover:-translate-y-0.5
                  ${record.status === 'Unattended' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'}
                  disabled:opacity-60 disabled:cursor-not-allowed
                `}
              >
                {actionLoading 
                  ? 'Processing...' 
                  : record.status === 'Unattended' 
                    ? 'Join & Start Working' 
                    : 'Ask to Join Team'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Left 2/3 */}
        <div className="lg:col-span-2 space-y-8">
          {/* Solution Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Solution</h2>
            {record.solution ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-5 mb-6">
                <p className="text-gray-800 whitespace-pre-wrap">{record.solution}</p>
                <p className="text-sm text-gray-600 mt-4">
                  Contributed by <strong>{record.solver?.name || 'Unknown'}</strong>
                </p>
              </div>
            ) : (
              <p className="text-gray-500 mb-6">No solution has been proposed yet.</p>
            )}
            <textarea
              value={solutionText}
              onChange={e => setSolutionText(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
              placeholder="Share your solution or improvement ideas..."
            />
            <button
              onClick={handleUpdateSolution}
              disabled={actionLoading || !solutionText.trim()}
              className="mt-4 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-60"
            >
              {actionLoading ? 'Saving...' : 'Save / Update Solution'}
            </button>
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Comments & Improvements</h2>
            {comments.length === 0 ? (
              <p className="text-gray-500 italic py-4">No comments yet. Be the first to share thoughts!</p>
            ) : (
              <div className="space-y-5 mb-8">
                {comments.map(comment => (
                  <div key={comment.id} className="border-l-4 border-gray-300 pl-4 py-1">
                    <p className="text-gray-800">{comment.text}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {comment.userName} • {comment.createdAt?.toDate() ? format(comment.createdAt.toDate(), 'MMM d, yyyy • HH:mm') : '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleAddComment} className="mt-6">
              <textarea
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
                placeholder="Add your thoughts, questions or suggestions..."
              />
              <button
                type="submit"
                disabled={actionLoading || !newComment.trim()}
                className="mt-3 px-8 py-3 bg-gray-700 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {actionLoading ? 'Posting...' : 'Post Comment'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar - Right 1/3 */}
        <div className="space-y-8">
          {/* Team Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team</h3>
            {record.participants?.length > 0 || record.createdBy ? (
              <div className="space-y-3">
                {record.createdBy && (
                  <div className="flex justify-between items-center py-1">
                    <span className="font-medium">{record.createdBy.name}</span>
                    <span className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full">Creator</span>
                  </div>
                )}
                {record.participants?.map((p, i) => (
                  <div key={i} className="flex justify-between items-center py-1">
                    <span>{p.name}</span>
                    <span className="text-xs px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">{p.role}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No team members yet</p>
            )}
            {!currentUserJoined && !isCompleted && (
              <button
                onClick={handleAskToJoin}
                disabled={actionLoading}
                className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-60"
              >
                {actionLoading ? 'Joining...' : 'Join This Project'}
              </button>
            )}
          </div>

          {/* Timeline Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div>
                <span className="font-medium">Started:</span><br />
                {record.startDate?.toDate() ? format(record.startDate.toDate(), 'MMMM d, yyyy') : '—'}
              </div>
              <div>
                <span className="font-medium">Ended:</span><br />
                {record.endDate?.toDate() ? format(record.endDate.toDate(), 'MMMM d, yyyy') : 'Still active'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}