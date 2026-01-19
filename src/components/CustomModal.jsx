// Reusable Custom Alert Modal
const CustomAlertModal = ({ isOpen, onClose, title, message, type = 'error' }) => {
  if (!isOpen) return null;

  const typeStyles = {
	error: 'bg-red-50 border-red-200 text-red-700',
	warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
	info: 'bg-blue-50 border-blue-200 text-blue-700',
	success: 'bg-green-50 border-green-200 text-green-700',
  };

  return (
	<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
	  <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
		<h3 className={`text-2xl font-bold mb-4 ${typeStyles[type].split(' ')[2]}`}>
		  {title}
		</h3>
		<p className="text-gray-700 mb-8">{message}</p>
		<div className="flex justify-end">
		  <button
			onClick={onClose}
			className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
		  >
			Got it
		  </button>
		</div>
	  </div>
	</div>
  );
};
export default CustomAlertModal;