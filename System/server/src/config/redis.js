const IORedis = require("ioredis");

const redis = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: false
});

redis.on("connect", () => {
    console.log("✅ Redis Connected");
});

redis.on("ready", () => {
    console.log("🚀 Redis Ready");
});

redis.on("error", (err) => {
    console.error("❌ Redis Error:", err.message);
});

module.exports = redis;