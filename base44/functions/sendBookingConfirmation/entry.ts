import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const call = payload.data;

    // Only process new booking requests
    if (!call || call.call_type !== 'حجز جديد') {
      return Response.json({ skipped: true, reason: 'Not a booking request' });
    }

    const callerName = call.caller_name || 'ضيفنا الكريم';
    const callerPhone = call.caller_phone || '';
    const notes = call.notes || '';

    // Extract booking details from notes
    const resortMatch = notes.match(/المنتجع: (.+)/);
    const checkInMatch = notes.match(/الوصول: (.+)/);
    const checkOutMatch = notes.match(/المغادرة: (.+)/);
    const adultsMatch = notes.match(/البالغون: (\d+)/);
    const childrenMatch = notes.match(/الأطفال: (\d+)/);
    const requestsMatch = notes.match(/طلبات: (.+)/);

    const resort = resortMatch ? resortMatch[1] : 'منتجعنا';
    const checkIn = checkInMatch ? checkInMatch[1] : '-';
    const checkOut = checkOutMatch ? checkOutMatch[1] : '-';
    const adults = adultsMatch ? adultsMatch[1] : '-';
    const children = childrenMatch ? childrenMatch[1] : '-';
    const specialRequests = requestsMatch ? requestsMatch[1] : 'لا يوجد';

    // We don't have a guest email from the portal form, so we send to admin
    // and notify via a professional confirmation email to the team
    const adminEmail = Deno.env.get('ADMIN_EMAIL');

    if (!adminEmail) {
      return Response.json({ error: 'ADMIN_EMAIL not configured' }, { status: 500 });
    }

    const emailBody = `
<div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
  
  <!-- Header -->
  <div style="background: linear-gradient(135deg, #d97706, #b45309); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 26px; font-weight: bold;">🌴 ResortFlow</h1>
    <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">المنتجعات السياحية السعودية</p>
  </div>

  <!-- Body -->
  <div style="padding: 30px; background: #fffbf5; border: 1px solid #fde68a; border-top: none;">
    <h2 style="color: #92400e; font-size: 20px; margin: 0 0 8px;">طلب حجز جديد 🔔</h2>
    <p style="color: #78716c; font-size: 14px; margin: 0 0 24px;">تم استلام طلب الحجز التالي عبر البوابة الإلكترونية</p>

    <!-- Guest Info -->
    <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 16px; border: 1px solid #e7e5e4; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <h3 style="color: #292524; font-size: 15px; margin: 0 0 14px; border-bottom: 1px solid #f5f5f4; padding-bottom: 10px;">معلومات الضيف</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #a8a29e; font-size: 13px; width: 40%;">الاسم</td>
          <td style="padding: 6px 0; color: #292524; font-size: 13px; font-weight: bold;">${callerName}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a8a29e; font-size: 13px;">رقم الجوال</td>
          <td style="padding: 6px 0; color: #292524; font-size: 13px; font-weight: bold;">${callerPhone}</td>
        </tr>
      </table>
    </div>

    <!-- Booking Details -->
    <div style="background: white; border-radius: 10px; padding: 20px; margin-bottom: 16px; border: 1px solid #e7e5e4; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <h3 style="color: #292524; font-size: 15px; margin: 0 0 14px; border-bottom: 1px solid #f5f5f4; padding-bottom: 10px;">تفاصيل الحجز</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #a8a29e; font-size: 13px; width: 40%;">المنتجع</td>
          <td style="padding: 6px 0; color: #d97706; font-size: 13px; font-weight: bold;">${resort}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a8a29e; font-size: 13px;">تاريخ الوصول</td>
          <td style="padding: 6px 0; color: #292524; font-size: 13px;">${checkIn}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a8a29e; font-size: 13px;">تاريخ المغادرة</td>
          <td style="padding: 6px 0; color: #292524; font-size: 13px;">${checkOut}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a8a29e; font-size: 13px;">البالغون</td>
          <td style="padding: 6px 0; color: #292524; font-size: 13px;">${adults}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a8a29e; font-size: 13px;">الأطفال</td>
          <td style="padding: 6px 0; color: #292524; font-size: 13px;">${children}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #a8a29e; font-size: 13px;">طلبات خاصة</td>
          <td style="padding: 6px 0; color: #292524; font-size: 13px;">${specialRequests}</td>
        </tr>
      </table>
    </div>

    <!-- Action Required -->
    <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 10px; padding: 16px; text-align: center;">
      <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: bold;">⚡ يرجى التواصل مع الضيف خلال 24 ساعة لتأكيد الحجز</p>
      <p style="color: #b45309; font-size: 13px; margin: 6px 0 0;">رقم الجوال: <strong>${callerPhone}</strong></p>
    </div>
  </div>

  <!-- Footer -->
  <div style="background: #1c1917; padding: 20px 30px; text-align: center; border-radius: 0 0 12px 12px;">
    <p style="color: #78716c; font-size: 12px; margin: 0;">ResortFlow — نظام إدارة المنتجعات السياحية 🇸🇦</p>
  </div>

</div>
    `.trim();

    await base44.asServiceRole.integrations.Core.SendEmail({
      to: adminEmail,
      subject: `🏨 طلب حجز جديد من ${callerName} — ${resort}`,
      body: emailBody,
    });

    return Response.json({ success: true, sentTo: adminEmail });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});