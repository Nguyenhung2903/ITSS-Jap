const prisma = require("../prismaClient");

exports.getNotifications = async (req, res) => {
    try {
        const list = await prisma.notification.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" },
            take: 50,
        });

        res.json(list);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        await prisma.notification.updateMany({
            where: {
                userId: req.user.id,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        res.json({
            message: "All marked as read",
        });
    } catch (err) {
        res.status(500).json({
            error: err.message,
        });
    }
};

exports.deleteAllNotifications = async (req, res) => {
    try {
        await prisma.notification.deleteMany({
            where: {
                userId: req.user.id,
            },
        });

        res.json({
            message: "All deleted",
        });
    } catch (err) {
        res.status(500).json({
            error: err.message,
        });
    }
};

exports.markOneRead = async (req, res) => {
    try {
        /** @type {any} */
        const notif = await prisma.notification.findUnique({
            where: {
                id: Number(req.params.id),
            },
        });

        if (!notif || notif.userId !== req.user.id) {
            return res.status(403).json({
                error: "Forbidden",
            });
        }

        await prisma.notification.update({
            where: {
                id: notif.id,
            },
            data: {
                isRead: true,
            },
        });

        res.json({
            message: "Marked as read",
        });
    } catch (err) {
        res.status(500).json({
            error: err.message,
        });
    }
};

exports.deleteOneNotification = async (req, res) => {
    try {
        /** @type {any} */
        const notif = await prisma.notification.findUnique({
            where: {
                id: Number(req.params.id),
            },
        });

        if (!notif || notif.userId !== req.user.id) {
            return res.status(403).json({
                error: "Forbidden",
            });
        }

        await prisma.notification.delete({
            where: {
                id: notif.id,
            },
        });

        res.json({
            message: "Deleted",
        });
    } catch (err) {
        res.status(500).json({
            error: err.message,
        });
    }
};