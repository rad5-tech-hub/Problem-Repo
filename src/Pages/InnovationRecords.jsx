
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInnovationsWithListener } from '../lib/innovations';
import { format } from 'date-fns';

export default function InnovationRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);


const statusColors = {
  Unattended: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-300',
  Solved: 'bg-green-100 text-green-800 border-green-300',
  Completed: 'bg-gray-100 text-gray-800 border-gray-300',
};

  useEffect(() => {
    const unsubscribe = getInnovationsWithListener((data) => {
      setRecords(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Innovation Records</h1>
      <p className="text-gray-600 mb-8">Track problems, solutions, and improvements</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {records.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500 border border-dashed border-gray-300 col-span-full">
            No records yet. Create one to start.
          </div>
        ) : (
          records.map(record => (
            <Link key={record.id} to={`/innovation-records/${record.id}`} className="block bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-primary transition-all">
            <div className="p-6">
  <div className="flex gap-2 mb-3">
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[record.status] || 'bg-gray-100 text-gray-800'}`}>
      {record.status}
    </span>
  </div>
  <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">{record.problem}</h3>
  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{record.solution || 'No solution yet'}</p>
  <div className="flex justify-between text-xs text-gray-500">
    <span>Team: {record.participants.length}</span>
    <span>Started: {record.startDate?.toDate() ? format(record.startDate.toDate(), 'MMM d, yyyy') : '—'}</span>
  </div>
</div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}