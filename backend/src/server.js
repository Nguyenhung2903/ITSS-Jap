const express = require("express");
const cors = require("cors");
const compression = require("compression");
const http = require("http");

const { initSocket } = require("./socket");
const setupSwagger = require("./swagger");

const app = express();

app.use(compression());
app.use(cors({
    origin: "*",
}));

app.use(express.json({
    limit: "10mb",
}));

if (process.env.NODE_ENV !== "production") {
    setupSwagger(app);
}

app.get("/health", async (req, res) => {
    try {
        const prisma = require("./prismaClient");
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: "ok", database: "connected" });
    } catch (err) {
        console.error("Health check failed:", err);
        res.status(503).json({ status: "degraded", database: "unavailable" });
    }
});

app.get("/api/debug-env", (req, res) => {
    const { hasR2Config } = require("./utils/r2");
    res.json({
        r2Configured: hasR2Config(),
        keysPresent: {
            ACCOUNT_ID: !!process.env.CLOUDFLARE_R2_ACCOUNT_ID,
            ACCESS_KEY_ID: !!process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
            SECRET_ACCESS_KEY: !!process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
            BUCKET: !!process.env.CLOUDFLARE_R2_BUCKET,
            PUBLIC_URL: !!process.env.CLOUDFLARE_R2_PUBLIC_URL,
            DATABASE_URL: !!process.env.DATABASE_URL
        }
    });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/posts", require("./routes/post"));
app.use("/api/groups", require("./routes/group"));
app.use("/api/events", require("./routes/event"));
app.use("/api/matchings", require("./routes/matching"));
app.use("/api/profiles", require("./routes/profile"));
app.use("/api/notifications", require("./routes/notification"));
app.use("/api/chats", require("./routes/chat"));
app.use("/api/stats", require("./routes/stats"));

app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({
        error: "Internal Server Error",
    });
});

module.exports = app;

if (require.main === module) {

    const server = http.createServer(app);

    initSocket(server);

    const PORT = process.env.PORT || 5000;

    server.listen(PORT, () => {
        console.log(`HTTP + Socket.IO running on ${PORT}`);
    });
}