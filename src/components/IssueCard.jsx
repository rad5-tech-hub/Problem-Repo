import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

const statusColors = {
  Open: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-300',
  Resolved: 'bg-green-100 text-green-800 border-green-300',
};

const categoryColors = {
  Academy: 'bg-purple-100 text-purple-800',
  Management: 'bg-indigo-100 text-indigo-800',
  Hub: 'bg-cyan-100 text-cyan-800',
  External: 'bg-pink-100 text-pink-800',
  Other: 'bg-gray-100 text-gray-800',
};

export default function IssueCard({ issue }) {
  const createdAt = issue.createdAt?.toDate
    ? issue.createdAt.toDate()
    : new Date(issue.createdAt);

  return (
    <Link
      to={`/issues/${issue.id}`}
      className="
        block bg-white rounded-lg border border-gray-200 
        shadow-sm hover:shadow-md hover:border-primary 
        transition-all duration-150 overflow-hidden
      "
    >
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap gap-2 mb-3">
          <span
            className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full 
              text-xs font-medium border ${statusColors[issue.status] || 'bg-gray-100 text-gray-800'}
            `}
          >
            {issue.status}
          </span>

          <span
            className={`
              inline-flex items-center px-2.5 py-0.5 rounded-full 
              text-xs font-medium ${categoryColors[issue.category] || 'bg-gray-100 text-gray-800'}
            `}
          >
            {issue.category}
          </span>
        </div>

        <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
          {issue.title}
        </h3>

        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {issue.description || 'No description provided'}
        </p>


        <div className="flex items-center justify-between text-xs text-gray-500">
          <div>
            <span>By </span>
            <span className="font-medium text-gray-700">{issue.reporterName?.split(' ')[0] || 'Someone'}</span>
          </div>

          <div className="flex items-center gap-1">
            {issue.assignees?.length > 0 ? (
              <>
                <span className="text-blue-600">Assigned to:</span>
                <div className="flex -space-x-2">
                  {issue.assignees.slice(0, 3).map(a => (
                    <div key={a.uid} className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-bold text-blue-800">
                      {a.name[0].toUpperCase()}
                    </div>
                  ))}
                  {issue.assignees.length > 3 && (
                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs">
                      +{issue.assignees.length - 3}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span>Unassigned</span>
            )}
          </div>

          <time title={createdAt.toLocaleString()}>
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </time>
        </div>
      </div>
    </Link>
  );
}