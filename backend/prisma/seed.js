const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const USER_COUNT = 60;
const ADMIN_COUNT = 50;
const GROUP_COUNT = 50;
const EVENT_COUNT = 50;
const SESSION_COUNT = 50;
const REPORT_COUNT = 50;

const DEMO_PASSWORD = "123456";
const DEMO_EMAIL_DOMAIN = "tomoio.local";
const DEMO_IMAGE_BASE = "https://res.cloudinary.com/demo/image/upload";

const firstNames = [
    "Aoi",
    "Haruto",
    "Yui",
    "Riku",
    "Mei",
    "Sora",
    "Linh",
    "Minh",
    "An",
    "Hana",
];

const lastNames = [
    "Nguyen",
    "Tran",
    "Le",
    "Pham",
    "Hoang",
    "Sato",
    "Suzuki",
    "Takahashi",
    "Tanaka",
    "Ito",
];

const locations = [
    "Ha Noi",
    "Ho Chi Minh City",
    "Da Nang",
    "Hue",
    "Tokyo",
    "Osaka",
    "Kyoto",
    "Yokohama",
    "Fukuoka",
    "Nagoya",
];

const hobbies = [
    "Anime",
    "Manga",
    "Cooking",
    "Travel",
    "Photography",
    "Music",
    "Coffee",
    "Language exchange",
    "Technology",
    "Sports",
    "Books",
    "Movies",
];

const purposes = [
    "Language exchange",
    "Cultural exchange",
    "Study abroad",
    "Make friends",
    "Career networking",
    "Travel companion",
    "JLPT practice",
    "Vietnamese practice",
];

const languageValues = ["Vietnamese", "Japanese", "English"];
const jlptLevels = ["N1", "N2", "N3", "N4", "N5"];
const groupLanguageTags = ["N1", "N2", "N3", "N4", "N5", "Japanese", "Vietnamese", "English"];
const eventFormats = ["ONLINE", "OFFLINE", "HYBRID"];
const eventStatuses = ["PENDING", "APPROVED", "REJECTED"];
const kycStatuses = ["PENDING", "APPROVED", "REJECTED"];
const reportStatuses = ["PENDING", "APPROVED", "REJECTED"];
const actionTypes = ["LIKE", "PASS", "BLOCK"];
const notificationTypes = ["MATCH", "MESSAGE", "EVENT", "GROUP", "SYSTEM"];

function pad(value) {
    return String(value).padStart(3, "0");
}

function daysFromNow(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

function daysAgo(days) {
    return daysFromNow(-days);
}

function pick(list, index) {
    return list[index % list.length];
}

function sampleEmail(index) {
    return `seed.user${pad(index)}@${DEMO_EMAIL_DOMAIN}`;
}

function sampleAdminUsername(index) {
    return `seed_admin_${pad(index)}`;
}

function imageUrl(folder, index) {
    return `${DEMO_IMAGE_BASE}/${folder}/seed-${pad(index)}.jpg`;
}

function orWhere(conditions, fallback) {
    const OR = conditions.filter(Boolean);
    return OR.length ? { OR } : fallback;
}

async function cleanupSeedData() {
    const seedUsers = await prisma.verifiedUser.findMany({
        where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
        select: { id: true },
    });
    const seedUserIds = seedUsers.map((user) => user.id);

    const seedAdmins = await prisma.administrator.findMany({
        where: { username: { startsWith: "seed_admin_" } },
        select: { id: true },
    });
    const seedAdminIds = seedAdmins.map((admin) => admin.id);

    const seedGroups = await prisma.group.findMany({
        where: { name: { startsWith: "Seed Group " } },
        select: { groupId: true },
    });
    const seedGroupIds = seedGroups.map((group) => group.groupId);

    const seedPosts = await prisma.post.findMany({
        where: orWhere([
            seedUserIds.length ? { authorId: { in: seedUserIds } } : undefined,
            seedGroupIds.length ? { groupId: { in: seedGroupIds } } : undefined,
        ], { id: -1 }),
        select: { id: true },
    });
    const seedPostIds = seedPosts.map((post) => post.id);

    const seedSessions = await prisma.matchSession.findMany({
        where: seedUserIds.length
            ? { participants: { some: { userId: { in: seedUserIds } } } }
            : { id: -1 },
        select: { id: true },
    });
    const seedSessionIds = seedSessions.map((session) => session.id);

    const seedEvents = await prisma.event.findMany({
        where: {
            OR: [
                { urlLink: { startsWith: "https://tomoio.local/events/seed-" } },
                seedUserIds.length ? { adminId: { in: seedUserIds } } : undefined,
                seedAdminIds.length ? { administratorId: { in: seedAdminIds } } : undefined,
            ].filter(Boolean),
        },
        select: { id: true },
    });
    const seedEventIds = seedEvents.map((event) => event.id);

    const seedReports = await prisma.reportCase.findMany({
        where: {
            OR: [
                { evidenceUrl: { startsWith: `${DEMO_IMAGE_BASE}/reports/seed-` } },
                seedAdminIds.length ? { adminId: { in: seedAdminIds } } : undefined,
            ].filter(Boolean),
        },
        select: { id: true },
    });
    const seedReportIds = seedReports.map((report) => report.id);

    await prisma.notification.deleteMany({
        where: seedUserIds.length
            ? {
                OR: [
                    { userId: { in: seedUserIds } },
                    { relatedUserId: { in: seedUserIds } },
                    seedSessionIds.length ? { sessionId: { in: seedSessionIds } } : undefined,
                ].filter(Boolean),
            }
            : { id: -1 },
    });

    await prisma.comment.deleteMany({
        where: orWhere([
            seedPostIds.length ? { postId: { in: seedPostIds } } : undefined,
            seedUserIds.length ? { authorId: { in: seedUserIds } } : undefined,
        ], { id: -1 }),
    });
    await prisma.postLike.deleteMany({
        where: orWhere([
            seedPostIds.length ? { postId: { in: seedPostIds } } : undefined,
            seedUserIds.length ? { userId: { in: seedUserIds } } : undefined,
        ], { userId: -1 }),
    });
    await prisma.post.deleteMany({
        where: orWhere([
            seedPostIds.length ? { id: { in: seedPostIds } } : undefined,
            seedUserIds.length ? { authorId: { in: seedUserIds } } : undefined,
            seedGroupIds.length ? { groupId: { in: seedGroupIds } } : undefined,
        ], { id: -1 }),
    });

    await prisma.eventEngagement.deleteMany({
        where: orWhere([
            seedEventIds.length ? { eventId: { in: seedEventIds } } : undefined,
            seedUserIds.length ? { userId: { in: seedUserIds } } : undefined,
        ], { userId: -1 }),
    });
    await prisma.event.deleteMany({
        where: seedEventIds.length ? { id: { in: seedEventIds } } : { id: -1 },
    });

    await prisma.reportParty.deleteMany({
        where: orWhere([
            seedReportIds.length ? { caseId: { in: seedReportIds } } : undefined,
            seedUserIds.length ? { userId: { in: seedUserIds } } : undefined,
        ], { userId: -1 }),
    });
    await prisma.reportCase.deleteMany({
        where: seedReportIds.length ? { id: { in: seedReportIds } } : { id: -1 },
    });

    await prisma.message.deleteMany({
        where: orWhere([
            seedSessionIds.length ? { sessionId: { in: seedSessionIds } } : undefined,
            seedUserIds.length ? { senderId: { in: seedUserIds } } : undefined,
        ], { id: -1 }),
    });
    await prisma.matchParticipant.deleteMany({
        where: orWhere([
            seedSessionIds.length ? { sessionId: { in: seedSessionIds } } : undefined,
            seedUserIds.length ? { userId: { in: seedUserIds } } : undefined,
        ], { userId: -1 }),
    });
    await prisma.matchSession.deleteMany({
        where: seedSessionIds.length ? { id: { in: seedSessionIds } } : { id: -1 },
    });

    await prisma.groupMember.deleteMany({
        where: orWhere([
            seedGroupIds.length ? { groupId: { in: seedGroupIds } } : undefined,
            seedUserIds.length ? { userId: { in: seedUserIds } } : undefined,
        ], { id: -1 }),
    });
    await prisma.groupHobbyTag.deleteMany({
        where: seedGroupIds.length ? { groupId: { in: seedGroupIds } } : { groupId: -1 },
    });
    await prisma.groupLanguageTag.deleteMany({
        where: seedGroupIds.length ? { groupId: { in: seedGroupIds } } : { groupId: -1 },
    });
    await prisma.group.deleteMany({
        where: seedGroupIds.length ? { groupId: { in: seedGroupIds } } : { groupId: -1 },
    });

    await prisma.userProfileAction.deleteMany({
        where: seedUserIds.length
            ? orWhere([
                { actorId: { in: seedUserIds } },
                { targetId: { in: seedUserIds } },
            ], { actorId: -1 })
            : { actorId: -1 },
    });
    await prisma.kycRequest.deleteMany({
        where: seedUserIds.length ? { userId: { in: seedUserIds } } : { userId: -1 },
    });
    await prisma.userPhoto.deleteMany({
        where: seedUserIds.length ? { userId: { in: seedUserIds } } : { userId: -1 },
    });
    await prisma.userLanguage.deleteMany({
        where: seedUserIds.length ? { userId: { in: seedUserIds } } : { userId: -1 },
    });
    await prisma.userPurpose.deleteMany({
        where: seedUserIds.length ? { userId: { in: seedUserIds } } : { userId: -1 },
    });
    await prisma.userHobby.deleteMany({
        where: seedUserIds.length ? { userId: { in: seedUserIds } } : { userId: -1 },
    });
    await prisma.verifiedUser.deleteMany({
        where: seedUserIds.length ? { id: { in: seedUserIds } } : { id: -1 },
    });
    await prisma.administrator.deleteMany({
        where: seedAdminIds.length ? { id: { in: seedAdminIds } } : { id: -1 },
    });
}

async function createUsers(passwordHash) {
    const users = [];

    for (let i = 1; i <= USER_COUNT; i += 1) {
        const firstName = pick(firstNames, i);
        const lastName = pick(lastNames, i);
        const user = await prisma.verifiedUser.create({
            data: {
                email: sampleEmail(i),
                password: passwordHash,
                firstName,
                lastName,
                dateOfBirth: new Date(1990 + (i % 12), i % 12, (i % 26) + 1),
                location: pick(locations, i),
                bio: `Seed profile ${pad(i)} for Tomoio demo data. Interested in culture, language exchange, and community events.`,
                avatarUrl: imageUrl("avatars", i),
                createdAt: daysAgo(USER_COUNT - i),
                status: i % 10 === 0 ? "PENDING" : "VERIFIED",
            },
        });
        users.push(user);
    }

    for (let i = 0; i < users.length; i += 1) {
        const user = users[i];
        const mainIndex = i + 1;
        await prisma.userPhoto.createMany({
            data: [
                {
                    url: imageUrl("profiles", mainIndex),
                    isMain: true,
                    userId: user.id,
                },
                {
                    url: imageUrl("profiles", mainIndex + USER_COUNT),
                    isMain: false,
                    userId: user.id,
                },
            ],
        });
        await prisma.userLanguage.createMany({
            data: [
                {
                    language: pick(languageValues, i),
                    type: "native",
                    level: null,
                    userId: user.id,
                },
                {
                    language: pick(languageValues, i + 1),
                    type: "learning",
                    level: pick(jlptLevels, i),
                    userId: user.id,
                },
            ],
        });
        await prisma.userPurpose.createMany({
            data: [0, 1].map((offset) => ({
                purpose: pick(purposes, i + offset),
                userId: user.id,
            })),
        });
        await prisma.userHobby.createMany({
            data: [0, 1, 2].map((offset) => ({
                hobbyName: pick(hobbies, i + offset),
                userId: user.id,
            })),
        });
    }

    return users;
}

async function createAdministrators(passwordHash) {
    const admins = [];

    for (let i = 1; i <= ADMIN_COUNT; i += 1) {
        const admin = await prisma.administrator.create({
            data: {
                username: sampleAdminUsername(i),
                password: passwordHash,
                roleLevel: i % 5 === 0 ? "SUPER_ADMIN" : "MODERATOR",
                createdAt: daysAgo(ADMIN_COUNT - i),
            },
        });
        admins.push(admin);
    }

    return admins;
}

async function createGroups(users) {
    const groups = [];

    for (let i = 1; i <= GROUP_COUNT; i += 1) {
        const group = await prisma.group.create({
            data: {
                name: `Seed Group ${pad(i)} - ${pick(hobbies, i)}`,
                createdAt: daysAgo(GROUP_COUNT - i),
                description: `Community group ${pad(i)} for ${pick(hobbies, i).toLowerCase()} and language exchange activities.`,
                groupAvatar: imageUrl("group-avatars", i),
                groupCover: imageUrl("group-covers", i),
                memberCount: 0,
            },
        });
        groups.push(group);

        await prisma.groupHobbyTag.createMany({
            data: [0, 1].map((offset) => ({
                groupId: group.groupId,
                name: pick(hobbies, i + offset),
            })),
        });
        await prisma.groupLanguageTag.createMany({
            data: [0, 1].map((offset) => ({
                groupId: group.groupId,
                name: pick(groupLanguageTags, i + offset),
            })),
        });

        const memberUserIds = new Set();
        for (let offset = 0; offset < 12; offset += 1) {
            memberUserIds.add(users[(i + offset) % users.length].id);
        }

        await prisma.groupMember.createMany({
            data: [...memberUserIds].map((userId, index) => ({
                userId,
                groupId: group.groupId,
                joinedAt: daysAgo(index + i),
            })),
        });
        await prisma.group.update({
            where: { groupId: group.groupId },
            data: { memberCount: memberUserIds.size },
        });
    }

    return groups;
}

async function createPosts(users, groups) {
    const posts = [];

    for (let i = 0; i < groups.length; i += 1) {
        for (let offset = 0; offset < 2; offset += 1) {
            const index = i * 2 + offset + 1;
            const post = await prisma.post.create({
                data: {
                    content: `Seed post ${pad(index)}: sharing a useful tip for ${groups[i].name}.`,
                    createdAt: daysAgo(index % 45),
                    groupId: groups[i].groupId,
                    authorId: users[(i + offset) % users.length].id,
                    image: offset === 0 ? imageUrl("posts", index) : null,
                },
            });
            posts.push(post);
        }
    }

    for (let i = 0; i < posts.length; i += 1) {
        await prisma.comment.createMany({
            data: [0, 1].map((offset) => ({
                content: `Seed comment ${pad(i * 2 + offset + 1)} on post ${pad(posts[i].id)}.`,
                createdAt: daysAgo((i + offset) % 30),
                postId: posts[i].id,
                authorId: users[(i + offset + 3) % users.length].id,
            })),
        });

        const likeUserIds = new Set();
        for (let offset = 0; offset < 3; offset += 1) {
            likeUserIds.add(users[(i + offset + 5) % users.length].id);
        }
        await prisma.postLike.createMany({
            data: [...likeUserIds].map((userId) => ({
                userId,
                postId: posts[i].id,
            })),
        });
    }

    return posts;
}

async function createSessionsAndMessages(users) {
    const sessions = [];

    for (let i = 1; i <= SESSION_COUNT; i += 1) {
        const firstUser = users[(i - 1) % users.length];
        const secondUser = users[(i + 13) % users.length];
        const session = await prisma.matchSession.create({
            data: {
                status: i % 7 === 0 ? "BLOCKED" : "ACTIVE",
                createdAt: daysAgo(SESSION_COUNT - i),
            },
        });
        sessions.push({ ...session, participantIds: [firstUser.id, secondUser.id] });

        await prisma.matchParticipant.createMany({
            data: [
                { sessionId: session.id, userId: firstUser.id },
                { sessionId: session.id, userId: secondUser.id },
            ],
        });

        await prisma.message.createMany({
            data: [0, 1, 2, 3].map((offset) => ({
                content: offset === 2 && i % 5 === 0 ? null : `Seed message ${pad(i)}-${offset + 1}`,
                sendAt: daysAgo((SESSION_COUNT - i) + offset),
                sessionId: session.id,
                senderId: offset % 2 === 0 ? firstUser.id : secondUser.id,
                attachmentUrl: offset === 2 && i % 5 === 0 ? imageUrl("chat", i) : null,
                deletedAt: offset === 3 && i % 17 === 0 ? daysAgo(1) : null,
                editedAt: offset === 1 && i % 9 === 0 ? daysAgo(1) : null,
                isSeen: offset < 3,
                messageType: offset === 2 && i % 5 === 0 ? "IMAGE" : "TEXT",
                translatedText: {
                    en: `Seed translated message ${pad(i)}-${offset + 1}`,
                    vi: `Tin nhan mau ${pad(i)}-${offset + 1}`,
                    ja: `Sample JP ${pad(i)}-${offset + 1}`,
                },
            })),
        });
    }

    return sessions;
}

async function createEvents(users, admins) {
    const events = [];

    for (let i = 1; i <= EVENT_COUNT; i += 1) {
        const event = await prisma.event.create({
            data: {
                title: `Seed Event ${pad(i)} - ${pick(purposes, i)}`,
                description: `Demo event ${pad(i)} for Tomoio users to practice language exchange and cultural sharing.`,
                eventTime: daysFromNow(i),
                format: pick(eventFormats, i),
                address: `${100 + i} Demo Street, ${pick(locations, i)}`,
                urlLink: `https://tomoio.local/events/seed-${pad(i)}`,
                imageUrl: imageUrl("events", i),
                createdAt: daysAgo(i),
                adminId: users[i % users.length].id,
                administratorId: admins[i % admins.length].id,
                status: pick(eventStatuses, i),
            },
        });
        events.push(event);

        const attendeeIds = new Set();
        for (let offset = 0; offset < 5; offset += 1) {
            attendeeIds.add(users[(i + offset + 7) % users.length].id);
        }
        await prisma.eventEngagement.createMany({
            data: [...attendeeIds].map((userId, index) => ({
                eventId: event.id,
                userId,
                engagementType: index % 3 === 0 ? "INTERESTED" : "JOINED",
                engagedAt: daysAgo(index + i),
            })),
        });
    }

    return events;
}

async function createKycRequests(users, admins) {
    for (let i = 0; i < users.length; i += 1) {
        const status = pick(kycStatuses, i);
        await prisma.kycRequest.create({
            data: {
                documentImageUrl: imageUrl("kyc", i + 1),
                rejectReason: status === "REJECTED" ? "Seed rejection reason: document is unclear." : null,
                submittedAt: daysAgo(USER_COUNT - i),
                reviewedAt: status === "PENDING" ? null : daysAgo(Math.max(USER_COUNT - i - 1, 0)),
                userId: users[i].id,
                adminId: status === "PENDING" ? null : admins[i % admins.length].id,
                status,
            },
        });
    }
}

async function createReports(users, admins) {
    for (let i = 1; i <= REPORT_COUNT; i += 1) {
        const reporter = users[(i - 1) % users.length];
        const reported = users[(i + 19) % users.length];
        const report = await prisma.reportCase.create({
            data: {
                reason: `Seed report ${pad(i)}: inappropriate behavior in chat or community interaction.`,
                evidenceUrl: imageUrl("reports", i),
                createdAt: daysAgo(REPORT_COUNT - i),
                adminId: admins[i % admins.length].id,
                status: pick(reportStatuses, i),
            },
        });

        await prisma.reportParty.createMany({
            data: [
                {
                    userId: reporter.id,
                    caseId: report.id,
                    partyRole: "REPORTER",
                },
                {
                    userId: reported.id,
                    caseId: report.id,
                    partyRole: "REPORTED",
                },
            ],
        });
    }
}

async function createProfileActions(users) {
    const seen = new Set();
    const rows = [];

    for (let actorIndex = 0; actorIndex < users.length && rows.length < 150; actorIndex += 1) {
        for (let offset = 1; offset <= 12 && rows.length < 150; offset += 1) {
            for (let actionIndex = 0; actionIndex < actionTypes.length && rows.length < 150; actionIndex += 1) {
                const actor = users[actorIndex];
                const target = users[(actorIndex + offset) % users.length];
                const action = actionTypes[actionIndex];
                const key = `${actor.id}:${target.id}:${action}`;
                if (actor.id === target.id || seen.has(key)) continue;

                seen.add(key);
                rows.push({
                    actorId: actor.id,
                    targetId: target.id,
                    action,
                    createdAt: daysAgo(rows.length % 40),
                });
            }
        }
    }

    await prisma.userProfileAction.createMany({ data: rows });
}

async function createNotifications(users, sessions) {
    const rows = [];

    for (let i = 0; i < 120; i += 1) {
        const user = users[i % users.length];
        const relatedUser = users[(i + 9) % users.length];
        const session = sessions[i % sessions.length];
        rows.push({
            userId: user.id,
            type: pick(notificationTypes, i),
            message: `Seed notification ${pad(i + 1)} for ${user.firstName}.`,
            relatedUserId: relatedUser.id,
            sessionId: session.id,
            isRead: i % 4 === 0,
            createdAt: daysAgo(i % 35),
        });
    }

    await prisma.notification.createMany({ data: rows });
}

async function printSummary() {
    const [
        users,
        admins,
        photos,
        languages,
        userPurposes,
        userHobbies,
        groups,
        groupHobbyTags,
        groupLanguageTags,
        groupMembers,
        posts,
        postLikes,
        comments,
        sessions,
        participants,
        messages,
        events,
        engagements,
        kycRequests,
        reports,
        reportParties,
        actions,
        notifications,
    ] = await Promise.all([
        prisma.verifiedUser.count({ where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } } }),
        prisma.administrator.count({ where: { username: { startsWith: "seed_admin_" } } }),
        prisma.userPhoto.count(),
        prisma.userLanguage.count(),
        prisma.userPurpose.count(),
        prisma.userHobby.count(),
        prisma.group.count({ where: { name: { startsWith: "Seed Group " } } }),
        prisma.groupHobbyTag.count(),
        prisma.groupLanguageTag.count(),
        prisma.groupMember.count(),
        prisma.post.count(),
        prisma.postLike.count(),
        prisma.comment.count(),
        prisma.matchSession.count(),
        prisma.matchParticipant.count(),
        prisma.message.count(),
        prisma.event.count({ where: { urlLink: { startsWith: "https://tomoio.local/events/seed-" } } }),
        prisma.eventEngagement.count(),
        prisma.kycRequest.count(),
        prisma.reportCase.count(),
        prisma.reportParty.count(),
        prisma.userProfileAction.count(),
        prisma.notification.count(),
    ]);

    console.table({
        users,
        admins,
        photos,
        languages,
        userPurposes,
        userHobbies,
        groups,
        groupHobbyTags,
        groupLanguageTags,
        groupMembers,
        posts,
        postLikes,
        comments,
        sessions,
        participants,
        messages,
        events,
        engagements,
        kycRequests,
        reports,
        reportParties,
        actions,
        notifications,
    });
}

async function main() {
    console.log("Cleaning previous seed data...");
    await cleanupSeedData();

    console.log("Creating Tomoio seed data...");
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    const users = await createUsers(passwordHash);
    const admins = await createAdministrators(passwordHash);
    const groups = await createGroups(users);
    await createPosts(users, groups);
    const sessions = await createSessionsAndMessages(users);
    await createEvents(users, admins);
    await createKycRequests(users, admins);
    await createReports(users, admins);
    await createProfileActions(users);
    await createNotifications(users, sessions);

    console.log(`Seed completed. Demo password for all seed users/admins: ${DEMO_PASSWORD}`);
    console.log(`Demo verified user: ${sampleEmail(1)} / ${DEMO_PASSWORD}`);
    await printSummary();
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
