import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { CalendarDays, Plus, Search, Filter, Pencil, Trash2, Eye } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const statusColors = {
  "مؤكد": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "قيد الانتظار": "bg-amber-50 text-amber-700 border-amber-200",
  "تم الوصول": "bg-blue-50 text-blue-700 border-blue-200",
  "مغادرة": "bg-stone-50 text-stone-600 border-stone-200",
  "ملغي": "bg-red-50 text-red-600 border-red-200",
};

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [guests, setGuests] = useState([]);
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editRes, setEditRes] = useState(null);
  const [viewRes, setViewRes] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [r, g, u] = await Promise.all([
        base44.entities.Reservation.list("-created_date", 100),
        base44.entities.Guest.list(),
        base44.entities.Unit.list(),
      ]);
      setReservations(r);
      setGuests(g);
      setUnits(u);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => {
    setEditRes(null);
    setForm({
      guest_id: "", guest_name: "", guest_phone: "", unit_id: "", unit_name: "",
      check_in: "", check_out: "", nights: 0, adults: 1, children: 0,
      total_price: 0, paid_amount: 0, status: "قيد الانتظار",
      payment_method: "", source: "مباشر", special_requests: "", notes: ""
    });
    setDialogOpen(true);
  };

  const openEdit = (res) => {
    setEditRes(res);
    setForm({ ...res });
    setDialogOpen(true);
  };

  const selectGuest = (guestId) => {
    const guest = guests.find(g => g.id === guestId);
    if (guest) {
      setForm(f => ({ ...f, guest_id: guest.id, guest_name: guest.full_name, guest_phone: guest.phone }));
    }
  };

  const selectUnit = (unitId) => {
    const unit = units.find(u => u.id === unitId);
    if (unit) {
      setForm(f => {
        const nights = f.check_in && f.check_out ? moment(f.check_out).diff(moment(f.check_in), "days") : 0;
        return { ...f, unit_id: unit.id, unit_name: unit.name, total_price: nights > 0 ? nights * unit.price_per_night : f.total_price };
      });
    }
  };

  const calcNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const nights = moment(checkOut).diff(moment(checkIn), "days");
    return nights > 0 ? nights : 0;
  };

  const handleDateChange = (field, value) => {
    setForm(f => {
      const updated = { ...f, [field]: value };
      const nights = calcNights(updated.check_in, updated.check_out);
      updated.nights = nights;
      const unit = units.find(u => u.id === updated.unit_id);
      if (unit && nights > 0) {
        updated.total_price = nights * unit.price_per_night;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!form.guest_name || !form.guest_phone || !form.unit_id || !form.check_in || !form.check_out) {
      toast({ title: "خطأ", description: "جميع الحقول المطلوبة يجب تعبئتها", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = { ...form, nights: calcNights(form.check_in, form.check_out) };
      if (editRes) {
        await base44.entities.Reservation.update(editRes.id, data);
      } else {
        await base44.entities.Reservation.create(data);
      }
      setDialogOpen(false);
      loadData();
      toast({ title: editRes ? "تم التحديث" : "تمت الإضافة" });
    } catch (e) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذا الحجز؟")) return;
    await base44.entities.Reservation.delete(id);
    loadData();
    toast({ title: "تم الحذف" });
  };

  const filtered = useMemo(() => {
    return reservations.filter(r => {
      const matchSearch = r.guest_name?.toLowerCase().includes(search.toLowerCase()) || r.unit_name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "الكل" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reservations, search, statusFilter]);

  const availableUnits = units.filter(u => u.status === "متاحة");

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="إدارة الحجوزات"
        subtitle={`${reservations.length} حجز`}
        actions={
          <Button onClick={openNew} className="bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-200/50 rounded-xl">
            <Plus className="w-4 h-4 ml-2" /> حجز جديد
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input
            placeholder="بحث بالاسم أو الوحدة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pr-10 rounded-xl border-stone-200/60 bg-white/70"
          />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-white/70 border border-stone-200/60 rounded-xl h-10">
            <TabsTrigger value="الكل" className="rounded-lg text-xs">الكل</TabsTrigger>
            <TabsTrigger value="قيد الانتظار" className="rounded-lg text-xs">انتظار</TabsTrigger>
            <TabsTrigger value="مؤكد" className="rounded-lg text-xs">مؤكد</TabsTrigger>
            <TabsTrigger value="تم الوصول" className="rounded-lg text-xs">وصول</TabsTrigger>
            <TabsTrigger value="مغادرة" className="rounded-lg text-xs">مغادرة</TabsTrigger>
            <TabsTrigger value="ملغي" className="rounded-lg text-xs">ملغي</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="لا توجد حجوزات"
          description="أنشئ أول حجز للبدء"
          action={<Button onClick={openNew} variant="outline" className="rounded-xl"><Plus className="w-4 h-4 ml-2" /> حجز جديد</Button>}
        />
      ) : (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="text-right py-3 px-4 text-xs font-medium text-stone-400">الضيف</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-stone-400">الوحدة</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-stone-400">الوصول</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-stone-400">المغادرة</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-stone-400">الليالي</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-stone-400">المبلغ</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-stone-400">المدفوع</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-stone-400">الحالة</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-stone-400">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-stone-700">{r.guest_name}</p>
                        <p className="text-xs text-stone-400">{r.guest_phone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-stone-600">{r.unit_name}</td>
                    <td className="py-3 px-4 text-stone-500">{r.check_in}</td>
                    <td className="py-3 px-4 text-stone-500">{r.check_out}</td>
                    <td className="py-3 px-4 text-stone-500">{r.nights || "-"}</td>
                    <td className="py-3 px-4 font-medium text-stone-700">{r.total_price?.toLocaleString()}</td>
                    <td className="py-3 px-4 text-stone-500">{(r.paid_amount || 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge className={`text-[10px] border ${statusColors[r.status]}`} variant="outline">{r.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setViewRes(r); setViewDialogOpen(true); }}><Eye className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => handleDelete(r.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading">تفاصيل الحجز</DialogTitle>
          </DialogHeader>
          {viewRes && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-stone-400">الضيف</span><span className="font-medium text-stone-700">{viewRes.guest_name}</span>
                <span className="text-stone-400">الجوال</span><span className="text-stone-600">{viewRes.guest_phone}</span>
                <span className="text-stone-400">الوحدة</span><span className="text-stone-600">{viewRes.unit_name}</span>
                <span className="text-stone-400">الوصول</span><span className="text-stone-600">{viewRes.check_in}</span>
                <span className="text-stone-400">المغادرة</span><span className="text-stone-600">{viewRes.check_out}</span>
                <span className="text-stone-400">الليالي</span><span className="text-stone-600">{viewRes.nights}</span>
                <span className="text-stone-400">البالغين</span><span className="text-stone-600">{viewRes.adults}</span>
                <span className="text-stone-400">الأطفال</span><span className="text-stone-600">{viewRes.children || 0}</span>
                <span className="text-stone-400">المبلغ الإجمالي</span><span className="font-semibold text-stone-700">{viewRes.total_price?.toLocaleString()} ر.س</span>
                <span className="text-stone-400">المدفوع</span><span className="text-stone-600">{(viewRes.paid_amount || 0).toLocaleString()} ر.س</span>
                <span className="text-stone-400">طريقة الدفع</span><span className="text-stone-600">{viewRes.payment_method || "-"}</span>
                <span className="text-stone-400">المصدر</span><span className="text-stone-600">{viewRes.source || "-"}</span>
                <span className="text-stone-400">الحالة</span>
                <Badge className={`text-[10px] border w-fit ${statusColors[viewRes.status]}`} variant="outline">{viewRes.status}</Badge>
              </div>
              {viewRes.special_requests && (
                <div>
                  <p className="text-xs text-stone-400 mb-1">طلبات خاصة</p>
                  <p className="text-sm text-stone-600 bg-stone-50 rounded-xl p-3">{viewRes.special_requests}</p>
                </div>
              )}
              {viewRes.notes && (
                <div>
                  <p className="text-xs text-stone-400 mb-1">ملاحظات</p>
                  <p className="text-sm text-stone-600 bg-stone-50 rounded-xl p-3">{viewRes.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading">{editRes ? "تعديل الحجز" : "حجز جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Guest selection */}
            <div>
              <Label className="text-xs text-stone-500 mb-1.5 block">اختر ضيف مسجل أو أدخل البيانات</Label>
              <Select value={form.guest_id || ""} onValueChange={selectGuest}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر ضيف..." /></SelectTrigger>
                <SelectContent>
                  {guests.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.full_name} - {g.phone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">اسم الضيف *</Label>
                <Input value={form.guest_name || ""} onChange={e => setForm({...form, guest_name: e.target.value})} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">جوال الضيف *</Label>
                <Input value={form.guest_phone || ""} onChange={e => setForm({...form, guest_phone: e.target.value})} className="rounded-xl" />
              </div>
            </div>

            {/* Unit */}
            <div>
              <Label className="text-xs text-stone-500 mb-1.5 block">الوحدة *</Label>
              <Select value={form.unit_id || ""} onValueChange={selectUnit}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر وحدة..." /></SelectTrigger>
                <SelectContent>
                  {(editRes ? units : availableUnits).map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name} - {u.type} ({u.price_per_night?.toLocaleString()} ر.س/ليلة)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">تاريخ الوصول *</Label>
                <Input type="date" value={form.check_in || ""} onChange={e => handleDateChange("check_in", e.target.value)} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">تاريخ المغادرة *</Label>
                <Input type="date" value={form.check_out || ""} onChange={e => handleDateChange("check_out", e.target.value)} className="rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">بالغين</Label>
                <Input type="number" min={1} value={form.adults || 1} onChange={e => setForm({...form, adults: Number(e.target.value)})} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">أطفال</Label>
                <Input type="number" min={0} value={form.children || 0} onChange={e => setForm({...form, children: Number(e.target.value)})} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">الليالي</Label>
                <Input type="number" value={form.nights || 0} disabled className="rounded-xl bg-stone-50" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">المبلغ الإجمالي</Label>
                <Input type="number" value={form.total_price || 0} onChange={e => setForm({...form, total_price: Number(e.target.value)})} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">المبلغ المدفوع</Label>
                <Input type="number" value={form.paid_amount || 0} onChange={e => setForm({...form, paid_amount: Number(e.target.value)})} className="rounded-xl" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">الحالة</Label>
                <Select value={form.status || "قيد الانتظار"} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["مؤكد", "قيد الانتظار", "تم الوصول", "مغادرة", "ملغي"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">الدفع</Label>
                <Select value={form.payment_method || ""} onValueChange={v => setForm({...form, payment_method: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    {["نقدي", "بطاقة", "تحويل بنكي", "أخرى"].map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">المصدر</Label>
                <Select value={form.source || "مباشر"} onValueChange={v => setForm({...form, source: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["مباشر", "هاتف", "موقع إلكتروني", "بوكينق", "أخرى"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-stone-500 mb-1.5 block">طلبات خاصة</Label>
              <Textarea value={form.special_requests || ""} onChange={e => setForm({...form, special_requests: e.target.value})} className="rounded-xl" rows={2} />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl">
              {saving ? "جاري الحفظ..." : (editRes ? "تحديث" : "إنشاء الحجز")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}