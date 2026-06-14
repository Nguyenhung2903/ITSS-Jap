require("dotenv").config();
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

const firstNamesJP = [
    "Sora", "Haruka", "Kota", "Kenji", "Hiroto", "Yuki", "Ryouta", "Takuya", "Kazuki", "Aoi",
    "Haruto", "Yui", "Riku", "Mei", "Hana", "Takumi", "Yuka", "Mai", "Ken", "Sakura"
];

const lastNamesJP = [
    "Tanaka", "Suzuki", "Yamamoto", "Sato", "Takahashi", "Ito", "Watanabe", "Nakamura", "Kobayashi", "Kato",
    "Yoshida", "Yamada", "Sasaki", "Yamaguchi", "Saito", "Matsumoto", "Inoue", "Kimura", "Hayashi", "Shimizu"
];

const firstNamesVN = [
    "Linh", "Minh", "An", "Lan", "Vy", "Nam", "Huong", "Tuan", "Mai", "Dung",
    "Thao", "Khanh", "Hoang", "Trang", "Phong", "Hai", "Quynh", "Anh", "Giang", "Binh"
];

const lastNamesVN = [
    "Nguyen", "Tran", "Le", "Pham", "Hoang", "Vu", "Vo", "Phan", "Huynh", "Dang",
    "Bui", "Do", "Ho", "Ngo", "Duong", "Lam", "Dinh", "Ly", "Tong", "Quach"
];

const locations = [
    "東京",
    "大阪",
    "ハノイ",
    "ホーチミン",
    "ダナン",
    "横浜",
    "京都",
    "福岡",
    "名古屋"
];

const hobbies = [
    "アニメ", "Manga", "料理", "旅行", "写真", "音楽", "カフェ", "言語交換", "テクノロジー", "スポーツ", "読書", "映画"
];

const purposes = [
    "言語交換",
    "文化交流",
    "留学",
    "友達作り",
    "キャリア交流",
    "旅行仲間",
    "JLPT練習",
    "ベトナム語練習"
];

const eventFormats = ["ONLINE", "OFFLINE", "HYBRID"];
const eventStatuses = ["PENDING", "APPROVED", "REJECTED"];
const kycStatuses = ["PENDING", "APPROVED", "REJECTED"];
const reportStatuses = ["PENDING", "APPROVED", "REJECTED"];
const actionTypes = ["LIKE", "PASS", "BLOCK"];
const notificationTypes = ["MATCH", "MESSAGE", "EVENT", "GROUP", "SYSTEM"];

const bioTemplates = [
    "はじめまして！東京に住んでいる会社員です。ベトナム旅行が大好きで、ハノイやホーチミンに何度も行ったことがあります。もっとベトナム語を話せるようになりたいので、一緒に練習しましょう！日本のことについても何でも聞いてくださいね。",
    "こんにちは。ダナン出身で、今は東京でITエンジニアとして働いています。日本語はN2ですが、もっと自然な会話ができるようになりたいです。趣味は写真とカフェ巡りです。よろしくお願いします！",
    "ベトナム語を勉強し始めたばかりの初心者です。ベトナムの音楽や料理に興味があります。日本語を勉強しているベトナム人の方と、お互いの言語や文化について楽しくお話ししたいです！",
    "ハノイ在住の学生です。将来日本に留学したいと思っています。JLPT N3の勉強中ですが、特にリスニング và スピーキング力を向上させたいです。アニメや漫画が大好きです！",
    "こんにちは！ベトナム料理を作るのが趣味の日本人です。お互いの母国語を教え合える友達を探しています。週末にオンラインで話せる方、気軽にメッセージしてください。",
    "日本に来て2年になります。日本の文化や歴史が大好きです。ベトナム語を学びたい日本人の方、私のベトナム語と交換で日本語の会話練習をしませんか？",
    "写真と旅行が好きなバックパッカーです。ベトナムのローカルな観光地や美味しいカフェの情報交換をしたいです。日本語とベトナム語の両方で楽しく交流しましょう！",
    "JLPT N1を目指して猛勉強中です！日常会話からビジネス会話まで、幅広いトピックで日本語を話せるようになりたいです。私もベトナム語の学習をサポートします。",
    "週末の空いた時間にカフェで言語交換できる友人を探しています。言語だけでなく、お互いの国の生活や習慣についても話せたら嬉しいです！",
    "プログラミングとガジェットが大好きなエンジニアです。日本語とベトナム語の技術用語や、業界の働き方について情報交換したいです。よろしくお願いします。"
];

const chatThreads = [
    [
        { text: "はじめまして！マッチングありがとうございます。日本語を勉強されているんですね！", ja: "はじめまして！マッチングありがとうございます。日本語を勉強されているんですね！", vi: "Rất vui được làm quen với bạn! Cảm ơn bạn đã match với mình. Bạn đang học tiếng Nhật đúng không?" },
        { text: "はじめまして！はい、今JLPT N2に向けて勉強しています。会話が苦手なので練習したいです。", ja: "はじめまして！はい、今JLPT N2に向けて勉強しています。会話が苦手なので練習したいです。", vi: "Chào bạn! Vâng, mình đang ôn thi JLPT N2. Mình giao tiếp chưa tốt nên rất muốn luyện tập thêm." },
        { text: "素晴らしいですね！私はベトナム語を学び始めたばかりなので、お互いに教え合えたら嬉しいです。", ja: "素晴らしいですね！私はベトナム語を学び始めたばかりなので、お互いに教え合えたら嬉しいです。", vi: "Tuyệt vời quá! Mình mới bắt đầu học tiếng Việt, hi vọng chúng ta có thể giúp đỡ lẫn nhau." },
        { text: "ぜひ！週末に一度オンラインで話してみませんか？", ja: "ぜひ！週末に一度オンラインで話してみませんか？", vi: "Nhất trí ạ! Cuối tuần này chúng mình gọi điện nói chuyện online thử nhé?" }
    ],
    [
        { text: "こんにちは！プロフィール写真のハロン湾、すごく綺麗ですね。旅行で行かれたんですか？", ja: "こんにちは！プロフィール写真のハロン湾、すごく綺麗ですね。旅行で行かれたんですか？", vi: "Chào bạn! Ảnh Vịnh Hạ Long trên trang cá nhân của bạn đẹp quá. Bạn đi du lịch ở đó à?" },
        { text: "ありがとうございます！はい、去年的夏に家族で行きました。ベトナム旅行は初めてでしたか？", ja: "ありがとうございます！はい、去年的夏に家族で行きました。ベトナム旅行は初めてでしたか？", vi: "Cảm ơn bạn! Đúng vậy, mùa hè năm ngoái mình đi cùng gia đình. Đó là lần đầu tiên bạn đến Việt Nam à?" },
        { text: "実はまだ行ったことがなくて、ずっと行ってみたいと思っているんです。おすすめの場所はありますか？", ja: "実はまだ行ったことがなくて、ずっと行ってみたいと思っているんです。おすすめの場所はありますか？", vi: "Thật ra mình chưa đi bao giờ, nhưng luôn muốn ghé thăm. Bạn có gợi ý địa điểm nào không?" },
        { text: "ハノイの旧市街やホイアンが歴史情緒があっておすすめですよ！今度詳しくお話ししますね。", ja: "ハノイの旧市街やホイアンが歴史情緒があっておすすめですよ！今度詳しくお話ししますね。", vi: "Phố cổ Hà Nội hay Hội An có không khí cổ kính và rất đáng đi đó! Lần tới mình sẽ kể chi tiết hơn nhé." }
    ],
    [
        { text: "こんにちは！ベトナム料理が好きなんですね。私もフォーやバインミーが大好きです！", ja: "こんにちは！ベトナム料理が好きなんですね。私もフォーやバインミーが大好きです！", vi: "Chào bạn! Bạn thích món ăn Việt Nam à. Mình cũng cực kỳ mê phở và bánh mì!" },
        { text: "こんにちは！美味しいですよね。東京にもベトナム料理店がたくさんあって嬉しいです。", ja: "こんにちは！美味しいですよね。東京にもベトナム料理店がたくさんあって嬉しいです。", vi: "Chào bạn! Công nhận ngon thật. Mình rất vui vì ở Tokyo cũng có nhiều quán ăn Việt Nam." },
        { text: "おすすめの店はありますか？今度一緒に行ってみたいです！", ja: "おすすめの店はありますか？今度一緒に行ってみたいです！", vi: "Bạn có biết quán nào ngon không? Hôm nào chúng mình cùng đi ăn đi!" },
        { text: "新宿にあるお店が本場の味に近くて美味しいですよ！今度一緒に行きましょう。", ja: "新宿にあるお店が本場の味に近くて美味しいですよ！今度一緒に行きましょう。", vi: "Có một quán ở Shinjuku vị rất chuẩn và ngon đó! Hôm nào đi cùng nhau nhé." }
    ],
    [
        { text: "マッチありがとうございます！好きなアニメは何ですか？", ja: "マッチありがとうございます！好きなアニメは何ですか？", vi: "Cảm ơn bạn đã match! Bộ anime yêu thích của bạn là gì vậy?" },
        { text: "こちらこそ！最近は『鬼滅の刃』や『進撃の巨人』をよく見ています。日本のアニメは最高ですね！", ja: "こちらこそ！最近は『鬼滅の刃』や『進撃の巨人』をよく見ています。日本のアニメは最高ですね！", vi: "Cảm ơn bạn! Dạo này mình hay xem Kimetsu no Yaiba và Attack on Titan. Anime Nhật Bản là đỉnh nhất!" },
        { text: "私もそれ大好きです！最新シーズンは見ましたか？", ja: "私もそれ大好きです！最新シーズンは見ましたか？", vi: "Mình cũng thích mấy bộ đó lắm! Bạn đã xem mùa mới nhất chưa?" },
        { text: "はい、もちろん見ました！語彙の勉強にもなるので、アニメはよく見ているんです。", ja: "はい、もちろん見ました！語彙の勉強にもなるので、アニメはよく見ているんです。", vi: "Vâng tất nhiên là xem rồi! Mình thường xem anime vừa giải trí vừa học thêm từ vựng." }
    ],
    [
        { text: "こんにちは！JLPTの勉強はどうですか？順調ですか？", ja: "こんにちは！JLPTの勉強はどうですか？順調ですか？", vi: "Chào bạn! Việc học JLPT của bạn thế nào rồi? Có thuận lợi không?" },
        { text: "こんにちは。漢字の勉強が難しくて苦戦しています。おすすめの勉強法はありますか？", ja: "こんにちは。漢字の勉強が難しくて苦戦しています。おすすめの勉強法はありますか？", vi: "Chào bạn. Học kanji khó quá nên mình đang hơi chật vật. Bạn có phương pháp nào hay không?" },
        { text: "漢字は書いて覚えるのも良いですが、日常の文章をたくさん読むと自然に身につきますよ。", ja: "漢字は書いて覚えるのも良いですが、日常の文章をたくさん読むと自然に身につきますよ。", vi: "Kanji viết đi viết lại cũng tốt, nhưng nếu bạn đọc nhiều văn bản thực tế thì sẽ nhớ tự nhiên hơn đó." },
        { text: "なるほど、参考になります！簡単なニュース記事から読んでみます。ありがとうございます！", ja: "なるほど、参考になります！簡単なニュース記事から読んでみます。ありがとうございます！", vi: "À ra thế, bổ ích quá! Mình sẽ thử đọc các bài báo tin tức đơn giản. Cảm ơn bạn nhé!" }
    ]
];

const groupTemplates = [
    {
        name: "日本語会話クラブ",
        description: "日本語で気軽に日常会話を楽しむグループです。初心者から上級者まで大歓迎！",
        hobbies: ["言語交換", "日本文化"],
        languages: ["日本語", "日本"]
    },
    {
        name: "ベトナム語初心者グループ",
        description: "ベトナム語を学び始めたばかりの人のための勉強会です。基礎からゆっくり学びましょう。",
        hobbies: ["言語交換", "旅行"],
        languages: ["ベトナム", "ベトナム語"]
    },
    {
        name: "ハノイ生活情報交換",
        description: "ハノイでの生活情報、おすすめレストラン、家探しなどの役立つ情報をシェアするグループです。",
        hobbies: ["旅行", "カフェ"],
        languages: ["ベトナム", "日本"]
    },
    {
        name: "東京ベトナム交流会",
        description: "東京近郊に住む日本人とベトナム人の交流コミュニティです。定期的にオフラインイベントを開催します。",
        hobbies: ["文化交流", "料理"],
        languages: ["日本", "ベトナム"]
    },
    {
        name: "JLPT N2勉強会",
        description: "JLPT N2合格を目指して、文法や語彙、読解を一緒に勉強するグループです。",
        hobbies: ["スポーツ", "読書"],
        languages: ["日本", "日本語"]
    },
    {
        name: "旅行好きコミュニティ",
        description: "日本とベトナムの旅行が大好きな人たちが集まるグループです。おすすめの観光スポットを共有しましょう。",
        hobbies: ["旅行", "写真"],
        languages: ["日本", "ベトナム"]
    },
    {
        name: "カフェで言語交換",
        description: "週末にカフェに集まって、コーヒーを飲みながら楽しく日本語とベトナム語で話すグループです。",
        hobbies: ["カフェ", "言語交換"],
        languages: ["日本", "ベトナム"]
    },
    {
        name: "日本文化研究会",
        description: "日本の伝統文化からポップカルチャー、アニメ、お祭りまで幅広く語り合うグループです。",
        hobbies: ["日本文化", "アニメ"],
        languages: ["日本", "日本語"]
    },
    {
        name: "ベトナム料理を楽しむ会",
        description: "フォー、生春巻き、バインセオなど、美味しいベトナム料理を食べに行ったり一緒に作ったりするグループです。",
        hobbies: ["ベトナム料理", "料理"],
        languages: ["ベトナム", "日本語"]
    },
    {
        name: "IT・エンジニア交流会",
        description: "日本とベトナムのITエンジニア、プログラマーの技術交流・キャリア相談のためのグループです。",
        hobbies: ["プログラミング", "テクノロジー"],
        languages: ["日本", "ベトナム"]
    }
];

const eventTemplates = [
    { title: "ハノイ日本語交流会", description: "ハノイのカフェで日本語のフリートークを楽しむ交流会です。ベトナム人と日本人の参加者をお待ちしています！" },
    { title: "東京ベトナム語カフェ会", description: "東京のカフェに集まって、美味しいコーヒーを飲みながらベトナム語と日本語で交流しましょう。初心者歓迎！" },
    { title: "JLPT N2 模擬会話練習", description: "JLPT N2レベルの表現を使って、様々なトピックでディスカッションを行うオンラインの模擬会話練習会です。" },
    { title: "ベトナム料理体験イベント", description: "みんなで一緒にベトナムの生春巻きやフォーを作る料理体験会です。料理の後は楽しく試食＆おしゃべりタイム！" },
    { title: "日本文化オンライン交流会", description: "自宅から参加できるオンラインの文化交流会です。日本のお祭りや四季のイベント、アニメについて楽しく語り合いましょう。" },
    { title: "留学経験シェア会", description: "日本への留学やベトナムへの留学を経験した先輩たちが、リアルな体験談やアドバイスをシェアする相談会です。" },
    { title: "写真好きの散歩交流会", description: "カメラやスマホを持って街を散策しながら、素敵な写真を撮って交流する散歩イベントです。初心者も大歓迎！" },
    { title: "キャリア相談ミートアップ", description: "日系企業で働きたいベトナム人の方や、ベトナムで働きたい日本人の方のための情報交換・キャリア相談会です。" }
];

const postContents = [
    "こんにちは！今週の勉強会用の資料をアップロードしました。参加する方は事前に目を通しておいてくださいね。",
    "皆さん、日本語を勉強するときに一番効果的だと思う方法は何ですか？私は漢字の書き取りとニュースを読むことです。",
    "今週末、東京で集まる予定のオフラインイベントについて、集合場所を変更しました。詳細はイベントページをご確認ください！",
    "ベトナム料理のフォーの作り方を共有します！日本で手に入る材料だけで作れるレシピにアレンジしてみました。",
    "JLPTの聴解テストで高得点を取るためのコツをまとめました。興味がある方はぜひ読んでみてください！",
    "最近ベトナム語の日常会話フレーズを勉強しています。ネイティブの方が使う自然な表現を教えてもらえると嬉しいです！",
    "ハノイのおすすめのカフェ情報をシェアします。静かでWi-Fiも早くて、勉強や作業にぴったりの場所です。",
    "日本の伝統的なマナーについて質問です。お辞儀の角度やタイミングについて、詳しく教えていただけないでしょうか？"
];

const commentContents = [
    "有益な情報をありがとうございます！とても参考になりました。",
    "私もその方法で勉強しています！一緒に頑張りましょう。",
    "集合場所の変更了解しました。当日は楽しみにしています！",
    "美味しそうですね！今週末にさっそく作ってみます。",
    "詳細なまとめをありがとうございます。とても分かりやすいです！",
    "私がよく使う日常会話表現を今度メッセージで送りますね。",
    "そのカフェ、私も行ったことがあります！とても素敵な場所ですよね。",
    "お辞儀のマナーについては、次の交流会で実演しながら教えますね！"
];

const notificationMessages = [
    "新しいマッチが成立しました！さっそくチャットを送ってみましょう。",
    "新着メッセージが届いています。",
    "参加予定のイベントが明日開催されます。",
    "新しいコミュニティグループが作成されました。",
    "身分証の確認が完了し、アカウントが承認されました。"
];

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
    if (folder === "avatars") {
        return `/assets/images/avatars/avatar-${((index - 1) % 10) + 1}.jpg`;
    }
    if (folder === "profiles") {
        return `/assets/images/recommendations/rec-${((index - 1) % 3) + 1}.png`;
    }
    if (folder === "group-avatars") {
        return `/assets/images/groups/group-${((index - 1) % 4) + 1}.jpg`;
    }
    if (folder === "group-covers") {
        return `/assets/images/groups/group-cover.png`;
    }
    if (folder === "events") {
        return `/assets/images/events/event-${((index - 1) % 4) + 1}.png`;
    }
    if (folder === "posts" || folder === "chat") {
        return `/assets/images/recommendations/rec-${((index - 1) % 3) + 1}.png`;
    }
    return `/assets/images/avatars/avatar.jpg`;
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
        where: {
            OR: [
                { name: { startsWith: "Seed Group " } },
                { description: { in: groupTemplates.map((g) => g.description) } }
            ]
        },
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
                { urlLink: { startsWith: "https://tomoio.local/events/" } },
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
                { reason: { startsWith: "Seed report " } },
                { reason: { contains: "behavior in chat" } },
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
        const isJapanese = i % 2 === 0;
        let firstName, lastName;
        if (isJapanese) {
            firstName = pick(firstNamesJP, i);
            lastName = pick(lastNamesJP, i);
        } else {
            firstName = pick(firstNamesVN, i);
            lastName = pick(lastNamesVN, i);
        }
        const user = await prisma.verifiedUser.create({
            data: {
                email: sampleEmail(i),
                password: passwordHash,
                firstName,
                lastName,
                dateOfBirth: new Date(1990 + (i % 12), i % 12, (i % 26) + 1),
                location: pick(locations, i),
                bio: pick(bioTemplates, i),
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
        const isJapanese = mainIndex % 2 === 0;

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

        const nativeLang = isJapanese ? "日本" : "ベトナム";
        const learningLang = isJapanese ? "ベトナム" : "日本";
        const learningLevel = isJapanese
            ? pick(["初級", "中級", "上級"], i)
            : pick(["N1", "N2", "N3", "N4", "N5"], i);

        await prisma.userLanguage.createMany({
            data: [
                {
                    language: nativeLang,
                    type: "native",
                    level: null,
                    userId: user.id,
                },
                {
                    language: learningLang,
                    type: "learning",
                    level: learningLevel,
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

        // Map hobbies array to Japanese
        const hobbiesList = [
            "アニメ", "漫画", "料理", "旅行", "写真", "音楽", "カフェ", "言語交換", "テクノロジー", "スポーツ", "読書", "映画"
        ];
        await prisma.userHobby.createMany({
            data: [0, 1, 2].map((offset) => ({
                hobbyName: pick(hobbiesList, i + offset),
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
        const template = groupTemplates[(i - 1) % groupTemplates.length];
        const group = await prisma.group.create({
            data: {
                name: `${template.name} #${pad(i)}`,
                createdAt: daysAgo(GROUP_COUNT - i),
                description: template.description,
                groupAvatar: imageUrl("group-avatars", i),
                groupCover: imageUrl("group-covers", i),
                memberCount: 0,
            },
        });
        groups.push(group);

        await prisma.groupHobbyTag.createMany({
            data: template.hobbies.map((name) => ({
                groupId: group.groupId,
                name,
            })),
        });
        await prisma.groupLanguageTag.createMany({
            data: template.languages.map((name) => ({
                groupId: group.groupId,
                name,
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
            const content = postContents[(index - 1) % postContents.length];
            const post = await prisma.post.create({
                data: {
                    content,
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
                content: commentContents[(i * 2 + offset) % commentContents.length],
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

        const thread = chatThreads[(i - 1) % chatThreads.length];

        await prisma.message.createMany({
            data: [0, 1, 2, 3].map((offset) => {
                const msg = thread[offset];
                return {
                    content: offset === 2 && i % 5 === 0 ? null : msg.text,
                    sendAt: daysAgo((SESSION_COUNT - i) + offset),
                    sessionId: session.id,
                    senderId: offset % 2 === 0 ? firstUser.id : secondUser.id,
                    attachmentUrl: offset === 2 && i % 5 === 0 ? imageUrl("chat", i) : null,
                    deletedAt: offset === 3 && i % 17 === 0 ? daysAgo(1) : null,
                    editedAt: offset === 1 && i % 9 === 0 ? daysAgo(1) : null,
                    isSeen: offset < 3,
                    messageType: offset === 2 && i % 5 === 0 ? "IMAGE" : "TEXT",
                    translatedText: {
                        en: msg.text,
                        vi: msg.vi,
                        ja: msg.ja,
                    },
                };
            }),
        });
    }

    return sessions;
}

async function createEvents(users, admins) {
    const events = [];

    for (let i = 1; i <= EVENT_COUNT; i += 1) {
        const template = eventTemplates[(i - 1) % eventTemplates.length];
        const format = pick(eventFormats, i);
        const event = await prisma.event.create({
            data: {
                title: `${template.title} #${pad(i)}`,
                description: template.description,
                eventTime: daysFromNow(i),
                format,
                address: format === "ONLINE" ? null : `${100 + i}番通り, ${pick(locations, i)}`,
                urlLink: format === "ONLINE" ? `https://tomoio.local/events/seed-${pad(i)}` : null,
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
                documentImageUrl: "/assets/images/home/hero-bg.png",
                rejectReason: status === "REJECTED" ? "身分証明書の画像が不鮮明です。もう一度アップロードしてください。" : null,
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
                reason: "不適切な表現が含まれている、またはスパム行為の可能性があります。",
                evidenceUrl: "/assets/images/home/hero-bg.png",
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
        const msg = pick(notificationMessages, i);
        rows.push({
            userId: user.id,
            type: pick(notificationTypes, i),
            message: msg,
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
        prisma.group.count({
            where: {
                OR: [
                    { name: { startsWith: "Seed Group " } },
                    { description: { in: groupTemplates.map((g) => g.description) } }
                ]
            }
        }),
        prisma.groupHobbyTag.count(),
        prisma.groupLanguageTag.count(),
        prisma.groupMember.count(),
        prisma.post.count(),
        prisma.postLike.count(),
        prisma.comment.count(),
        prisma.matchSession.count(),
        prisma.matchParticipant.count(),
        prisma.message.count(),
        prisma.event.count({ where: { urlLink: { startsWith: "https://tomoio.local/events/" } } }),
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
