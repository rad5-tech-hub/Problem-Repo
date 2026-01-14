// src/pages/Resolved.jsx
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import IssueCard from '../components/IssueCard';
import { EmptyState } from '../components/EmptyState'; // optional, from earlier suggestion

export default function Resolved() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'issues'),
      where('status', '==', 'Resolved'),
      orderBy('resolvedAt', 'desc') // will fallback to createdAt if no resolvedAt
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const resolvedIssues = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setIssues(resolvedIssues);
      setLoading(false);
    }, (err) => {
      console.error('Error loading resolved issues:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Resolved Issues</h1>
      <p className="text-gray-600 mb-8">All issues that have been completed</p>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : issues.length === 0 ? (
        <EmptyState 
          title="No resolved issues yet"
          message="When issues get completed, they'll appear here"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {issues.map(issue => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}