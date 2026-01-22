export const welcomeTemplate = (firstName: string) => {
  return `
<!DOCTYPE html>
<html>
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
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
          sans-serif;
        background-color: var(--sidebar);
        margin: 0;
        padding: 0;
        color: #222;
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
        line-height: 1.6;
        color: #444;
        margin: 12px 0;
      }

      .features {
        margin: 20px 0;
        padding-left: 16px;
      }

      .features li {
        font-size: 14px;
        color: #444;
        margin: 8px 0;
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
      }
    </style>
  </head>

  <body>
    <div class="container">
      <div class="header">
        <h1>Welcome to Basti</h1>
        <p>Your cake delivery partner</p>
      </div>

      <div class="content">
        <div class="greeting">
          Welcome, ${firstName}
        </div>

        <p>
          Thank you for joining Basti. Your account is now verified and ready to
          use. We are glad to have you with us.
        </p>

        <ul class="features">
          <li>Browse a wide selection of cakes and desserts</li>
          <li>Fast and reliable delivery</li>
          <li>Rate and review your orders</li>
          <li>Save your favorite items</li>
        </ul>

        <p>
          You can start exploring the collection and place your first order at
          any time.
        </p>
      </div>

      <div class="footer">
        <p>© 2025 Basti. All rights reserved.</p>
        <p>Support: support@basti.com</p>
      </div>
    </div>
  </body>
</html>
  `;
};
