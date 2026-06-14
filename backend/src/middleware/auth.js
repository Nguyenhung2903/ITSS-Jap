const prisma = require("../prismaClient");
const { verifyToken } = require("../utils/jwt");

module.exports = async (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const token = header.split(" ")[1];
        const decoded = verifyToken(token);

        const user = await prisma.verifiedUser.findUnique({
            where: { id: decoded.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                status: true,
            },
        });

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        req.user = user;
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid token" });
    }
};