const endpoints = [
    "https://fuzeserve.com/api/v1/user/balance",
    "https://fuzeserve.com/api/v1/balance",
    "https://fuzeserve.com/api/user/balance",
    "https://fuzeserve.com/api/balance",
    "https://fuzeserve.com/v1/user/balance",
    "https://fuzeserve.com/v1/balance"
];

const testEndpoints = async () => {
    for (const url of endpoints) {
        try {
            const res = await fetch(url, {
                headers: {
                    "X-API-Key": "fzs_live_4afe9467d1856df6797fc57629eee23dbf80e069342b0b91a767b54af6088a00"
                }
            });
            const text = await res.text();
            console.log(`URL: ${url} | Status: ${res.status}`);
            if (res.ok && !text.startsWith("<!DOCTYPE")) {
                console.log("SUCCESS DATA:", text);
            }
        } catch (e) {}
    }
};
testEndpoints();
