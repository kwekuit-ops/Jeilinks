async function main() {
  const url = "https://mysocialbooster.online/api/v1/agent/orders/f19274cb-2e1c-46b4-a582-484364295df4";
  const apiKey = "sk_2vi4jY72dvIOSVflsteJh2lVRrVXpdO64TBCGpIYvkHqC";

  console.log("Fetching url:", url);
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
