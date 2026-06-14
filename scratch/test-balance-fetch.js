async function main() {
  const url = "https://mysocialbooster.online/api/v1/agent/wallet/balance";
  const apiKey = "sk_2vi4jY72dvIOSVflsteJh2lVRrVXpdO64TBCGpIYvkHqC";

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json"
      }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

main();
