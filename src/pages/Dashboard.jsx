import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Users, CalendarDays, Hotel, TrendingUp, ArrowLeft, Star, Clock } from "lucide-react";
import StatCard from "@/components/shared/StatCard";
import PageHeader from "@/components/shared/PageHeader";
import { Badge } from "@/components/ui/badge";
import moment from "moment";

const statusColors = {
  "مؤكد": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "قيد الانتظار": "bg-amber-50 text-amber-700 border-amber-200",
  "تم الوصول": "bg-blue-50 text-blue-700 border-blue-200",
  "مغادرة": "bg-stone-50 text-stone-600 border-stone-200",
  "ملغي": "bg-red-50 text-red-600 border-red-200",
};

export default function Dashboard() {
  const [guests, setGuests] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [g, r, u] = await Promise.all([
          base44.entities.Guest.list(),
          base44.entities.Reservation.list("-created_date", 50),
          base44.entities.Unit.list(),
        ]);
        setGuests(g);
        setReservations(r);
        setUnits(u);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const today = moment().format("YYYY-MM-DD");
  const activeReservations = reservations.filter(r => ["مؤكد", "تم الوصول"].includes(r.status));
  const todayArrivals = reservations.filter(r => r.check_in === today && r.status !== "ملغي");
  const todayDepartures = reservations.filter(r => r.check_out === today);
  const totalRevenue = reservations.filter(r => r.status !== "ملغي").reduce((sum, r) => sum + (r.paid_amount || 0), 0);
  const availableUnits = units.filter(u => u.status === "متاحة");
  const recentReservations = reservations.slice(0, 6);

  return (
    <div>
      <PageHeader
        title="لوحة التحكم"
        subtitle={`${moment().format("dddd، D MMMM YYYY")}`}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="إجمالي الضيوف" value={guests.length} color="blue" />
        <StatCard icon={CalendarDays} label="حجوزات نشطة" value={activeReservations.length} color="emerald" />
        <StatCard icon={Hotel} label="وحدات متاحة" value={`${availableUnits.length}/${units.length}`} color="purple" />
        <StatCard icon={TrendingUp} label="الإيرادات المحصلة" value={`${totalRevenue.toLocaleString()} ر.س`} color="amber" />
      </div>

      {/* Quick info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="font-heading font-semibold text-stone-700 text-sm">وصول اليوم</h3>
            <Badge variant="secondary" className="mr-auto text-xs">{todayArrivals.length}</Badge>
          </div>
          {todayArrivals.length === 0 ? (
            <p className="text-sm text-stone-400">لا يوجد وصول اليوم</p>
          ) : (
            <div className="space-y-2">
              {todayArrivals.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-stone-700">{r.guest_name}</p>
                    <p className="text-xs text-stone-400">{r.unit_name}</p>
                  </div>
                  <Badge className={`text-[10px] border ${statusColors[r.status]}`} variant="outline">{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-500" />
            <h3 className="font-heading font-semibold text-stone-700 text-sm">مغادرة اليوم</h3>
            <Badge variant="secondary" className="mr-auto text-xs">{todayDepartures.length}</Badge>
          </div>
          {todayDepartures.length === 0 ? (
            <p className="text-sm text-stone-400">لا يوجد مغادرة اليوم</p>
          ) : (
            <div className="space-y-2">
              {todayDepartures.map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-stone-700">{r.guest_name}</p>
                    <p className="text-xs text-stone-400">{r.unit_name}</p>
                  </div>
                  <Badge className={`text-[10px] border ${statusColors[r.status]}`} variant="outline">{r.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent reservations */}
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading font-semibold text-stone-700">آخر الحجوزات</h3>
          <Link to="/reservations" className="text-xs text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium">
            عرض الكل <ArrowLeft className="w-3 h-3" />
          </Link>
        </div>
        {recentReservations.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-8">لا توجد حجوزات بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-right py-3 px-2 text-xs font-medium text-stone-400">الضيف</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-stone-400">الوحدة</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-stone-400">الوصول</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-stone-400">المغادرة</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-stone-400">المبلغ</th>
                  <th className="text-right py-3 px-2 text-xs font-medium text-stone-400">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {recentReservations.map(r => (
                  <tr key={r.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className="py-3 px-2 font-medium text-stone-700">{r.guest_name}</td>
                    <td className="py-3 px-2 text-stone-500">{r.unit_name}</td>
                    <td className="py-3 px-2 text-stone-500">{r.check_in}</td>
                    <td className="py-3 px-2 text-stone-500">{r.check_out}</td>
                    <td className="py-3 px-2 text-stone-700 font-medium">{r.total_price?.toLocaleString()} ر.س</td>
                    <td className="py-3 px-2">
                      <Badge className={`text-[10px] border ${statusColors[r.status]}`} variant="outline">{r.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}