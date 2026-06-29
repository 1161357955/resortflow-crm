import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Users, Plus, Search, Phone, Mail, Star, Pencil, Trash2 } from "lucide-react";
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
import { useToast } from "@/components/ui/use-toast";

export default function Guests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editGuest, setEditGuest] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadGuests = async () => {
    try {
      const data = await base44.entities.Guest.list("-created_date");
      setGuests(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadGuests(); }, []);

  const openNew = () => {
    setEditGuest(null);
    setForm({ full_name: "", phone: "", email: "", nationality: "", id_type: "", id_number: "", gender: "", vip: false, notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (guest) => {
    setEditGuest(guest);
    setForm({ ...guest });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.phone) {
      toast({ title: "خطأ", description: "الاسم ورقم الجوال مطلوبان", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editGuest) {
        await base44.entities.Guest.update(editGuest.id, form);
      } else {
        await base44.entities.Guest.create(form);
      }
      setDialogOpen(false);
      loadGuests();
      toast({ title: editGuest ? "تم التحديث" : "تم الإضافة" });
    } catch (e) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذا الضيف؟")) return;
    await base44.entities.Guest.delete(id);
    loadGuests();
    toast({ title: "تم الحذف" });
  };

  const filtered = guests.filter(g =>
    g.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    g.phone?.includes(search) ||
    g.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="إدارة الضيوف"
        subtitle={`${guests.length} ضيف مسجل`}
        actions={
          <Button onClick={openNew} className="bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-200/50 rounded-xl">
            <Plus className="w-4 h-4 ml-2" /> إضافة ضيف
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-6 relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <Input
          placeholder="بحث بالاسم أو الجوال أو الإيميل..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pr-10 rounded-xl border-stone-200/60 bg-white/70"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="لا يوجد ضيوف"
          description="أضف أول ضيف للبدء"
          action={<Button onClick={openNew} variant="outline" className="rounded-xl"><Plus className="w-4 h-4 ml-2" /> إضافة ضيف</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(guest => (
            <div key={guest.id} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5 hover:shadow-lg hover:shadow-stone-100/80 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-200/50">
                    {guest.full_name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-stone-800 text-sm flex items-center gap-1">
                      {guest.full_name}
                      {guest.vip && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                    </h3>
                    {guest.nationality && <p className="text-xs text-stone-400">{guest.nationality}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(guest)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => handleDelete(guest.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-stone-500">
                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{guest.phone}</div>
                {guest.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{guest.email}</div>}
              </div>
              {(guest.total_visits > 0 || guest.total_spent > 0) && (
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-stone-100 text-xs text-stone-400">
                  <span>{guest.total_visits || 0} زيارة</span>
                  <span>•</span>
                  <span>{(guest.total_spent || 0).toLocaleString()} ر.س</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading">{editGuest ? "تعديل الضيف" : "إضافة ضيف جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">الاسم الكامل *</Label>
                <Input value={form.full_name || ""} onChange={e => setForm({...form, full_name: e.target.value})} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">رقم الجوال *</Label>
                <Input value={form.phone || ""} onChange={e => setForm({...form, phone: e.target.value})} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">البريد الإلكتروني</Label>
                <Input value={form.email || ""} onChange={e => setForm({...form, email: e.target.value})} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">الجنسية</Label>
                <Input value={form.nationality || ""} onChange={e => setForm({...form, nationality: e.target.value})} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">نوع الهوية</Label>
                <Select value={form.id_type || ""} onValueChange={v => setForm({...form, id_type: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="هوية وطنية">هوية وطنية</SelectItem>
                    <SelectItem value="جواز سفر">جواز سفر</SelectItem>
                    <SelectItem value="إقامة">إقامة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">رقم الهوية</Label>
                <Input value={form.id_number || ""} onChange={e => setForm({...form, id_number: e.target.value})} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">الجنس</Label>
                <Select value={form.gender || ""} onValueChange={v => setForm({...form, gender: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="اختر" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ذكر">ذكر</SelectItem>
                    <SelectItem value="أنثى">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-5">
                <Switch checked={form.vip || false} onCheckedChange={v => setForm({...form, vip: v})} />
                <Label className="text-sm text-stone-600">ضيف VIP</Label>
              </div>
            </div>
            <div>
              <Label className="text-xs text-stone-500 mb-1.5 block">ملاحظات</Label>
              <Textarea value={form.notes || ""} onChange={e => setForm({...form, notes: e.target.value})} className="rounded-xl" rows={2} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl">
              {saving ? "جاري الحفظ..." : (editGuest ? "تحديث" : "إضافة")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}