import source from "@/books.enriched.json";

type SourceBook = (typeof source.books)[number];

export type Book = SourceBook & {
  year: string;
};

export type YearBookList = {
  year: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroLead: string[];
  introParagraphs: string[];
  libraryNote: string;
  selectionHint: string;
  books: Book[];
};
export type QuoteItem = {
  id: string;
  type: "quote";
  quote: string;
  title: string;
  recommender: string;
};
export type BookItem = {
  id: string;
  type: "book";
  book: Book;
};
export type ShowcaseItem = BookItem | QuoteItem;

const fallbackCovers = source.books.map((item) => item.cover_url);
const fallbackThumbCovers = source.books.map((item) => item.cover_thumbnail_url);
const fallbackBook = source.books[0];

function getFallbackCover(index: number) {
  return fallbackCovers[index % fallbackCovers.length] ?? fallbackBook.cover_url;
}

function getFallbackThumb(index: number) {
  return (
    fallbackThumbCovers[index % fallbackThumbCovers.length] ??
    fallbackBook.cover_thumbnail_url ??
    fallbackBook.cover_url
  );
}

function normalizeQuoteText(text: string) {
  return text.replace(/[“”"]/g, "").trim();
}

function createManualBook(input: {
  id: string;
  title: string;
  recommender: string;
  author: string;
  recommendation: string;
  quote: string;
  year: string;
  coverUrl?: string;
  coverThumbUrl?: string;
  fallbackIndex: number;
}): Book {
  return {
    id: input.id,
    title: input.title,
    recommender: input.recommender,
    author: input.author,
    recommendation: input.recommendation,
    quote: normalizeQuoteText(input.quote),
    isbn: null,
    isbn10: null,
    isbn13: null,
    cover_url: input.coverUrl ?? getFallbackCover(input.fallbackIndex),
    cover_thumbnail_url: input.coverThumbUrl ?? input.coverUrl ?? getFallbackThumb(input.fallbackIndex),
    enrichment: { source: "manual", matched_title: input.title, confidence: 1 },
    year: input.year,
  };
}

const books2026: Book[] = [
  ...source.books.map((book) => ({
    ...book,
    quote: normalizeQuoteText(book.quote),
    year: "2026",
  })),
  createManualBook({
    id: "2026-book-011",
    title: "跨越鸿沟",
    recommender: "忱芯科技（上海）有限公司创始人 毛赛君",
    author: "杰弗里·摩尔（Geoffrey A. Moore）",
    recommendation:
      "这本书围绕“技术采用生命周期”模型，详细分析了从创新者、早期采用者到早期大众、后期大众等不同客户群体的特征及需求差异，重点阐述了如何跨越早期市场与主流市场之间的“鸿沟”，成功吸引早期大众客户。这本书指出高科技产品在市场营销过程中遭遇的最大障碍：在由创新者和早期采用者构成的早期市场，与由早期大众和后期大众构成的主流市场之间，存在一条巨大的“鸿沟”。能否顺利跨越这条鸿沟，成功赢得主流市场中实用主义者的支持，决定了一项高科技产品的成败。",
    quote:
      "能否顺利跨越这条鸿沟，成功赢得主流市场中实用主义者的支持，决定了一项高科技产品的成败。",
    year: "2026",
    coverUrl: "/covers/2026-book-011.jpg",
    fallbackIndex: 0,
  }),
  createManualBook({
    id: "2026-book-012",
    title: "旷野人生",
    recommender: "火山石投资 叶舟波",
    author: "杰姆·罗杰斯",
    recommendation:
      "罗杰斯通过环球旅行发现：“理解世界最好的方式是走出去，在真实的土地上看见它”。这是AI无法替代的人类能力。在AI时代，相较于关注技术参数，更要考察团队、应用场景和商业闭环；在AI替代焦虑中，找到自己“被低估的价值点”并深耕。",
    quote: "",
    year: "2026",
    coverUrl: "/covers/2026-book-012.jpg",
    fallbackIndex: 1,
  }),
];

const books2025: Book[] = [
  {
    id: "2025-book-001",
    title: "禅与摩托车维修艺术",
    recommender: "光脉医疗 马鑫",
    author: "罗伯特·M. 波西格",
    recommendation:
      "探讨了理性与感性的融合，提出“良质”（Quality）作为超越二元对立的生命智慧，倡导在技术实践中寻求心灵平静与自我完整。",
    quote: "",
    isbn: null,
    isbn10: null,
    isbn13: null,
    cover_url: "/covers/2025-book-001.jpg",
    cover_thumbnail_url: "/covers/2025-book-001.jpg",
    enrichment: { source: "manual", matched_title: "禅与摩托车维修艺术", confidence: 1 },
    year: "2025",
    coverUrl: "/covers/2025-book-001.jpg",
  },
  {
    id: "2025-book-002",
    title: "象与骑象人",
    recommender: "宸安生物 王宇翀",
    author: "乔纳森·海特（Jonathan Haidt）",
    recommendation: "nature & nurture，时而合作时而对立，重要的是辨明来源，二者协力。",
    quote: "nature & nurture，时而合作时而对立，重要的是辨明来源，二者协力。",
    isbn: null,
    isbn10: null,
    isbn13: null,
    cover_url: "/covers/2025-book-002.jpg",
    cover_thumbnail_url: "/covers/2025-book-002.jpg",
    enrichment: { source: "manual", matched_title: "象与骑象人", confidence: 1 },
    year: "2025",
    coverUrl: "/covers/2025-book-002.jpg",
  },
  {
    id: "2025-book-003",
    title: "素食者",
    recommender: "三迭纪 成森平",
    author: "韩江",
    recommendation:
      "“世上所有的树都跟手足一样”，一本切入口清奇、阅读感压抑，但引发了对家庭、性别、人类、文明、艺术和自然一系列思考的书。",
    quote: "",
    isbn: null,
    isbn10: null,
    isbn13: null,
    cover_url: "/covers/2025-book-003.jpg",
    cover_thumbnail_url: "/covers/2025-book-003.jpg",
    enrichment: { source: "manual", matched_title: "素食者", confidence: 1 },
    year: "2025",
    coverUrl: "/covers/2025-book-003.jpg",
  },
  {
    id: "2025-book-004",
    title: "中华帝国的衰落",
    recommender: "烽台科技 魏钦志",
    author: "魏斐德",
    recommendation:
      "中国社会作为世界东方特殊的经济体，如何因地制宜的做出决策是每个创业者的持续思考。本书通过西方思想的视角解读中国近代历史，分析了君主、农民、士绅、商人等群体的思维逻辑，从而帮助我换个角度看现实环境。文字内容简洁清晰，观点独树一帜，可推荐！",
    quote: "",
    isbn: null,
    isbn10: null,
    isbn13: null,
    cover_url: "/covers/2025-book-004.jpg",
    cover_thumbnail_url: "/covers/2025-book-004.jpg",
    enrichment: { source: "manual", matched_title: "中华帝国的衰落", confidence: 1 },
    year: "2025",
    coverUrl: "/covers/2025-book-004.jpg",
  },
  {
    id: "2025-book-005",
    title: "南北归一",
    recommender: "旷通科技 严慧江",
    author: "渤海小吏",
    recommendation:
      "南北朝是一个充满激情创业的时代，其中有趁势而起谋定后动的一战定国；有历尽艰辛百战立业；有几十年稳步推进并泽被后世的改革；也有胸怀天下、满腔热忱但仓促上马的大变革，然终致国乱分崩；而更多的是一时成功后的心魔涌动，让人掩卷唏嘘。创业亦如是，正如作者所说：历史从未走远，因为人性进化缓慢。",
    quote: "历史从未走远，因为人性进化缓慢。",
    isbn: null,
    isbn10: null,
    isbn13: null,
    cover_url: "/covers/2025-book-005.jpg",
    cover_thumbnail_url: "/covers/2025-book-005.jpg",
    enrichment: { source: "manual", matched_title: "南北归一", confidence: 1 },
    year: "2025",
    coverUrl: "/covers/2025-book-005.jpg",
  },
  {
    id: "2025-book-006",
    title: "长安的荔枝",
    recommender: "海微科技 李林峰",
    author: "马伯庸",
    recommendation:
      "借古喻今，繁华之下的迷幻操作应当被看见、被调整、被改变。长治久安与可持续是管理者们理应追求的目标。",
    quote: "借古喻今，繁华之下的迷幻操作应当被看见、被调整、被改变。",
    isbn: null,
    isbn10: null,
    isbn13: null,
    cover_url: "/covers/2025-book-006.jpg",
    cover_thumbnail_url: "/covers/2025-book-006.jpg",
    enrichment: { source: "manual", matched_title: "长安的荔枝", confidence: 1 },
    year: "2025",
    coverUrl: "/covers/2025-book-006.jpg",
  },
  {
    id: "2025-book-007",
    title: "电影，我略知一二",
    recommender: "日食记 姜老刀",
    author: "贾樟柯",
    recommendation:
      "电影，书籍，以及任何一切文化艺术，才是带领我们认识世界和自我的方式。而不是AI。",
    quote: "电影，书籍，以及任何一切文化艺术，才是带领我们认识世界和自我的方式。而不是AI。",
    isbn: null,
    isbn10: null,
    isbn13: null,
    cover_url: "/covers/2025-book-007.jpg",
    cover_thumbnail_url: "/covers/2025-book-007.jpg",
    enrichment: { source: "manual", matched_title: "电影，我略知一二", confidence: 1 },
    year: "2025",
    coverUrl: "/covers/2025-book-007.jpg",
  },
  {
    id: "2025-book-008",
    title: "南极探险记",
    recommender: "未来视界 罗通",
    author: "罗阿尔·阿蒙森",
    recommendation: "阿蒙森是所有创业者的榜样，值得我们一直学习。",
    quote: "阿蒙森是所有创业者的榜样，值得我们一直学习。",
    isbn: null,
    isbn10: null,
    isbn13: null,
    cover_url: "/covers/2025-book-008.jpg",
    cover_thumbnail_url: "/covers/2025-book-008.jpg",
    enrichment: { source: "manual", matched_title: "南极探险记", confidence: 1 },
    year: "2025",
    coverUrl: "/covers/2025-book-008.jpg",
  },
  {
    id: "2025-book-009",
    title: "战略决定一切",
    recommender: "百葵锐 章大卫",
    author: "陈东升",
    recommendation: "做正确的事，时间就是答案。",
    quote: "做正确的事，时间就是答案。",
    isbn: null,
    isbn10: null,
    isbn13: null,
    cover_url: "/covers/2025-book-009.jpg",
    cover_thumbnail_url: "/covers/2025-book-009.jpg",
    enrichment: { source: "manual", matched_title: "战略决定一切", confidence: 1 },
    year: "2025",
    coverUrl: "/covers/2025-book-009.jpg",
  },
  {
    id: "2025-book-010",
    title: "脑机接口，从科幻到现实",
    recommender: "佳量医疗 曹鹏",
    author: "郭亮",
    recommendation: "一部兼具深度与可读性的著作，揭开脑机接口从实验室走向现实的核心逻辑。",
    quote: "一部兼具深度与可读性的著作，揭开脑机接口从实验室走向现实的核心逻辑。",
    isbn: null,
    isbn10: null,
    isbn13: null,
    cover_url: "/covers/2025-book-010.jpg",
    cover_thumbnail_url: "/covers/2025-book-010.jpg",
    enrichment: { source: "manual", matched_title: "脑机接口，从科幻到现实", confidence: 1 },
    year: "2025",
    coverUrl: "/covers/2025-book-010.jpg",
  },
  {
    id: "2025-book-011",
    title: "无限的游戏",
    recommender: "傅利叶 顾捷",
    author: "西蒙·斯涅克",
    recommendation:
      "商业的本质，其实是一场无限的游戏。但大多数的公司，都在用参与有限游戏的方式来经营。我们应该切换模型，用参与无限游戏的方式，来参与商业。",
    quote: "商业的本质，其实是一场无限的游戏。",
    isbn: null,
    isbn10: null,
    isbn13: null,
    cover_url: "/covers/2025-book-011.jpg",
    cover_thumbnail_url: "/covers/2025-book-011.jpg",
    enrichment: { source: "manual", matched_title: "无限的游戏", confidence: 1 },
    year: "2025",
    coverUrl: "/covers/2025-book-011.jpg",
  },
];

const books2023: Book[] = [
  createManualBook({
    id: "2023-book-001",
    title: "清醒思考的艺术",
    recommender: "极智嘉 李洪波",
    author: "罗尔夫·多贝里",
    recommendation:
      "《清醒思考的艺术》是由德国作家兼企业家罗尔夫·多贝利写的一本畅销书，旨在帮助人们识别和避免常见的逻辑谬误和认知偏差，以更加清晰地思考问题。书中涵盖了52种不同的思考错误和陷阱，包括选择性感知、后认识偏差、群体效应、故事效应等等。每个错误都简短地解释了其背后的原理和实际应用，通俗易懂。让思考更深入，让思考更艺术。",
    quote: "",
    year: "2023",
    fallbackIndex: 0,
    coverUrl: "/covers/2023-book-001.jpg",
  }),
  createManualBook({
    id: "2023-book-002",
    title: "创造：用非传统方式做有价值的事",
    recommender: "AlphaCen 王璐",
    author: "托尼·法德尔",
    recommendation: "非常诚恳且风趣的沟通，很好读，我拿起来了就没放下，一口气读完了。内容大家自己看吧。",
    quote: "",
    year: "2023",
    fallbackIndex: 1,
    coverUrl: "/covers/2023-book-002.jpg",
  }),
  createManualBook({
    id: "2023-book-003",
    title: "LiftOff: Elon Musk and the Desperate Early Days that Launched SpaceX",
    recommender: "AlphaCen 王璐",
    author: "Eric Berger",
    recommendation: "如题“升空：伊隆·马斯克和SpaceX的早期创业困局”，本书主要讲了SpaceX前几次发射失败的故事，对创业者很有启发。",
    quote: "",
    year: "2023",
    fallbackIndex: 2,
    coverUrl: "/covers/2023-book-003.jpg",
  }),
  createManualBook({
    id: "2023-book-004",
    title: "消失的地平线",
    recommender: "三迭纪 成森平博士",
    author: "詹姆斯·希尔顿",
    recommendation:
      "“那些勇于冒险的人们，能穿过世界的泥泞，找到净土。”香格里拉，曾是地图上找不到的地方，人类文明的净土。我相信，“香格里拉”存在于每一个创业者的梦境中，亦是创业旅程的终点，和创业精神的归宿。",
    quote: "",
    year: "2023",
    fallbackIndex: 3,
    coverUrl: "/covers/2023-book-004.jpg",
  }),
  createManualBook({
    id: "2023-book-005",
    title: "绝对自控",
    recommender: "旷通科技 严慧江",
    author: "瑞安·霍利迪",
    recommendation:
      "中文书名看起来战斗力十足，但其英文名“Ego is the enemy”更能说明作者本意。人的一生是不断刷新自我认知的过程，创业者尤需直面。创业是人生探索的一个部分，其中需要不断面对失败、面对成功，而背后真正需要面对的其实是“自我”，人生亦如是。期望能做到如作者所说：求索时不急不躁，成功时保持谦虚，失败时得以复原。",
    quote: "",
    year: "2023",
    fallbackIndex: 4,
    coverUrl: "/covers/2023-book-005.jpg",
  }),
  createManualBook({
    id: "2023-book-006",
    title: "鞋狗",
    recommender: "Fabrie 陈达博",
    author: "菲尔·奈特",
    recommendation:
      "《鞋狗》讲述了Nike创始人菲尔·奈特的奋斗历程。书中不仅揭示了伟大企业背后的心酸历程，还向我们展示了创业者在面对挫折时如何保持乐观、积极应对。奈特用他的故事告诉我们，即使身处艰难困苦，也可以用幽默和轻松的心态去看待问题，从而更好地解决它们。",
    quote: "",
    year: "2023",
    fallbackIndex: 5,
    coverUrl: "/covers/2023-book-006.jpg",
  }),
  createManualBook({
    id: "2023-book-007",
    title: "心流",
    recommender: "思为科技 彭双全",
    author: "米哈里·契克森米哈赖",
    recommendation:
      "幸福是什么？幸福是你全身心投入一桩事情，达到忘我的程度，并由此获得内心秩序和安宁的状态。这种状态就叫做“心流”。它的特征是你做这件事的时候会忘记自己，忘记时间的流逝，你能体察到所有相关的信息，不管工作多复杂你都毫不费力，而且有强烈的愉悦感。心流是一种生活方式，而且是最高级别的生活方式。人生最大的幸运，就是在有意义、有挑战的工作中，整合复杂的人生，找到最大心流。过程即奖赏，成功是副产品。",
    quote: "",
    year: "2023",
    fallbackIndex: 6,
    coverUrl: "/covers/2023-book-007.jpg",
  }),
  createManualBook({
    id: "2023-book-008",
    title: "被讨厌的勇气",
    recommender: "奇点云 刘莹",
    author: "岸见一郎 / 古贺史健",
    recommendation: "这是一本值得每隔一段时间就拿出来看的书。人生是一场自我修炼的场，敢于面对自己，活成好自己。每一天都可以很美好。",
    quote: "",
    year: "2023",
    fallbackIndex: 7,
    coverUrl: "/covers/2023-book-008.jpg",
  }),
  createManualBook({
    id: "2023-book-009",
    title: "上帝掷骰子吗：量子物理史话",
    recommender: "云拿科技 冯杰夫",
    author: "曹天元",
    recommendation:
      "《量子力学史话》探索宇宙的终极奥义。在研究宇宙之谜的量子力学上，曾经科学家表示，只要揭开上帝粒子的神秘面纱，人类就能找到宇宙的终极奥秘。宇宙如此浩瀚，即使是承载70多亿人的地球，在宇宙中也不过如尘埃一般。上帝粒子究竟是什么，又为什么具有如此强大的威力？本书通俗易懂，非理工科背景，具有初中的基本数学知识就能理解非常深奥的宇宙和微观物理学。",
    quote: "",
    year: "2023",
    fallbackIndex: 8,
    coverUrl: "/covers/2023-book-009.jpg",
  }),
  createManualBook({
    id: "2023-book-010",
    title: "低风险创业",
    recommender: "工匠社 招俊健",
    author: "樊登",
    recommendation:
      "这两本书是创业基本逻辑，时间紧张的甚至可以直接听书。建议想创业的伙伴略读学习商业闭环设计后再聊BP，帮助会很大。",
    quote: "",
    year: "2023",
    fallbackIndex: 9,
    coverUrl: "/covers/2023-book-010.jpg",
  }),
  createManualBook({
    id: "2023-book-011",
    title: "纳瓦尔宝典",
    recommender: "工匠社 招俊健",
    author: "纳瓦尔·拉维坎特",
    recommendation:
      "这两本书是创业基本逻辑，时间紧张的甚至可以直接听书。建议想创业的伙伴略读学习商业闭环设计后再聊BP，帮助会很大。",
    quote: "",
    year: "2023",
    fallbackIndex: 0,
    coverUrl: "/covers/2023-book-011.jpg",
  }),
];

const books2022: Book[] = [
  createManualBook({
    id: "2022-book-001",
    title: "八山",
    recommender: "叶舟波",
    author: "保罗·科涅蒂",
    recommendation:
      "有些人喜欢独自在自己的山峰上攀爬，越走越高，高到别人无法企及，但是对于普通人来说达到那样的高度，感受到的可能更多的是孤独困苦。所以也可以选择把自己的时间留给自己走过的路、见过的人、看过的世界。攀爬须弥山和游历八山，哪种更值得称赞呢？书中的主人公，各自选择了自己更擅长的方式与这个世界打交道，但无论是哪种方式，最重要的是认真对待生活。",
    quote: "无论是哪种方式，最重要的是认真对待生活。",
    year: "2022",
    coverUrl: "/covers/2022-book-001.jpg",
    fallbackIndex: 0,
  }),
  createManualBook({
    id: "2022-book-002",
    title: "橘子不是唯一的水果",
    recommender: "徐楚薇",
    author: "珍妮特·温特森",
    recommendation:
      "和可爱的书名相反，这本半自传体小说有着严肃的内在，是难读的小说。拿起放下，再拿起再放下，一而再三才把它读完，波折的过程终于迎来一个句号。",
    quote: "墙是庇护，也是限制。墙的本质决定了墙终将倾颓。",
    year: "2022",
    coverUrl: "/covers/2022-book-002.jpg",
    fallbackIndex: 1,
  }),
  createManualBook({
    id: "2022-book-003",
    title: "女巫",
    recommender: "Jenny Zheng",
    author: "罗尔德·达尔",
    recommendation: "“我的宝贝，你真不在乎以后一直做老鼠吗？”“我根本不在乎。只要有人爱你，你就不会在乎你是什么，或者你是什么样子。”",
    quote: "只要有人爱你，你就不会在乎你是什么，或者你是什么样子。",
    year: "2022",
    coverUrl: "/covers/2022-book-003.jpg",
    fallbackIndex: 2,
  }),
  createManualBook({
    id: "2022-book-004",
    title: "活着",
    recommender: "李兴宇",
    author: "余华",
    recommendation:
      "速食文化的时代，有必要沉心思考我们为什么而活着。作者温情而深沉地俯瞰芸芸众生相，全文不对生活的苦难进行价值判断，描述一个人的一生。进而看到：人活着的任何深刻理由都是不存在的。因此，不为别的，就是为活着本身而活。",
    quote: "不为别的，就是为活着本身而活。",
    year: "2022",
    coverUrl: "/covers/2022-book-004.jpg",
    fallbackIndex: 3,
  }),
  createManualBook({
    id: "2022-book-005",
    title: "从你的全世界路过",
    recommender: "吴颖",
    author: "张嘉佳",
    recommendation:
      "长时间居家的特别时期，从书架上找本书，用温暖、治愈的文字安抚心灵，从你的全世界路过，随便打开一篇就可以了。",
    quote: "挑自己喜欢的，自己喜欢就好。",
    year: "2022",
    coverUrl: "/covers/2022-book-005.jpg",
    fallbackIndex: 4,
  }),
  createManualBook({
    id: "2022-book-006",
    title: "枪炮，病菌与钢铁",
    recommender: "章苏阳",
    author: "贾雷德·戴蒙德",
    recommendation: "最近的世界把这本书又重新演绎了一遍。",
    quote: "最近的世界把这本书又重新演绎了一遍。",
    year: "2022",
    coverUrl: "/covers/2022-book-006.jpg",
    fallbackIndex: 5,
  }),
  createManualBook({
    id: "2022-book-007",
    title: "奶酪与蛆虫",
    recommender: "韩茜",
    author: "卡洛·金茨堡",
    recommendation:
      "书中讲述的是一个平凡的个人，一个生活在16世纪的意大利磨坊主。他对思考的热情、探寻真理的勇气和执着精神令人感动和叹服。",
    quote: "爱你的邻舍是一条比爱上帝更大的诫命。",
    year: "2022",
    coverUrl: "/covers/2022-book-007.jpg",
    fallbackIndex: 6,
  }),
  createManualBook({
    id: "2022-book-008",
    title: "世界观：现代人必须要懂的科学哲学和科学史",
    recommender: "缪丝羽",
    author: "理查德·德威特",
    recommendation:
      "历史、哲学和科学的融合性讨论。世界观是一套观点体系，不同的观点如一块块拼图相互拼接，环环相扣。提出了一些科学哲学的基本概念，比如可证伪性、工具主义、现实主义等，作为“底层逻辑”，串联属于不同时代的世界观。",
    quote: "不同的观点如一块块拼图相互拼接，环环相扣。",
    year: "2022",
    coverUrl: "/covers/2022-book-008.jpg",
    fallbackIndex: 7,
  }),
  createManualBook({
    id: "2022-book-009",
    title: "幸福之路",
    recommender: "程子玄",
    author: "伯特兰·罗素",
    recommendation:
      "“须知参差多态，乃是幸福的本源。”罗素以通俗易懂的文字论述了自己对何为幸福、如何获取快乐的观点。幸福并非天赐，而是需要我们努力追求的。",
    quote: "须知参差多态，乃是幸福的本源。",
    year: "2022",
    coverUrl: "/covers/2022-book-009.jpg",
    fallbackIndex: 8,
  }),
  createManualBook({
    id: "2022-book-010",
    title: "把自己作为方法",
    recommender: "罗小我",
    author: "项飙",
    recommendation:
      "通过一系列对话和访谈，这本书能提供一个审视自己、关注自身的思考方法。把自己作为方法，自己所有的感受都是具象的，再通过这些感受去推导和探索这个社会与世界，才不会在这个多变的洪流中丢失自己。",
    quote: "把自己作为方法，才能不在洪流中丢失自己。",
    year: "2022",
    coverUrl: "/covers/2022-book-010.jpg",
    fallbackIndex: 9,
  }),
  createManualBook({
    id: "2022-book-011",
    title: "异见时刻",
    recommender: "贺嘉颖",
    author: "伊琳·卡蒙",
    recommendation:
      "本书是美国最高法院第二位女性大法官金斯伯格的传记，记载了她推动更加公正平等社会的实践，也呈现了她在漫长人生中的挣扎、疑虑和挫败。",
    quote: "这个人曾努力治愈社会伤口，并让世界变得更美好一点。",
    year: "2022",
    coverUrl: "/covers/2022-book-011.jpg",
    fallbackIndex: 0,
  }),
  createManualBook({
    id: "2022-book-012",
    title: "我们在这里：一位父亲的地球生活笔记",
    recommender: "焦梓",
    author: "奥利弗·杰夫斯",
    recommendation:
      "这本书通过生动治愈的插画，用浅显易懂的方式让孩子们更好地了解地球，启示大家珍爱保护地球。更重要的是，当你懂得了如何去尊重、宽容、和自然和平共处的时候，你会获得最宝贵的感悟：在这个地球上，我们永远不孤单。",
    quote: "在这个地球上，我们永远不孤单。",
    year: "2022",
    coverUrl: "/covers/2022-book-012.jpg",
    fallbackIndex: 1,
  }),
  createManualBook({
    id: "2022-book-013",
    title: "父与子",
    recommender: "邓筠",
    author: "埃·奥·卜劳恩",
    recommendation: "充满了生活的智慧与幽默，还有一份从容和豁达。",
    quote: "充满了生活的智慧与幽默。",
    year: "2022",
    coverUrl: "/covers/2022-book-013.jpg",
    fallbackIndex: 2,
  }),
  createManualBook({
    id: "2022-book-014",
    title: "动物大数据",
    recommender: "董叶顺",
    author: "史蒂夫·詹金斯",
    recommendation:
      "与我大外孙一起看这本书，挺有意思。启发自己在于，这本书包含大量可视化数据图，是一本严谨简洁的科学书。做投资，要对数据敏感、求真，并用数据说话、结果导向。",
    quote: "做投资，要对数据敏感、求真，并用数据说话、结果导向。",
    year: "2022",
    coverUrl: "/covers/2022-book-014.jpg",
    fallbackIndex: 3,
  }),
];

export const yearlyBookLists: Record<string, YearBookList> = {
  "2026": {
    year: "2026",
    heroTitleLine1: "2026世界读书日",
    heroTitleLine2: "火山石的AI时代书单",
    heroLead: [
      "在今天，AI几乎已经成为所有人都绕不开的话题。",
      "它是技术趋势，是产业变量，也是创业者正在创造的新项目、投资人正在判断的新投资标的，同时，它也正在重塑我们所熟知的一切。",
    ],
    introParagraphs: [
      "所以在2026年世界读书日，火山石想做一份AI时代书单：邀请火山石的投资人和创业者分享一本帮助他们更好理解AI时代的书。",
      "不只是技术层面的理解，更多是针对在现在这个不断变化的时代中，我们如何更好理解当下的处境，并做出更独立的判断。",
    ],
    libraryNote: "我把它们整理成一间小型的年度阅览室。你可以从封面进入，也可以从一句金句回头，重新找到那本书。",
    selectionHint: "点击任意一本书，查看推荐理由、推荐人和完整信息。",
    books: books2026,
  },
  "2023": {
    year: "2023",
    heroTitleLine1: "创业者给创业者推荐的11本书",
    heroTitleLine2: "创业者给创业者的书单",
    heroLead: [
      "火山石邀请投资成员企业的创始人们推荐一本在创业旅途中给其启发、激励或建议的书籍。",
      "希望让更多创业者从彼此的阅读体验中获得灵感，并借此创建更强大的创业者社区。",
    ],
    introParagraphs: [
      "今年的世界读书日，书单聚焦创业旅程中的真实问题：如何更清晰思考、如何面对失败、如何在不确定中保持长期主义。",
      "从认知偏差、商业实战到心理韧性，这份书单不是标准答案，而是创业者与创业者之间的经验交换。",
    ],
    libraryNote: "这份清单保留了原文中的推荐语与配图，按创始人的阅读语境重新整理。",
    selectionHint: "点击任意一本书，查看推荐理由、推荐人与完整信息。",
    books: books2023,
  },
  "2022": {
    year: "2022",
    heroTitleLine1: "火山石书单｜世界读书日",
    heroTitleLine2: "在不确定中，仍然阅读",
    heroLead: [
      "在这个2022年的春天，无论是远方还是身旁，都充满着冲突与不确定性。",
      "火山石的小伙伴们在居家隔离期间共创了一份书单，希望通过阅读带来心灵慰藉和精神力量。",
    ],
    introParagraphs: [
      "1940年的荷兰屋图书馆照片提醒我们：即便在最极端最痛苦的时刻，人类对知识和精神的渴望仍在。",
      "书单按文学、历史、哲学、社会与儿童五类整理，愿阅读在特殊时期带来更稳定的内心秩序。",
    ],
    libraryNote: "这是一份在隔离时期共创的阅读清单，关注的是在不确定中如何保持清醒、善意与行动力。",
    selectionHint: "点击任意一本书，查看推荐理由、推荐人与完整信息。",
    books: books2022,
  },
  "2025": {
    year: "2025",
    heroTitleLine1: "为什么我们还要读书？",
    heroTitleLine2: "——当AI回答不了所有问题的时候",
    heroLead: [
      "在这个AI几乎能解答一切的时代，我们仍然相信，有些问题只有书籍能回答。",
      "我们邀请了一群创业者，分享那本真正改变他们看待世界方式的书——不是为了获取知识，而是为了理解世界。",
    ],
    introParagraphs: [
      "知识告诉我们“是什么”，而书籍帮助我们看见“为什么”。",
      "尤其在创业与投资的世界，判断力往往决定成败。而真正深刻的判断，并不只来自数据和模型，更来自我们的世界观、思维方式与价值判断。正因如此，这份书单中的书，很多并不是传授知识的“工具书”，而是那些让我们重新理解人性、市场和社会变迁的作品。希望它们也能为你打开一个不一样的入口。",
    ],
    libraryNote: "这一年的书单来自创业一线的真实体感。每一本都不是标准答案，而是一个重新理解现实的入口。",
    selectionHint: "点击任意一本书，查看推荐理由、推荐人和完整信息。",
    books: books2025,
  },
};

export const availableYears = Object.keys(yearlyBookLists).sort((a, b) => Number(b) - Number(a));
export const books = yearlyBookLists["2026"].books;

export function getBooksByYear(year: string) {
  return yearlyBookLists[year]?.books ?? [];
}

export function getAllBooks() {
  return availableYears.flatMap((year) => getBooksByYear(year));
}

export function getBookById(id: string) {
  return getAllBooks().find((item) => item.id === id) ?? null;
}

const spans = [
  "md:col-span-2 md:row-span-2",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-2",
  "md:col-span-2 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-2",
  "md:col-span-2 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-1 md:row-span-1",
  "md:col-span-2 md:row-span-2"
] as const;

export function getBookSpan(index: number) {
  return spans[index % spans.length];
}

export function buildShowcaseItems(items: Book[]): ShowcaseItem[] {
  const showcase: ShowcaseItem[] = [];

  items.forEach((book, index) => {
    showcase.push({
      id: book.id,
      type: "book",
      book,
    });

    if (index > 0 && (index + 1) % 3 === 0 && index !== items.length - 1) {
      showcase.push({
        id: `${book.id}-quote`,
        type: "quote",
        quote: book.quote,
        title: book.title,
        recommender: book.recommender,
      });
    }
  });

  return showcase;
}
