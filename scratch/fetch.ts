import { getActiveSupplier } from "../src/lib/suppliers";

async function main() {
  const supplier = await getActiveSupplier();
  console.log(`Active Supplier: ${supplier.name}`);
  const products = await supplier.fetchProducts();
  const mtnProducts = products.filter(p => p.network.toUpperCase() === "MTN");
  console.table(mtnProducts.map(p => ({
    id: p.id,
    name: p.name,
    size: p.size,
    price: p.price
  })));
}

main().catch(console.error);
