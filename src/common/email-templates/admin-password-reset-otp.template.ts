export function adminPasswordResetOtpTemplate(otp: string, adminName: string = 'Admin'): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        margin: 0;
        padding: 0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background-color: #f9f6f1;
        color: #171717;
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
        line-height: 1.6;
        margin: 10px 0;
        color: #171717;
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

      .otp-code {
        font-size: 34px;
        font-weight: 700;
        letter-spacing: 6px;
        color: #00a82e;
        font-family: monospace;
        margin: 0;
      }

      .expiry {
        font-size: 12px;
        margin-top: 10px;
        color: #171717;
      }

      .notice {
        margin: 20px 0;
        padding: 14px;
        background-color: #f9f6f1;
        border-left: 4px solid #00a82e;
        font-size: 13px;
        color: #171717;
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
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="header">
        <h1>Password Reset</h1>
      </div>

      <div class="divider"></div>

      <div class="content">
        <p>Hello ${adminName},</p>

        <p>
          A request was made to reset your Basti Admin account password.
          Use the verification code below to continue.
        </p>

        <div class="otp-box">
          <div class="otp-label">Password reset code</div>
          <p class="otp-code">${otp}</p>
          <div class="expiry">Valid for 10 minutes</div>
        </div>

        <div class="notice">
          If you did not request a password reset, please ignore this email.
        </div>
      </div>
    </div>
  </body>
</html>
  `;
}
