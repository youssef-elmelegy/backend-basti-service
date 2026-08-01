export const verifyOtpArTemplate = (otp: string, userName: string) => {
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
        padding: 20px;
        text-align: center;
        border-bottom: 1px solid #e5e2dc;
      }

      .header h1 {
        margin: 0;
        font-size: 22px;
        font-weight: 600;
        color: #171717;
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
        padding: 20px;
        background-color: #f9f6f1;
        border: 1px solid #00a82e;
        text-align: center;
      }

      .otp-label {
        font-size: 13px;
        color: #171717;
        margin-bottom: 8px;
      }

      /* The code stays left-to-right so the digits keep their intended order
         inside the right-to-left document. */
      .otp-code {
        font-size: 32px;
        font-weight: 600;
        letter-spacing: 4px;
        font-family: monospace;
        color: #00a82e;
        direction: ltr;
        unicode-bidi: embed;
      }

      .otp-expire {
        font-size: 12px;
        color: #171717;
        margin-top: 8px;
      }

      .notice {
        font-size: 13px;
        color: #171717;
        background-color: #f9f6f1;
        padding: 14px;
        border: 1px solid #e5e2dc;
        margin: 20px 0;
        text-align: right;
      }

      .footer {
        background-color: #f9f6f1;
        padding: 16px;
        text-align: center;
        font-size: 12px;
        color: #171717;
        border-top: 1px solid #e5e2dc;
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
        <h1>تأكيد البريد الإلكتروني</h1>
      </div>

      <div class="content">
        <p>مرحبًا ${userName}،</p>

        <p>
          لإتمام عملية تأكيد بريدك الإلكتروني، يُرجى استخدام رمز التحقق
          لمرة واحدة الموضح أدناه.
        </p>

        <div class="otp-box">
          <div class="otp-label">رمز التحقق الخاص بك</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-expire">صالح لمدة ١٠ دقائق</div>
        </div>

        <div class="notice">
          لأسباب أمنية، لا تشارك هذا الرمز مع أي شخص. إذا لم تطلب هذا التحقق،
          يمكنك تجاهل هذه الرسالة بأمان.
        </div>

        <p>إذا كنت بحاجة إلى المساعدة، يُرجى التواصل مع الدعم.</p>
      </div>

      <div class="footer">
        <p>© 2025 Basti. جميع الحقوق محفوظة.</p>
        <p>هذه رسالة آلية، يُرجى عدم الرد عليها.</p>
        <p>الدعم: support@basti.com</p>
      </div>
    </div>
  </body>
</html>
  `;
};
