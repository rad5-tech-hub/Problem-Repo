// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import IssueCard from '../components/IssueCard';
import NewIssueModal from '../components/NewIssueModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useAuth } from '../context/authcontexts';
import { format } from 'date-fns';
const columns = [
  { id: 'Open', title: 'Open', color: 'border-yellow-400' },
  { id: 'In Progress', title: 'In Progress', color: 'border-blue-400' },
  { id: 'Resolved', title: 'Resolved', color: 'border-green-400' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewIssueModalOpen, setIsNewIssueModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'archived'
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allIssues = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Client-side filter for active/archived
      const filtered = viewMode === 'archived'
        ? allIssues.filter((i) => i.isArchived === true)
        : allIssues.filter((i) => i.isArchived !== true);

      setIssues(filtered);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching issues:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [viewMode]);

  const getIssuesByStatus = (status) =>
    issues.filter((issue) => issue.status === status);

  const canDragIssue = (issue) => {
    // Allow drag if: user is reporter OR is in assignees
    return (
      issue.reporterId === user?.uid ||
      issue.assignees?.some((a) => a.uid === user?.uid)
    );
  };

 const onDragEnd = async (result) => {
  if (viewMode !== 'active') return;

  const { destination, source, draggableId } = result;

  // Dropped outside any column
  if (!destination) return;

  // Dropped in the same position (no change)
  if (
    destination.droppableId === source.droppableId &&
    destination.index === source.index
  ) {
    return;
  }

  // Find the issue being dragged
  const draggedIssue = issues.find((i) => i.id === draggableId);

  if (!draggedIssue) return;

  // Permission check: only reporter or assigned users can drag
  if (!canDragIssue(draggedIssue)) {
    setShowPermissionModal(true);
    return;
  }

  const newStatus = destination.droppableId;
  setIssues((prev) =>
    prev.map((issue) =>
      issue.id === draggableId ? { ...issue, status: newStatus } : issue
    )
  );

  try {
    const issueRef = doc(db, 'issues', draggableId);

    const updateData = {
      status: newStatus,
      updatedAt: serverTimestamp(),
    };

    if (newStatus === 'Resolved') {
      updateData.resolvedAt = serverTimestamp();
    }

    await updateDoc(issueRef, updateData);

    setTimeout(() => {
      setIssues((prev) => [...prev]); 
    }, 300);
  } catch (error) {
    console.error('Failed to update issue status:', error);

    setIssues((prev) =>
      prev.map((issue) =>
        issue.id === draggableId ? { ...issue, status: source.droppableId } : issue
      )
    );

    alert('Failed to move issue. Please try again.');
  }
};

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              {viewMode === 'active' ? 'Active Issues' : 'Archived Issues'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 shadow-sm">
              <button
                onClick={() => setViewMode('active')}
                className={`px-6 py-2.5 text-sm font-medium cursor-pointer rounded-lg transition-all min-w-[110px] ${
                  viewMode === 'active'
                    ? 'bg-white shadow-md text-blue-700 border cursor-pointer border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setViewMode('archived')}
                className={`px-6 py-2.5 text-sm font-medium cursor-pointer rounded-lg transition-all min-w-[110px] ${
                  viewMode === 'archived'
                    ? 'bg-white shadow-md text-blue-700 border cursor-pointer border-blue-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Archived
              </button>
            </div>

            <button
              onClick={() => setIsNewIssueModalOpen(true)}
              className="
                px-6 py-2.5 bg-blue-600 hover:bg-blue-700 
                text-white font-medium 
                rounded-lg shadow-md 
                transition-all duration-200 
cursor-pointer
                flex items-center gap-2 
                min-w-[140px] justify-center
              "
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              New Issue
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'active' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {columns.map((column) => (
              <Droppable droppableId={column.id} key={column.id}>
                {(provided) => (
                  <div
                    className="flex flex-col bg-gray-50 rounded-2xl border border-gray-200 shadow-md min-h-[500px] overflow-hidden"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <div
                      className={`
                        px-6 py-4 rounded-t-2xl bg-white border-t-4 ${column.color}
                        font-semibold text-gray-800 shadow-sm sticky top-0 z-10
                      `}
                    >
                      {column.title} ({getIssuesByStatus(column.id).length})
                    </div>

                    <div className="p-5 space-y-5 flex-1">
                      {getIssuesByStatus(column.id).length === 0 ? (
                        <div className="bg-white rounded-xl p-10 text-center text-gray-500 border border-dashed border-gray-300">
                          No issues here yet
                        </div>
                      ) : (
                        getIssuesByStatus(column.id).map((issue, index) => (
                          <Draggable key={issue.id} draggableId={issue.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`transition-all duration-200 ${
                                  snapshot.isDragging
                                    ? 'opacity-75 scale-105 shadow-2xl ring-2 ring-blue-500 ring-offset-2'
                                    : 'hover:shadow-lg hover:-translate-y-0.5'
                                }`}
                              >
                                <IssueCard issue={issue} />
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      ) : (
        // Archived View (unchanged for brevity - already working)
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Archived Issues</h2>
          {issues.length === 0 ? (
            <div className="text-center py-16 text-gray-500 italic bg-gray-50 rounded-xl border border-dashed border-gray-300">
              No archived issues yet
            </div>
          ) : (
            <div className="space-y-5">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="p-6 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {issue.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        Archived on{' '}
                        {issue.archivedAt
                          ? format(issue.archivedAt.toDate(), 'MMM d, yyyy • HH:mm')
                          : 'Unknown date'}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {issue.description?.substring(0, 150) || 'No description'}...
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 cursor-pointer">
                      <button
                        onClick={async () => {
                          if (!window.confirm('Unarchive this issue?')) return;
                          try {
                            await updateDoc(doc(db, 'issues', issue.id), {
                              isArchived: false,
                              archivedAt: null,
                              updatedAt: serverTimestamp(),
                            });
                          } catch (err) {
                            alert('Failed to unarchive');
                          }
                        }}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors min-w-[120px] text-center shadow-sm"
                      >
                        Unarchive
                      </button>

                      <button
                        onClick={async () => {
                          if (!window.confirm('Permanently delete this issue? This cannot be undone.')) return;
                          try {
                            await deleteDoc(doc(db, 'issues', issue.id));
                          } catch (err) {
                            alert('Failed to delete');
                          }
                        }}
                        className="px-6 py-2.5 bg-red-600 cursor-pointer hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors min-w-[120px] text-center shadow-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Issue Modal */}
      <NewIssueModal
        isOpen={isNewIssueModalOpen}
        onClose={() => setIsNewIssueModalOpen(false)}
      />

      {/* Permission Denied Modal */}
      {showPermissionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Cannot Move Issue</h3>
            <p className="text-gray-700 mb-8">
              You can only drag and change the status of issues that you reported or are currently assigned to.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 cursor-pointer text-gray-800 font-medium rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}