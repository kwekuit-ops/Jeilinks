import { getActiveSupplier } from "./src/lib/suppliers";

async function testConnection() {
  try {
    const supplier = await getActiveSupplier();
    console.log(`Testing connection to: ${supplier.name}`);
    const balance = await supplier.fetchBalance();
    console.log(`Connection Successful! Balance: ${balance}`);
    
    console.log("Fetching products...");
    const products = await supplier.fetchProducts();
    console.log(`Found ${products.length} products.`);
    if (products.length > 0) {
        console.log("First product sample:", products[0]);
    }
  } catch (error: any) {
    console.error("Connection Failed!");
    console.error(error.message);
  }
}

testConnection();
