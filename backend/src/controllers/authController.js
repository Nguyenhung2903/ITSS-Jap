const prisma = require("../prismaClient");
const bcrypt = require("bcrypt");
const { UserStatus, KycStatus } = require("@prisma/client");
const { splitPurposeValues } = require("../utils/purposeUtils");

const { signToken } = require("../utils/jwt");
const cloudinary = require("../utils/cloudinary");
const { hasCloudinaryConfig } = require("../utils/cloudinary");

exports.register = async (req, res) => {
    try {

        const {
            email,
            password,
            language,
            purpose,
        } = req.body;

        if (
            !email ||
            !password ||
            !language ||
            !purpose
        ) {
            return res.status(400).json({
                error: "Email, password, language, purpose required",
            });
        }

        if (!req.file) {
            return res.status(400).json({
                error: "CCCD required",
            });
        }

        if (!hasCloudinaryConfig()) {
            return res.status(503).json({
                error: "Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
            });
        }

        const existed = await prisma.verifiedUser.findUnique({
            where: {
                email: email.trim().toLowerCase(),
            },
        });

        if (existed) {
            return res.status(400).json({
                error: "Email already exists",
            });
        }

        const uploadResult = await new Promise((resolve, reject) => {

            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "cccd",
                },
                (error, result) => {

                    if (error) {
                        return reject(error);
                    }

                    resolve(result);
                }
            );

            stream.end(req.file.buffer);
        });

        const hashed = await bcrypt.hash(password.trim(), 10);
        /** @type {any} */
        const user = await prisma.verifiedUser.create({
            data: {
                email: email.trim().toLowerCase(),
                password: hashed,
                status: UserStatus.PENDING,
            },
        });

        await prisma.userLanguage.create({
            data: {
                language,
                type: "native",
                userId: user.id,
            },
        });

        const learningLanguage = language === "日本" ? "ベトナム" : "日本";
        await prisma.userLanguage.create({
            data: {
                language: learningLanguage,
                type: "learning",
                userId: user.id,
            },
        });

        const purposeList = splitPurposeValues(purpose);
        if (purposeList.length === 0) {
            return res.status(400).json({
                error: "Purpose required",
            });
        }

        await prisma.userPurpose.createMany({
            data: purposeList.map((p) => ({
                purpose: p,
                userId: user.id,
            })),
        });

        await prisma.kycRequest.create({
            data: {
                documentImageUrl: uploadResult.secure_url,
                status: KycStatus.PENDING,
                userId: user.id,
            },
        });

        res.json({
            message: "Đăng ký thành công",
        });

    } catch (error) {

        console.error("REGISTER ERROR:", error);

        res.status(500).json({
            error: error.message,
        });
    }
};

exports.login = async (req, res) => {
    try {

        const { email, password } = req.body;

        /** @type {any} */
        const user = await prisma.verifiedUser.findUnique({
            where: {
                email: email.trim().toLowerCase(),
            },
            include: {
                purposes: true,
            },
        });

        if (!user) {
            return res.status(400).json({
                error: "User not found",
            });
        }

        if (user.status !== UserStatus.VERIFIED) {
            return res.status(403).json({
                error: "Account not verified",
            });
        }

        const valid = await bcrypt.compare(
            password.trim(),
            user.password
        );

        if (!valid) {
            return res.status(400).json({
                error: "Wrong password",
            });
        }

        const token = signToken({
            id: user.id,
        });

        const { password: _, ...safeUser } = user;

        res.json({
            token,
            user: safeUser,
        });
    } catch (error) {

        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            error: error.message,
        });
    }
};

exports.me = async (req, res) => {
    try {

        const user = await prisma.verifiedUser.findUnique({
            where: {
                id: req.user.id,
            },
            include: {
                languages: true,
                hobbies: true,
                purposes: true,
                kycRequests: true,
            },
        });

        if (!user) {
            return res.status(404).json({
                error: "User not found",
            });
        }

        const { password: _, ...safeUser } = user;

        res.json({
            user: safeUser,
        });
    } catch (error) {

        console.error("ME ERROR:", error);

        res.status(500).json({
            error: error.message,
        });
    }
};
