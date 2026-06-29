import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Hotel, Plus, Pencil, Trash2 } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const statusBadge = {
  "متاحة": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "مشغولة": "bg-red-50 text-red-600 border-red-200",
  "صيانة": "bg-amber-50 text-amber-700 border-amber-200",
};

const typeIcons = {
  "غرفة عادية": "🛏️",
  "جناح": "🏨",
  "فيلا": "🏡",
  "شاليه": "🏠",
  "خيمة فاخرة": "⛺",
};

export default function Units() {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUnit, setEditUnit] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadUnits = async () => {
    try { setUnits(await base44.entities.Unit.list()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadUnits(); }, []);

  const openNew = () => {
    setEditUnit(null);
    setForm({ name: "", type: "غرفة عادية", capacity: 2, price_per_night: 0, status: "متاحة", description: "", floor: "" });
    setDialogOpen(true);
  };

  const openEdit = (unit) => {
    setEditUnit(unit);
    setForm({ ...unit });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.type || !form.price_per_night) {
      toast({ title: "خطأ", description: "الاسم والنوع والسعر مطلوبة", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editUnit) {
        await base44.entities.Unit.update(editUnit.id, form);
      } else {
        await base44.entities.Unit.create(form);
      }
      setDialogOpen(false);
      loadUnits();
      toast({ title: editUnit ? "تم التحديث" : "تمت الإضافة" });
    } catch (e) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف هذه الوحدة؟")) return;
    await base44.entities.Unit.delete(id);
    loadUnits();
    toast({ title: "تم الحذف" });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-stone-200 border-t-amber-500 rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <PageHeader
        title="إدارة الوحدات"
        subtitle={`${units.length} وحدة`}
        actions={
          <Button onClick={openNew} className="bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-200/50 rounded-xl">
            <Plus className="w-4 h-4 ml-2" /> إضافة وحدة
          </Button>
        }
      />

      {units.length === 0 ? (
        <EmptyState
          icon={Hotel}
          title="لا توجد وحدات"
          description="أضف وحدات المنتجع (غرف، أجنحة، فيلات...)"
          action={<Button onClick={openNew} variant="outline" className="rounded-xl"><Plus className="w-4 h-4 ml-2" /> إضافة وحدة</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {units.map(unit => (
            <div key={unit.id} className="bg-white/70 backdrop-blur-sm rounded-2xl border border-stone-200/60 p-5 hover:shadow-lg hover:shadow-stone-100/80 transition-all duration-300 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-xl">
                    {typeIcons[unit.type] || "🏨"}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-stone-800 text-sm">{unit.name}</h3>
                    <p className="text-xs text-stone-400">{unit.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(unit)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600" onClick={() => handleDelete(unit.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
                <div className="text-xs text-stone-500">
                  <span className="font-semibold text-stone-700 text-base">{unit.price_per_night?.toLocaleString()}</span> ر.س / ليلة
                </div>
                <Badge className={`text-[10px] border ${statusBadge[unit.status]}`} variant="outline">{unit.status}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-2 text-xs text-stone-400">
                <span>سعة: {unit.capacity} أشخاص</span>
                {unit.floor && <span>• طابق: {unit.floor}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading">{editUnit ? "تعديل الوحدة" : "إضافة وحدة جديدة"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">اسم الوحدة *</Label>
                <Input value={form.name || ""} onChange={e => setForm({...form, name: e.target.value})} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">النوع *</Label>
                <Select value={form.type || ""} onValueChange={v => setForm({...form, type: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["غرفة عادية", "جناح", "فيلا", "شاليه", "خيمة فاخرة"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">السعر / ليلة *</Label>
                <Input type="number" value={form.price_per_night || ""} onChange={e => setForm({...form, price_per_night: Number(e.target.value)})} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">السعة</Label>
                <Input type="number" value={form.capacity || ""} onChange={e => setForm({...form, capacity: Number(e.target.value)})} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">الحالة</Label>
                <Select value={form.status || "متاحة"} onValueChange={v => setForm({...form, status: v})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["متاحة", "مشغولة", "صيانة"].map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-stone-500 mb-1.5 block">الطابق</Label>
              <Input value={form.floor || ""} onChange={e => setForm({...form, floor: e.target.value})} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs text-stone-500 mb-1.5 block">وصف</Label>
              <Textarea value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} className="rounded-xl" rows={2} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl">
              {saving ? "جاري الحفظ..." : (editUnit ? "تحديث" : "إضافة")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}