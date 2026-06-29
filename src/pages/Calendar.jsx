import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronRight, ChevronLeft, CalendarDays, Users, Hotel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

const STATUS_COLORS = {
  "مؤكد":        { bg: "bg-emerald-500", light: "bg-emerald-100 border-emerald-300 text-emerald-800" },
  "قيد الانتظار":{ bg: "bg-amber-400",   light: "bg-amber-100 border-amber-300 text-amber-800" },
  "تم الوصول":   { bg: "bg-blue-500",    light: "bg-blue-100 border-blue-300 text-blue-800" },
  "مغادرة":      { bg: "bg-stone-400",   light: "bg-stone-100 border-stone-300 text-stone-700" },
  "ملغي":        { bg: "bg-red-400",     light: "bg-red-100 border-red-300 text-red-700" },
};

export default function Calendar() {
  const [reservations, setReservations] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(moment().startOf("month"));
  const [selected, setSelected] = useState(null); // selected reservation popup

  useEffect(() => {
    Promise.all([
      base44.entities.Reservation.list("-check_in", 200),
      base44.entities.Unit.list(),
    ]).then(([r, u]) => { setReservations(r); setUnits(u); })
      .finally(() => setLoading(false));
  }, []);

  // Build days of current month grid (with padding)
  const { days, startPad } = useMemo(() => {
    const start = currentMonth.clone().startOf("month");
    const end = currentMonth.clone().endOf("month");
    const days = [];
    for (let d = start.clone(); d.isSameOrBefore(end); d.add(1, "day")) {
      days.push(d.clone());
    }
    // Sunday=0 ... in Arabic we want Saturday first? Use Sunday as week start (0)
    // Pad so day 1 falls on correct weekday (0=Sun)
    const pad = start.day(); // 0=Sun
    return { days, startPad: pad };
  }, [currentMonth]);

  // Reservations that overlap a given day
  const resForDay = useMemo(() => {
    const map = {};
    days.forEach(day => {
      const key = day.format("YYYY-MM-DD");
      map[key] = reservations.filter(r => {
        if (!r.check_in || !r.check_out || r.status === "ملغي") return false;
        return day.isSameOrAfter(moment(r.check_in)) && day.isBefore(moment(r.check_out));
      });
    });
    return map;
  }, [days, reservations]);

  // Stats for current month
  const monthStats = useMemo(() => {
    const monthRes = reservations.filter(r => {
      if (!r.check_in) return false;
      return moment(r.check_in).isSame(currentMonth, "month");
    });
    const active = monthRes.filter(r => r.status !== "ملغي");
    const revenue = active.reduce((s, r) => s + (r.total_price || 0), 0);
    return { total: monthRes.length, active: active.length, revenue };
  }, [reservations, currentMonth]);

  const weekDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-stone-800">تقويم الحجوزات</h1>
          <p className="text-stone-400 text-sm mt-0.5">عرض مرئي لجميع الحجوزات حسب الأيام</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setCurrentMonth(m => m.clone().subtract(1, "month"))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="px-4 py-2 bg-white border border-stone-200/60 rounded-xl text-sm font-semibold text-stone-700 min-w-[130px] text-center">
            {currentMonth.format("MMMM YYYY")}
          </span>
          <Button variant="outline" size="icon" className="rounded-xl" onClick={() => setCurrentMonth(m => m.clone().add(1, "month"))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="rounded-xl text-sm" onClick={() => setCurrentMonth(moment().startOf("month"))}>
            اليوم
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-stone-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-stone-400">حجوزات الشهر</p>
            <p className="text-xl font-bold text-stone-800">{monthStats.total}</p>
          </div>
        </div>
        <div className="bg-white border border-stone-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Hotel className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-stone-400">حجوزات فعالة</p>
            <p className="text-xl font-bold text-stone-800">{monthStats.active}</p>
          </div>
        </div>
        <div className="bg-white border border-stone-200/60 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-stone-400">الإيرادات</p>
            <p className="text-xl font-bold text-stone-800">{monthStats.revenue.toLocaleString()} <span className="text-xs font-normal text-stone-400">ر.س</span></p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${colors.light}`}>
            <span className={`w-2 h-2 rounded-full ${colors.bg}`} />
            {status}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-stone-200/60 rounded-2xl overflow-hidden shadow-sm">
        {/* Week headers */}
        <div className="grid grid-cols-7 border-b border-stone-100">
          {weekDays.map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-semibold text-stone-400">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {/* Padding cells */}
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="min-h-[100px] border-b border-l border-stone-50 bg-stone-50/30" />
          ))}

          {days.map((day) => {
            const key = day.format("YYYY-MM-DD");
            const dayRes = resForDay[key] || [];
            const isToday = day.isSame(moment(), "day");
            const isWeekend = day.day() === 5 || day.day() === 6;

            return (
              <div
                key={key}
                className={`min-h-[100px] border-b border-l border-stone-100 p-1.5 ${isWeekend ? "bg-amber-50/20" : "bg-white"} hover:bg-stone-50/50 transition-colors`}
              >
                {/* Day number */}
                <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-amber-500 text-white" : "text-stone-500"}`}>
                  {day.date()}
                </div>

                {/* Reservations */}
                <div className="space-y-0.5">
                  {dayRes.slice(0, 3).map(r => {
                    const colors = STATUS_COLORS[r.status] || STATUS_COLORS["قيد الانتظار"];
                    const isStart = day.isSame(moment(r.check_in), "day");
                    return (
                      <button
                        key={r.id}
                        onClick={() => setSelected(selected?.id === r.id ? null : r)}
                        className={`w-full text-right text-[10px] px-1.5 py-0.5 rounded truncate border font-medium ${colors.light} hover:opacity-80 transition-opacity`}
                        title={`${r.guest_name} — ${r.unit_name}`}
                      >
                        {isStart ? "▶ " : ""}{r.guest_name}
                      </button>
                    );
                  })}
                  {dayRes.length > 3 && (
                    <p className="text-[9px] text-stone-400 px-1">+{dayRes.length - 3} أكثر</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Reservation Card */}
      {selected && (
        <div className="fixed bottom-6 left-6 right-6 sm:right-auto sm:w-80 bg-white rounded-2xl shadow-2xl border border-stone-200/60 p-5 z-50" dir="rtl">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-heading font-bold text-stone-800">{selected.guest_name}</p>
              <p className="text-xs text-stone-400">{selected.guest_phone}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`text-[10px] border ${(STATUS_COLORS[selected.status] || {}).light}`} variant="outline">
                {selected.status}
              </Badge>
              <button onClick={() => setSelected(null)} className="text-stone-300 hover:text-stone-600 text-lg leading-none">×</button>
            </div>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-stone-400">الوحدة</span>
              <span className="font-medium text-stone-700">{selected.unit_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">الوصول</span>
              <span className="text-stone-600">{selected.check_in}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">المغادرة</span>
              <span className="text-stone-600">{selected.check_out}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-400">الليالي</span>
              <span className="text-stone-600">{selected.nights} ليالٍ</span>
            </div>
            <div className="flex justify-between border-t border-stone-100 pt-2">
              <span className="text-stone-400">الإجمالي</span>
              <span className="font-bold text-amber-600">{selected.total_price?.toLocaleString()} ر.س</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}