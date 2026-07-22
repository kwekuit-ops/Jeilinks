import { getActiveSupplier } from "../src/lib/suppliers";
import * as fs from "fs";

async function main() {
  const supplier = await getActiveSupplier();
  const products = await supplier.fetchProducts();
  fs.writeFileSync("scratch/all-products.json", JSON.stringify(products, null, 2));
  console.log("Wrote all products to scratch/all-products.json");
}

main().catch(console.error);
