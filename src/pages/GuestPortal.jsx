import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Palmtree, Mountain, Waves, Star, MapPin, Users, Moon,
  ChevronDown, Phone, Mail, Calendar, ArrowLeft, CheckCircle, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const resorts = [
  {
    id: "beach",
    type: "بحري",
    icon: Waves,
    name: "منتجع شاطئ العقيق",
    location: "جدة، الواجهة البحرية",
    description: "استمتع بأجواء الخليج الفاخرة مع إطلالات بانورامية على البحر الأحمر وشاليهات مائية حصرية",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    features: ["شاليهات مائية", "شواطئ خاصة", "رياضات مائية", "مطاعم بحرية"],
    price: "من 1,200 ر.س",
    rating: 4.9,
    color: "from-cyan-500 to-blue-600",
  },
  {
    id: "mountain",
    type: "جبلي",
    icon: Mountain,
    name: "منتجع أودية الطائف",
    location: "الطائف، المرتفعات",
    description: "تجربة الهدوء والانتعاش في أعالي جبال الحجاز وسط الأشجار وعبير الورد الطائفي",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
    features: ["فيلات جبلية", "مسارات طبيعية", "هواء نقي", "جلسات الشواء"],
    price: "من 900 ر.س",
    rating: 4.8,
    color: "from-emerald-500 to-green-700",
  },
  {
    id: "desert",
    type: "صحراوي",
    icon: Moon,
    name: "منتجع واحة العُلا",
    location: "العُلا، المدينة المنورة",
    description: "رحلة إلى قلب التاريخ العربي مع خيام فاخرة تحت سماء النجوم وإطلالات على الصخور الوردية",
    image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&auto=format&fit=crop&q=80",
    features: ["خيام فاخرة", "جولات أثرية", "سفاري ليلي", "أمسيات ثقافية"],
    price: "من 1,800 ر.س",
    rating: 5.0,
    color: "from-amber-500 to-orange-600",
  },
];

const emptyBooking = {
  guest_name: "", guest_phone: "", resort: "", check_in: "", check_out: "",
  adults: "2", children: "0", special_requests: "", call_type: "حجز جديد",
  status: "واردة", caller_name: "", caller_phone: ""
};

export default function GuestPortal() {
  const [units, setUnits] = useState([]);
  const [activeTab, setActiveTab] = useState("home");
  const [bookingDialog, setBookingDialog] = useState(false);
  const [selectedResort, setSelectedResort] = useState(null);
  const [form, setForm] = useState(emptyBooking);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    base44.entities.Unit.filter({ status: "متاحة" }).then(setUnits).catch(() => {});
  }, []);

  const openBooking = (resort) => {
    setSelectedResort(resort);
    setForm({ ...emptyBooking, resort: resort.name });
    setSubmitted(false);
    setBookingDialog(true);
  };

  const handleSubmit = async () => {
    if (!form.guest_name || !form.guest_phone || !form.check_in || !form.check_out) {
      toast({ title: "يرجى تعبئة جميع الحقول المطلوبة", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Register as a call/inquiry
      await base44.entities.Call.create({
        caller_name: form.guest_name,
        caller_phone: form.guest_phone,
        call_type: "حجز جديد",
        status: "واردة",
        notes: `طلب حجز من البوابة الإلكترونية\nالمنتجع: ${form.resort}\nالوصول: ${form.check_in}\nالمغادرة: ${form.check_out}\nالبالغون: ${form.adults} | الأطفال: ${form.children}\nطلبات: ${form.special_requests || "لا يوجد"}`,
        follow_up_required: true,
      });
      setSubmitted(true);
    } catch (e) {
      toast({ title: "حدث خطأ، يرجى المحاولة مجدداً", variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white font-body">

      {/* NAV */}
      <nav className="fixed top-0 right-0 left-0 z-50 bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
              <Palmtree className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">ResortFlow</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/80">
            <button onClick={() => setActiveTab("home")} className={`hover:text-white transition-colors ${activeTab === "home" ? "text-amber-400" : ""}`}>الرئيسية</button>
            <button onClick={() => setActiveTab("resorts")} className={`hover:text-white transition-colors ${activeTab === "resorts" ? "text-amber-400" : ""}`}>منتجعاتنا</button>
            <button onClick={() => setActiveTab("contact")} className={`hover:text-white transition-colors ${activeTab === "contact" ? "text-amber-400" : ""}`}>تواصل معنا</button>
          </div>
          <Link to="/login">
            <Button className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm h-9 px-4">
              دخول الإدارة
            </Button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <div className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&auto=format&fit=crop&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />

        {/* Overlay pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4a017' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-4 py-1.5 text-amber-300 text-sm mb-6 backdrop-blur-sm">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            منتجعات سياحية سعودية فاخرة
          </div>
          <h1 className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 leading-tight">
            اكتشف <span className="text-amber-400">جمال</span><br />المملكة
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10">
            من شواطئ البحر الأحمر الفيروزية إلى ربوع جبال الحجاز المنعشة وصحراء العُلا الساحرة — تجارب لا تُنسى
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => setActiveTab("resorts")}
              className="bg-amber-500 hover:bg-amber-600 text-white rounded-2xl h-12 px-8 text-base shadow-2xl shadow-amber-500/30"
            >
              استكشف المنتجعات
            </Button>
            <button
              onClick={() => setActiveTab("contact")}
              className="text-white/80 hover:text-white flex items-center gap-2 text-sm transition-colors"
            >
              تواصل معنا <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/50" />
        </div>
      </div>

      {/* RESORT TYPES */}
      <div className="bg-stone-50 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Waves, label: "منتجعات بحرية", count: "3 وجهات", color: "text-cyan-600 bg-cyan-50 border-cyan-200" },
              { icon: Mountain, label: "منتجعات جبلية", count: "4 وجهات", color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
              { icon: Moon, label: "منتجعات صحراوية", count: "2 وجهات", color: "text-amber-600 bg-amber-50 border-amber-200" },
            ].map(t => (
              <div key={t.label} className={`rounded-2xl border p-4 flex items-center gap-3 cursor-pointer hover:shadow-md transition-all ${t.color}`}>
                <t.icon className="w-6 h-6 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm">{t.label}</p>
                  <p className="text-xs opacity-70">{t.count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RESORTS SECTION */}
      <div id="resorts" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-heading font-bold text-stone-800 mb-3">منتجعاتنا المميزة</h2>
          <p className="text-stone-500 max-w-xl mx-auto">نخبة من أفخم المنتجعات في أجمل المناطق السياحية بالمملكة العربية السعودية</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {resorts.map(resort => (
            <div key={resort.id} className="group rounded-3xl overflow-hidden border border-stone-200/60 shadow-sm hover:shadow-2xl hover:shadow-stone-200/50 transition-all duration-500">
              <div className="relative h-52 overflow-hidden">
                <img src={resort.image} alt={resort.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className={`absolute top-4 right-4 bg-gradient-to-l ${resort.color} text-white text-xs px-3 py-1 rounded-full flex items-center gap-1.5 shadow-lg`}>
                  <resort.icon className="w-3 h-3" />
                  {resort.type}
                </div>
                <div className="absolute bottom-4 right-4 flex items-center gap-1 text-white">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-semibold">{resort.rating}</span>
                </div>
              </div>
              <div className="p-5 bg-white">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-heading font-bold text-stone-800 text-lg">{resort.name}</h3>
                  <span className="text-amber-600 font-semibold text-sm">{resort.price}</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-400 text-xs mb-3">
                  <MapPin className="w-3.5 h-3.5" />
                  {resort.location}
                </div>
                <p className="text-stone-500 text-sm mb-4 leading-relaxed">{resort.description}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {resort.features.map(f => (
                    <span key={f} className="bg-stone-100 text-stone-600 text-[11px] px-2.5 py-1 rounded-full">{f}</span>
                  ))}
                </div>
                <Button
                  onClick={() => openBooking(resort)}
                  className="w-full rounded-xl bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-amber-200/50"
                >
                  احجز الآن
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Available Units from DB */}
        {units.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-heading font-bold text-stone-800 mb-2 text-center">وحدات متاحة للحجز الفوري</h3>
            <p className="text-stone-400 text-sm text-center mb-8">اختر وحدتك المفضلة واحجز مباشرة</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {units.slice(0, 6).map(unit => (
                <div key={unit.id} className="bg-white border border-stone-200/60 rounded-2xl p-4 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-stone-800">{unit.name}</h4>
                      <p className="text-xs text-stone-400">{unit.type}</p>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-full">متاحة</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-500 flex items-center gap-1"><Users className="w-3.5 h-3.5" />{unit.capacity} أشخاص</span>
                    <span className="font-bold text-amber-600">{unit.price_per_night?.toLocaleString()} ر.س<span className="text-stone-400 font-normal text-xs">/ليلة</span></span>
                  </div>
                  <Button
                    onClick={() => openBooking({ name: unit.name, ...unit })}
                    variant="outline"
                    className="w-full mt-3 rounded-xl text-sm border-amber-200 text-amber-700 hover:bg-amber-50"
                  >
                    احجز هذه الوحدة
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CONTACT / LOGIN SECTION */}
      <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 py-20 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-heading font-bold text-white mb-4">تواصل معنا</h2>
            <p className="text-stone-400 mb-8">فريقنا جاهز لمساعدتك في اختيار أفضل تجربة سياحية تناسب احتياجاتك</p>
            <div className="space-y-4">
              <a href="tel:920000000" className="flex items-center gap-4 text-stone-300 hover:text-amber-400 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">الرقم الموحد</p>
                  <p className="font-semibold">920-000-000</p>
                </div>
              </a>
              <a href="mailto:info@resortflow.sa" className="flex items-center gap-4 text-stone-300 hover:text-amber-400 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-stone-500">البريد الإلكتروني</p>
                  <p className="font-semibold">info@resortflow.sa</p>
                </div>
              </a>
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-amber-500/30">
              <Palmtree className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">بوابة الإدارة</h3>
            <p className="text-stone-400 text-sm mb-6">للموظفين وإدارة المنتجع فقط</p>
            <Link to="/login">
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-11 font-medium">
                تسجيل دخول الإدارة
              </Button>
            </Link>
            <p className="text-stone-500 text-xs mt-4">
              ضيف وتريد حجز؟{" "}
              <button onClick={() => openBooking(resorts[0])} className="text-amber-400 hover:underline">اطلب حجزاً هنا</button>
            </p>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-black py-6 px-6 text-center">
        <p className="text-stone-600 text-sm">
          © 2026 ResortFlow — جميع الحقوق محفوظة | <span className="text-amber-600">المملكة العربية السعودية 🇸🇦</span>
        </p>
      </div>

      {/* BOOKING DIALOG */}
      <Dialog open={bookingDialog} onOpenChange={setBookingDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {submitted ? "تم إرسال طلبك" : `طلب حجز — ${selectedResort?.name}`}
            </DialogTitle>
          </DialogHeader>

          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-9 h-9 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-stone-800 mb-2">تم استلام طلبك</h3>
              <p className="text-stone-500 text-sm">سيتواصل معك فريقنا على رقم جوالك خلال 24 ساعة لتأكيد الحجز</p>
              <Button onClick={() => setBookingDialog(false)} className="mt-6 bg-amber-500 hover:bg-amber-600 text-white rounded-xl w-full">
                إغلاق
              </Button>
            </div>
          ) : (
            <div className="space-y-4 mt-2">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                <strong>{selectedResort?.name}</strong>
                {selectedResort?.price && <span className="text-amber-600 mr-2">{selectedResort.price}</span>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-stone-500 mb-1.5 block">الاسم الكامل *</Label>
                  <Input value={form.guest_name} onChange={e => setForm({...form, guest_name: e.target.value})} className="rounded-xl" placeholder="اسمك الكامل" />
                </div>
                <div>
                  <Label className="text-xs text-stone-500 mb-1.5 block">رقم الجوال *</Label>
                  <Input value={form.guest_phone} onChange={e => setForm({...form, guest_phone: e.target.value})} className="rounded-xl" placeholder="05xxxxxxxx" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-stone-500 mb-1.5 block">تاريخ الوصول *</Label>
                  <Input type="date" value={form.check_in} onChange={e => setForm({...form, check_in: e.target.value})} className="rounded-xl" />
                </div>
                <div>
                  <Label className="text-xs text-stone-500 mb-1.5 block">تاريخ المغادرة *</Label>
                  <Input type="date" value={form.check_out} onChange={e => setForm({...form, check_out: e.target.value})} className="rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-stone-500 mb-1.5 block">البالغون</Label>
                  <Select value={form.adults} onValueChange={v => setForm({...form, adults: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["1","2","3","4","5","6","7","8"].map(n => <SelectItem key={n} value={n}>{n} بالغين</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-stone-500 mb-1.5 block">الأطفال</Label>
                  <Select value={form.children} onValueChange={v => setForm({...form, children: v})}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["0","1","2","3","4","5"].map(n => <SelectItem key={n} value={n}>{n === "0" ? "لا يوجد" : n + " أطفال"}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-stone-500 mb-1.5 block">طلبات خاصة</Label>
                <Textarea value={form.special_requests} onChange={e => setForm({...form, special_requests: e.target.value})} className="rounded-xl" rows={2} placeholder="أي تفضيلات خاصة..." />
              </div>
              <Button onClick={handleSubmit} disabled={saving} className="w-full bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl h-11">
                {saving ? "جاري الإرسال..." : "إرسال طلب الحجز"}
              </Button>
              <p className="text-center text-xs text-stone-400">سنتواصل معك خلال 24 ساعة لتأكيد الحجز</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}