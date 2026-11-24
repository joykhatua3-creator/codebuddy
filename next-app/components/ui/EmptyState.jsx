'use client';

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
    {Icon && <div className="p-4 bg-gray-100 rounded-full"><Icon size={32} className="text-gray-400" /></div>}
    <div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1 text-sm text-gray-500 max-w-sm">{description}</p>}
    </div>
    {actionLabel && onAction && (
      <button onClick={onAction} className="btn btn-primary">{actionLabel}</button>
    )}
  </div>
);

export default EmptyState;
