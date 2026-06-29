import React from "react";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-stone-300" />
        </div>
      )}
      <h3 className="text-lg font-heading font-semibold text-stone-600 mb-1">{title}</h3>
      {description && <p className="text-sm text-stone-400 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}