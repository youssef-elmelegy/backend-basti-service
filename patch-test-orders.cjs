const fs = require("fs");
const { Pool } = require("pg");

const env = fs.readFileSync("./.env", "utf8");
const url = env.match(/^DATABASE_URL=(.*)$/m)[1].trim().replace(/^["']|["']$/g, "");
const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

(async () => {
  // Pick 4 delivered/ready orders with a real final_price to patch.
  const { rows: picks } = await pool.query(`
    SELECT id, reference_number AS ref, final_price
    FROM orders
    WHERE order_status IN ('ready','out_for_delivery','delivered')
      AND final_price::numeric > 0
    ORDER BY created_at DESC
    LIMIT 4;`);

  // masarat (1%), tadawul (1.5%), then one of each again so totals are visible.
  const gateways = ["masarat", "tadawul", "masarat", "tadawul"];

  // Snapshot originals for reversibility.
  const backup = [];
  for (const p of picks) {
    const { rows } = await pool.query(
      `SELECT basti_amount, payment_data, payment_method_type FROM orders WHERE id = $1`,
      [p.id],
    );
    backup.push({ id: p.id, ref: p.ref, ...rows[0] });
  }
  fs.writeFileSync(
    "./patch-test-orders.backup.json",
    JSON.stringify(backup, null, 2),
  );
  console.log("Backup written to patch-test-orders.backup.json");

  for (let i = 0; i < picks.length; i++) {
    const p = picks[i];
    const gw = gateways[i];
    const finalPrice = parseFloat(p.final_price) || 0;
    const bastiAmount = (finalPrice * 0.2).toFixed(2); // 20% share, matches stored basti_percentage 0.20

    await pool.query(
      `UPDATE orders
         SET basti_amount = $2,
             payment_method_type = 'credit_card',
             payment_data = jsonb_build_object(
               'type', '',
               'cardHolderName', '',
               'cardLastFourDigits', '',
               'cardExpiryMonth', 0,
               'cardExpiryYear', 0,
               'paymentGatewayName', $3::text,
               'paymentGatewaySubName', '',
               'paymentGatewayRef', 'TEST-' || $3::text
             )
       WHERE id = $1`,
      [p.id, bastiAmount, gw],
    );
    const fee = (finalPrice * (gw === "masarat" ? 0.01 : 0.015)).toFixed(2);
    console.log(
      `Patched ${p.ref}: gateway=${gw}, finalPrice=${finalPrice}, bastiAmount=${bastiAmount}, expectedFee=${fee}, bastiNet=${(bastiAmount - fee).toFixed(2)}`,
    );
  }

  await pool.end();
  console.log("\nDone. Reload the finance page to see the columns.");
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
