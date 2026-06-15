const prisma = require("../prismaClient");
const bcrypt = require("bcrypt");
const { UserStatus, KycStatus } = require("@prisma/client");
const { splitPurposeValues } = require("../utils/purposeUtils");

const { signToken } = require("../utils/jwt");
const { selectSystemAvatar } = require("../utils/systemAssets");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

exports.register = async (req, res) => {
    try {

        const {
            email,
            password,
            language,
            purpose,
            username,
        } = req.body;

        if (
            !email ||
            !password ||
            !language ||
            !purpose ||
            !username
        ) {
            return res.status(400).json({
                error: "Email, password, language, purpose, username required",
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

        const normalizedEmail = email.trim().toLowerCase();
        let avatarUrl = selectSystemAvatar(normalizedEmail);
        
        let documentImageUrl = avatarUrl;
        if (req.file) {
            try {
                const uploaded = await uploadToCloudinary(req.file, `kyc/user-${normalizedEmail}`);
                documentImageUrl = uploaded.secure_url;
                avatarUrl = uploaded.secure_url;
            } catch (err) {
                console.error("KYC upload failed:", err);
            }
        }

        const parts = username.trim().split(/\s+/).filter(Boolean);
        const firstName = parts[0] ?? "";
        const lastName = parts.slice(1).join(" ") || null;

        const hashed = await bcrypt.hash(password.trim(), 10);
        /** @type {any} */
        const user = await prisma.verifiedUser.create({
            data: {
                email: normalizedEmail,
                password: hashed,
                firstName,
                lastName,
                avatarUrl,
                status: UserStatus.VERIFIED,
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
                documentImageUrl,
                status: KycStatus.APPROVED,
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
