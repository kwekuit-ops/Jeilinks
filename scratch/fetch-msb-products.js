const API_KEY = "sk_2vi4jY72dvIOSVflsteJh2lVRrVXpdO64TBCGpIYvkHqC";
const API_BASE = "https://mysocialbooster.online/api/v1/agent";

async function main() {
  const res = await fetch(`${API_BASE}/products`, {
    headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" }
  });

  if (!res.ok) {
    console.error("API Error:", res.status, await res.text());
    return;
  }

  const data = await res.json();
  const products = data.response || data.data || data || [];

  console.log("\n=== ALL PRODUCTS FROM MYSOCIALBOOSTER ===\n");

  // Filter Telecel
  const telecel = products.filter(p => {
    const n = (p.name || "").toUpperCase();
    return n.includes("TELECEL") || n.includes("VODA");
  });

  console.log(`\n📡 TELECEL PACKAGES (${telecel.length} found):\n`);
  telecel.forEach(p => {
    console.log(`  ID: ${p.id}  |  Name: ${p.name}  |  Price: ${p.price}`);
  });

  // Also show all for reference
  console.log(`\n📦 ALL PRODUCTS (${products.length} total):\n`);
  products.forEach(p => {
    console.log(`  ID: ${p.id}  |  Name: ${p.name}  |  Price: ${p.price}`);
  });
}

main().catch(console.error);
