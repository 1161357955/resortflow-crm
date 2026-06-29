import React from "react";

export default function StatCard({ icon: Icon, label, value, subtitle, color = "amber" }) {
  const colorMap = {
    amber: "from-amber-500 to-amber-600 shadow-amber-200/50",
    emerald: "from-emerald-500 to-emerald-600 shadow-emerald-200/50",
    blue: "from-blue-500 to-blue-600 shadow-blue-200/50",
    purple: "from-purple-500 to-purple-600 shadow-purple-200/50",
    rose: "from-rose-500 to-rose-600 shadow-rose-200/50",
  };

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5 hover:shadow-lg hover:shadow-stone-100/80 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-heading font-bold text-stone-800">{value}</p>
          {subtitle && <p className="text-xs text-stone-400">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}