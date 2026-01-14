// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import IssueCard from '../components/IssueCard';

const columns = [
  { id: 'Open', title: 'Open', color: 'border-yellow-400' },
  { id: 'In Progress', title: 'In Progress', color: 'border-blue-400' },
  { id: 'Resolved', title: 'Resolved', color: 'border-green-400' },
];

export default function Dashboard() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'issues'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const issuesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setIssues(issuesData);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching issues:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getIssuesByStatus = (status) => 
    issues.filter(issue => issue.status === status);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">All issues — fully transparent</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columns.map(column => (
          <div key={column.id} className="flex flex-col">
            <div className={`
              px-5 py-3 rounded-t-lg bg-white border-t-4 ${column.color} 
              font-medium text-gray-800 mb-3 sticky top-0 z-10
            `}>
              {column.title} ({getIssuesByStatus(column.id).length})
            </div>

            <div className="space-y-4 flex-1">
              {getIssuesByStatus(column.id).length === 0 ? (
                <div className="bg-white rounded-lg p-8 text-center text-gray-500 border border-dashed border-gray-300">
                  No issues here yet
                </div>
              ) : (
                getIssuesByStatus(column.id).map(issue => (
                  <IssueCard key={issue.id} issue={issue} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}