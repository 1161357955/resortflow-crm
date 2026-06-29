import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Phone, Plus, Search, PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneCall, Pencil, Trash2, Clock, AlertCircle } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";

const statusConfig = {
  "واردة":   { color: "bg-blue-50 text-blue-700 border-blue-200",   icon: PhoneIncoming },
  "صادرة":   { color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: PhoneOutgoing },
  "فائتة":   { color: "bg-red-50 text-red-600 border-red-200",     icon: PhoneMissed },
  "مكتملة":  { color: "bg-stone-50 text-stone-600 border-stone-200", icon: PhoneCall },
};

const callTypeColors = {
  "استفسار":    "bg-sky-50 text-sky-700 border-sky-200",
  "حجز جديد":  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "تعديل حجز": "bg-amber-50 text-amber-700 border-amber-200",
  "إلغاء":      "bg-orange-50 text-orange-700 border-orange-200",
  "شكوى":       "bg-red-50 text-red-600 border-red-200",
  "أخرى":       "bg-stone-50 text-stone-600 border-stone-200",
};

const emptyForm = {
  caller_name: "", caller_phone: "", guest_id: "", call_type: "استفسار",
  status: "واردة", duration_minutes: "", notes: "", assigned_to: "",
  follow_up_required: false, follow_up_date: "", reservation_id: ""
};

export default function Calls() {
  const [calls, setCalls] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCall, setEditCall] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [c, g] = await Promise.all([
        base44.entities.Call.list("-created_date", 200),
        base44.entities.Guest.list(),
      ]);
      setCalls(c);
      setGuests(g);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const openNew = () => {
    setEditCall(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEdit = (call) => {
    setEditCall(call);
    setForm({ ...call });
    setDialogOpen(true);
  };

  const selectGuest = (guestId) => {
    const guest = guests.find(g => g.id === guestId);
    if (guest) setForm(f => ({ ...f, guest_id: guest.id, caller_name: guest.full_name, caller_phone: guest.phone }));
  };

  const handleSave = async () => {
    if (!form.caller_phone) {
      toast({ title: "خطأ", description: "رقم الجوال مطلوب", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editCall) {
        await base44.entities.Call.update(editCall.id, form);
      } else {
        await base44.entities.Call.create(form);
      }
      setDialogOpen(false);
      loadData();
      toast({ title: editCall ? "تم التحديث" : "تم تسجيل المكالمة" });
    } catch (e) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه المكالمة؟")) return;
    await base44.entities.Call.delete(id);
    loadData();
    toast({ title: "تم الحذف" });
  };

  const filtered = useMemo(() => calls.filter(c => {
    const matchSearch = c.caller_name?.toLowerCase().includes(search.toLowerCase()) || c.caller_phone?.includes(search);
    const matchStatus = statusFilter === "الكل" || c.status === statusFilter;
    return matchSearch && matchStatus;
  }), [calls, search, statusFilter]);

  // Stats
  const today = moment().format("YYYY-MM-DD");
  const todayCalls = calls.filter(c => moment(c.created_date).format("YYYY-MM-DD") === today);
  const missedCalls = calls.filter(c => c.status === "فائتة");
  const followUps = calls.filter(c => c.follow_up_required && c.status !== "مكتملة");

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="استقبال المكالمات"
        subtitle={`${calls.length} مكالمة مسجلة`}
        actions={
          <Button onClick={openNew} className="bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-200/50 rounded-xl">
            <Plus className="w-4 h-4 ml-2" /> تسجيل مكالمة
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-4 text-center">
          <p className="text-2xl font-heading font-bold text-stone-800">{todayCalls.length}</p>
          <p className="text-xs text-stone-400 mt-1">مكالمات اليوم</p>
        </div>
        <div className="bg-red-50/70 rounded-2xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-heading font-bold text-red-600">{missedCalls.length}</p>
          <p className="text-xs text-red-400 mt-1">مكالمات فائتة</p>
        </div>
        <div className="bg-amber-50/70 rounded-2xl border border-amber-100 p-4 text-center">
          <p className="text-2xl font-heading font-bold text-amber-600">{followUps.length}</p>
          <p className="text-xs text-amber-400 mt-1">تحتاج متابعة</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <Input placeholder="بحث بالاسم أو الجوال..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10 rounded-xl border-stone-200/60 bg-white/70" />
        </div>
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList className="bg-white/70 border border-stone-200/60 rounded-xl h-10">
            {["الكل", "واردة", "صادرة", "فائتة", "مكتملة"].map(s => (
              <TabsTrigger key={s} value={s} className="rounded-lg text-xs">{s}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Phone}
          title="لا توجد مكالمات"
          description="سجّل أول مكالمة للبدء"
          action={<Button onClick={openNew} variant="outline" className="rounded-xl"><Plus className="w-4 h-4 ml-2" /> تسجيل مكالمة</Button>}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(call => {
            const StatusIcon = statusConfig[call.status]?.icon || Phone;
            return (
              <div key={call.id} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-4 hover:shadow-md hover:shadow-stone-100 transition-all duration-200 group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      call.status === "فائتة" ? "bg-red-100" : call.status === "واردة" ? "bg-blue-100" : call.status === "صادرة" ? "bg-emerald-100" : "bg-stone-100"
                    }`}>
                      <StatusIcon className={`w-4 h-4 ${
                        call.status === "فائتة" ? "text-red-500" : call.status === "واردة" ? "text-blue-500" : call.status === "صادرة" ? "text-emerald-500" : "text-stone-400"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-stone-800 text-sm">{call.caller_name || "غير معروف"}</p>
                        <p className="text-xs text-stone-400">{call.caller_phone}</p>
                        {call.follow_up_required && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                            <AlertCircle className="w-3 h-3" /> متابعة مطلوبة
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge className={`text-[10px] border ${statusConfig[call.status]?.color}`} variant="outline">{call.status}</Badge>
                        <Badge className={`text-[10px] border ${callTypeColors[call.call_type]}`} variant="outline">{call.call_type}</Badge>
                        {call.duration_minutes && (
                          <span className="flex items-center gap-1 text-xs text-stone-400"><Clock className="w-3 h-3" />{call.duration_minutes} دقيقة</span>
                        )}
                        <span className="text-xs text-stone-400">{moment(call.created_date).format("D MMM، h:mm a")}</span>
                      </div>
                      {call.notes && <p className="text-xs text-stone-500 mt-1.5 line-clamp-1">{call.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(call)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => handleDelete(call.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading">{editCall ? "تعديل المكالمة" : "تسجيل مكالمة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-stone-500 mb-1.5 block">ربط بضيف مسجل</Label>
              <Select value={form.guest_id || ""} onValueChange={selectGuest}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر ضيف (اختياري)..." /></SelectTrigger>
                <SelectContent>
                  {guests.map(g => <SelectItem key={g.id} value={g.id}>{g.full_name} - {g.phone}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">اسم المتصل</Label>
                <Input value={form.caller_name || ""} onChange={e => setForm({...form, caller_name: e.target.value})} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">رقم الجوال *</Label>
                <Input value={form.caller_phone || ""} onChange={e => setForm({...form, caller_phone: e.target.value})} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">نوع المكالمة</Label>
                <Select value={form.call_type || "استفسار"} onValueChange={v => setForm({...form, call_type: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["استفسار", "حجز جديد", "تعديل حجز", "إلغاء", "شكوى", "أخرى"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">الحالة</Label>
                <Select value={form.status || "واردة"} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["واردة", "صادرة", "فائتة", "مكتملة"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">مدة المكالمة (دقيقة)</Label>
                <Input type="number" min={0} value={form.duration_minutes || ""} onChange={e => setForm({...form, duration_minutes: Number(e.target.value)})} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">المسؤول</Label>
                <Input value={form.assigned_to || ""} onChange={e => setForm({...form, assigned_to: e.target.value})} className="rounded-xl" placeholder="اسم الموظف" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-stone-500 mb-1.5 block">ملاحظات</Label>
              <Textarea value={form.notes || ""} onChange={e => setForm({...form, notes: e.target.value})} className="rounded-xl" rows={3} placeholder="تفاصيل المكالمة..." />
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <Switch checked={form.follow_up_required || false} onCheckedChange={v => setForm({...form, follow_up_required: v})} />
              <Label className="text-sm text-stone-700">تحتاج متابعة</Label>
              {form.follow_up_required && (
                <Input type="date" value={form.follow_up_date || ""} onChange={e => setForm({...form, follow_up_date: e.target.value})} className="rounded-xl mr-auto w-36 text-xs" />
              )}
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl">
              {saving ? "جاري الحفظ..." : (editCall ? "تحديث" : "تسجيل المكالمة")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}