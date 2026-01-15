// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import IssueCard from '../components/IssueCard';
import NewIssueModal from '../components/NewIssueModal';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const columns = [
  { id: 'Open', title: 'Open', color: 'border-yellow-400' },
  { id: 'In Progress', title: 'In Progress', color: 'border-blue-400' },
  { id: 'Resolved', title: 'Resolved', color: 'border-green-400' },
];

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewIssueModalOpen, setIsNewIssueModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issuesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setIssues(issuesData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching issues:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getIssuesByStatus = (status) => issues.filter((issue) => issue.status === status);

  // Handle drag end - update status in Firestore
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Same column, no change needed
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId;

    // Optimistic UI update
    setIssues((prevIssues) =>
      prevIssues.map((issue) =>
        issue.id === draggableId ? { ...issue, status: newStatus } : issue
      )
    );

    try {
      // Update Firestore
      const issueRef = doc(db, 'issues', draggableId);
      await updateDoc(issueRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to update issue status:', error);
      // Rollback optimistic update on error
      setIssues((prevIssues) =>
        prevIssues.map((issue) =>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">All issues — fully transparent</p>
        </div>

        <button
          onClick={() => setIsNewIssueModalOpen(true)}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          New Issue
        </button>
      </div>

      {/* Kanban Board with Drag & Drop */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map((column) => (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided) => (
                <div
                  className="flex flex-col bg-gray-50 rounded-xl border border-gray-200 shadow-sm min-h-[500px]"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {/* Column Header */}
                  <div
                    className={`
                      px-6 py-4 rounded-t-xl bg-white border-t-4 ${column.color}
                      font-semibold text-gray-800 shadow-sm sticky top-0 z-10
                    `}
                  >
                    {column.title} ({getIssuesByStatus(column.id).length})
                  </div>

                  {/* Issues List */}
                  <div className="p-4 space-y-4 flex-1">
                    {getIssuesByStatus(column.id).length === 0 ? (
                      <div className="bg-white rounded-lg p-8 text-center text-gray-500 border border-dashed border-gray-300">
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
                                snapshot.isDragging ? 'opacity-75 scale-105 shadow-2xl' : ''
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

      {/* New Issue Modal */}
      <NewIssueModal
        isOpen={isNewIssueModalOpen}
        onClose={() => setIsNewIssueModalOpen(false)}
      />
    </div>
  );
}