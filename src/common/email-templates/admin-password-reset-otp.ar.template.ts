export function adminPasswordResetOtpArTemplate(otp: string, adminName: string = 'المشرف'): string {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: "Segoe UI", Tahoma, Arial, sans-serif;
        background-color: #f9f6f1;
        color: #171717;
        direction: rtl;
        text-align: right;
      }

      .container {
        max-width: 600px;
        margin: 24px auto;
        background-color: #ffffff;
        border: 1px solid #e5e2dc;
      }

      .header {
        padding: 24px;
        text-align: center;
        background-color: #00a82e;
      }

      .header h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 600;
        color: #ffffff;
      }

      .divider {
        height: 4px;
        background-color: #00a82e;
      }

      .content {
        padding: 24px;
      }

      p {
        font-size: 14px;
        line-height: 1.8;
        margin: 10px 0;
        color: #171717;
        text-align: right;
      }

      .otp-box {
        margin: 24px 0;
        padding: 22px;
        background-color: #f9f6f1;
        border: 2px solid #00a82e;
        text-align: center;
      }

      .otp-label {
        font-size: 13px;
        margin-bottom: 8px;
        color: #171717;
      }

      /* The code stays left-to-right so the digits keep their intended order
         inside the right-to-left document. */
      .otp-code {
        font-size: 34px;
        font-weight: 700;
        letter-spacing: 6px;
        color: #00a82e;
        font-family: monospace;
        margin: 0;
        direction: ltr;
        unicode-bidi: embed;
      }

      .expiry {
        font-size: 12px;
        margin-top: 10px;
        color: #171717;
      }

      /* Accent bar moves to the right edge to match the text direction. */
      .notice {
        margin: 20px 0;
        padding: 14px;
        background-color: #f9f6f1;
        border-right: 4px solid #00a82e;
        font-size: 13px;
        color: #171717;
        text-align: right;
      }

      .footer {
        padding: 16px;
        text-align: center;
        border-top: 1px solid #e5e2dc;
        font-size: 12px;
        color: #171717;
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
        <h1>إعادة تعيين كلمة المرور</h1>
      </div>

      <div class="divider"></div>

      <div class="content">
        <p>مرحبًا ${adminName}،</p>

        <p>
          تم تقديم طلب لإعادة تعيين كلمة المرور الخاصة بحسابك في لوحة تحكم
          Basti. استخدم رمز التحقق الموضح أدناه للمتابعة.
        </p>

        <div class="otp-box">
          <div class="otp-label">رمز إعادة تعيين كلمة المرور</div>
          <p class="otp-code">${otp}</p>
          <div class="expiry">صالح لمدة ١٠ دقائق</div>
        </div>

        <div class="notice">
          إذا لم تطلب إعادة تعيين كلمة المرور، يُرجى تجاهل هذه الرسالة.
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}
