export const welcomeArTemplate = (firstName: string) => {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      :root {
        --chart-1: oklch(87.79% 0.23094 129.081);
        --chart-2: oklch(60% 0.118 184.704);
        --chart-3: oklch(44.565% 0.09953 157.034);
        --chart-4: oklch(85.79% 0.1713 87.91);
        --chart-5: oklch(79.672% 0.16692 70.596);
        --sidebar: oklch(98.5% 0 0);
      }

      body {
        font-family: "Segoe UI", Tahoma, Arial, sans-serif;
        background-color: var(--sidebar);
        margin: 0;
        padding: 0;
        color: #222;
        direction: rtl;
        text-align: right;
      }

      .container {
        max-width: 600px;
        margin: 24px auto;
        background-color: #ffffff;
        border-radius: 6px;
        border: 1px solid #e5e5e5;
        overflow: hidden;
      }

      .header {
        background-color: var(--chart-1);
        padding: 24px;
        text-align: center;
      }

      .header h1 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #0f2a1a;
      }

      .header p {
        margin-top: 6px;
        font-size: 14px;
        color: #1f3d2b;
        text-align: center;
      }

      .content {
        padding: 24px;
      }

      .greeting {
        font-size: 16px;
        font-weight: 500;
        margin-bottom: 16px;
      }

      p {
        font-size: 14px;
        line-height: 1.8;
        color: #444;
        margin: 12px 0;
        text-align: right;
      }

      /* Indent moves to the right-hand side so the bullets sit inside the
         right-to-left text flow. */
      .features {
        margin: 20px 0;
        padding-left: 0;
        padding-right: 16px;
      }

      .features li {
        font-size: 14px;
        color: #444;
        margin: 8px 0;
        text-align: right;
      }

      .footer {
        background-color: #f7f7f7;
        padding: 16px;
        text-align: center;
        font-size: 12px;
        color: #666;
        border-top: 1px solid #e5e5e5;
      }

      .footer p {
        margin: 4px 0;
        text-align: center;
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="header">
        <h1>مرحبًا بك في Basti</h1>
        <p>شريكك في توصيل الكيك</p>
      </div>

      <div class="content">
        <div class="greeting">
          مرحبًا، ${firstName}
        </div>

        <p>
          شكرًا لانضمامك إلى Basti. تم تفعيل حسابك وأصبح جاهزًا للاستخدام.
          يسعدنا وجودك معنا.
        </p>

        <ul class="features">
          <li>تصفّح تشكيلة واسعة من الكيك والحلويات</li>
          <li>توصيل سريع وموثوق</li>
          <li>قيّم طلباتك وشاركنا رأيك</li>
          <li>احفظ أصنافك المفضلة</li>
        </ul>

        <p>
          يمكنك البدء في استكشاف التشكيلة وتقديم طلبك الأول في أي وقت.
        </p>
      </div>

      <div class="footer">
        <p>© 2025 Basti. جميع الحقوق محفوظة.</p>
        <p>الدعم: support@basti.com</p>
      </div>
    </div>
  </body>
</html>
  `;
};
