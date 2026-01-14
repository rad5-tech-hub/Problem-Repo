// src/components/EmptyState.jsx
export function EmptyState({ title = "Nothing here yet", message = "Create a new issue to get started" }) {
  return (
    <div className="bg-white rounded-lg p-10 text-center border border-dashed border-gray-300">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{message}</p>
    </div>
  );
}