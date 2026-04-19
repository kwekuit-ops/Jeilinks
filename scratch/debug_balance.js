const fetchBalance = async () => {
    try {
        const res = await fetch("https://fuzeserve.com/api/v1/user/balance", {
            headers: {
                "X-API-Key": "fzs_live_4afe9467d1856df6797fc57629eee23dbf80e069342b0b91a767b54af6088a00"
            }
        });
        const data = await res.json();
        console.log("Balance Response:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("API Error:", e);
    }
};
fetchBalance();
