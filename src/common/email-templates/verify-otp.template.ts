export const verifyOtpTemplate = (otp: string, userName: string) => {
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
        line-height: 1.6;
        margin: 10px 0;
        color: #171717;
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

      .otp-code {
        font-size: 32px;
        font-weight: 600;
        letter-spacing: 4px;
        font-family: monospace;
        color: #00a82e;
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
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="header">
        <h1>Email Verification</h1>
      </div>

      <div class="content">
        <p>Hello ${userName},</p>

        <p>
          To complete your email verification, please use the one-time password
          below.
        </p>

        <div class="otp-box">
          <div class="otp-label">Your verification code</div>
          <div class="otp-code">${otp}</div>
          <div class="otp-expire">Valid for 10 minutes</div>
        </div>

        <div class="notice">
          For security reasons, do not share this code with anyone. If you did
          not request this verification, you can safely ignore this email.
        </div>

        <p>If you need assistance, contact support.</p>
      </div>

      <div class="footer">
        <p>© 2025 Basti. All rights reserved.</p>
        <p>This is an automated message. Please do not reply.</p>
        <p>Support: support@basti.com</p>
      </div>
    </div>
  </body>
</html>
  `;
};
