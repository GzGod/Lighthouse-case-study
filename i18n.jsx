/* i18n dictionary + context */
const LANG_KEY = "lighthouse-lang";

const DICT = {
  zh: {
    "brand.cn": "灯塔",
    "brand.en": "LIGHTHOUSE",
    "brand.tagline": "灯塔是 Web3 注意力市场。无论你想推项目、推个人 IP、支持喜欢的 KOL，还是让某个话题被更多人讨论，我们把流量需求变成可报价、可执行、可复盘的协作。",
    "nav.about": "注意力玩法",
    "nav.kpi": "价格基准",
    "nav.winners": "玩法案例",
    "nav.ip": "个人 IP",
    "nav.stars": "代表样本",
    "nav.matrix": "流量矩阵",
    "nav.cta": "发布需求",
    "nav.cta_btn": "查看合作方式 →",
    "nav.app_btn": "前往灯塔 →",
    "nav.lang": "EN",

    "hero.kicker_tl": "CASE STUDY · VOL. 01 / 2026",
    "hero.stats_tl": "{baselineCount} 个基准项目 · {baselineTweets} 条推文 · Q4·25 — Q2·26",
    "hero.kicker_tr": "面向 · 项目方 / 创作者 / 社区 / KOL 支持者",
    "hero.by_tr": "编制 · 灯塔实验室",
    "hero.eyebrow": "灯塔 · Web3 注意力市场",
    "hero.h1_a": "想让 Web3 市场",
    "hero.h1_b": "看见项目、人和话题，",
    "hero.h1_c": "都来灯塔。",
    "hero.sub": ["基于 ", "{baselineCount} 个基准项目", "、", "{baselineTweets} 条推文", "、", "超 {totalImpLabel} 次曝光", "的真实记录，灯塔把项目宣发、KOL 助推、个人 IP 增长、议题讨论和声量对冲组织成一套可报价、可执行、可复盘的注意力协作。"],
    "hero.stat1.k": "已结算预算池",
    "hero.stat1.u": "USDC · 全部链上结算",
    "hero.stat2.k": "可对照曝光",
    "hero.stat2.u": "{baselineCount} 个基准项目 · {baselineTweets} 条推文",
    "hero.stat3.k": "峰值互动率",
    "hero.stat3.u": "由 {peakErWho} 创造 · 行业均值 ≈ 0.4%",
    "hero.cta1": "查看流量样本 ↓",
    "hero.cta2": "聊聊你的流量需求",
    "hero.foot": "{baselineCount} 个基准样本 · {baselineTweets} 条推文 · 投流曝光 · 支持喜欢的 KOL · 声量对冲",
    "hero.scroll": "SCROLL · 01/07",

    "about.kicker": "§ 02 · 灯塔可以处理哪些注意力需求",
    "about.h2_a": "投流、助推、讨论、支持，",
    "about.h2_b": "都可以被组织成一次可复盘的注意力协作",
    "about.h2_c": "。",
    "about.p": "很多 Web3 流量需求并不只属于项目方：有人想让项目被看见，有人想推一个个人 IP，有人想支持喜欢的 KOL，也有人需要在复杂舆论场里做声量占位和议题纠偏。灯塔把需求、预算、KOL、内容节奏和复盘数据放到同一张桌上，让注意力不再只是临时找人发帖，而是一次可以管理的交易与协作。",
    "about.cap1.t": "投流曝光",
    "about.cap1.en": "PAID REACH",
    "about.cap1.d": "围绕赛道、受众和预算区间匹配合适 KOL，把一次曝光需求拆成能执行、能追踪、能复盘的传播组合。",
    "about.cap2.t": "KOL 助推",
    "about.cap2.en": "KOL BOOST",
    "about.cap2.d": "想把某个观点、活动、资产或内容推到更多人面前，可以用历史表现筛选 KOL，让火力更集中。",
    "about.cap3.t": "议题讨论",
    "about.cap3.en": "MARKET CONVERSATION",
    "about.cap3.d": "当你想让市场开始讨论某个方向，或需要对冲竞品声量压力，灯塔会帮你组织更安全的舆论场占位和声量纠偏。",
    "about.cap4.t": "创作者支持",
    "about.cap4.en": "CREATOR SUPPORT",
    "about.cap4.d": "如果你喜欢某个 KOL、分析师或社区主理人，也可以通过灯塔给 TA 一次可见的助推，让支持变成真实曝光。",
    "about.f1": "◇ 可调用 KOL / 创作者池 2,400+",
    "about.f2": "◇ 服务项目/个人需求 40+（取样 {totalCount} · 基准 {baselineCount}）",
    "about.f3": "◇ 项目宣发 · 个人 IP · 议题讨论 · USDC 结算",

    "kpi.kicker": "§ 03 · 注意力交易要看的价格基准",
    "kpi.h2_a": "这些数字的价值，",
    "kpi.h2_b": "在于让流量玩法有报价和参照。",
    "kpi.p": "以下 6 个 KPI 来自 {baselineCount} 个基准项目的完整投放记录，保留真实波动，不做样本美化。它们让投流曝光、KOL 助推、议题讨论和个人 IP 增长都有一套可以先对照的价格与效果参考。",
    "kpi.k1": "总预算", "kpi.k1u": "USDC", "kpi.k1n": "{baselineCount} 个基准样本共同形成的注意力预算参考",
    "kpi.k2": "总曝光", "kpi.k2u": "IMPRESSIONS", "kpi.k2n": "{baselineTweets} 条推文沉淀出的真实流量交付体量",
    "kpi.k3": "总互动", "kpi.k3u": "ENGAGEMENTS", "kpi.k3n": "帮助判断内容、话题和受众是否真正接上",
    "kpi.k4": "加权均价 CPM", "kpi.k4u": "USDC", "kpi.k4n": "给投流、助推和议题测试一个常用报价锚点",
    "kpi.k5": "最低 CPM", "kpi.k5u": "USDC", "kpi.k5n": "{lowestCpmWho} 跑出的高效曝光样本",
    "kpi.k6": "峰值互动率", "kpi.k6u": "ENGAGEMENT RATE", "kpi.k6n": "{peakErWho} 把讨论深度拉到行业均值上方",
    "kpi.sub1.k": "副指标 · 最低 CPE", "kpi.sub1.u": "USDC / 互动", "kpi.sub1.who": "{lowestCpeWho} 把互动成本压到很低的区间",
    "kpi.sub2.k": "副指标 · 最大单场曝光", "kpi.sub2.u": "IMPRESSIONS", "kpi.sub2.who": "{maxImpWho} 证明中高预算也能跑出声量规模",

    "win.kicker": "§ 04 · 需求不同，玩法也不同",
    "win.h2_a": "同样买注意力，",
    "win.h2_b": "你关心的结果可以完全不同。",
    "win.p": "有的人先要曝光，有的人要讨论度，有的人要给创作者一次可见助推，也有人需要在舆论场里做声量占位。灯塔把这些目标拆开看，帮助需求方在执行前先把判断标准讲清楚，后面的报价、投放和复盘都会轻很多。",
    "win.top3": "TOP 3",
    "win.budget": "预算", "win.imp_u": "曝光",
    "win.takeaway": "关键判断",
    "win.bench": "基准末位",
    "win.d1.label": "最低 CPM", "win.d1.en": "CHEAPEST ATTENTION", "win.d1.lead": "预算先盯曝光效率时，这类组合更容易打穿。",
    "win.d1.take": "中心化交易所叙事配合头部华语 KOL，让 HashKey Exchange 把 CPM 跑到 19.06。这个结果给后续同类曝光需求提供了很强的预算参照。",
    "win.d2.label": "最高互动率", "win.d2.en": "DEEPEST CONVERSATION", "win.d2.lead": "当目标转向讨论深度，内容结构和受众匹配会更重要。",
    "win.d2.take": "AI Agent 和 Meme 相关话题更容易激发参与，灯塔在这个维度上的 Top3 都跑到了 1% 以上，说明好的议题设计可以把流量变成讨论。",
    "win.d3.label": "最优 CPE", "win.d3.en": "BEST VALUE PER ENGAGEMENT", "win.d3.lead": "需求方开始盯互动成本时，玩法也要跟着切换。",
    "win.d3.take": "Portals 把单次互动成本压到 2.81 USDC，说明小中预算项目只要目标和人群对得够准，效率空间依然很大。",

    "div1.kicker": "INTERLUDE · 编辑部札记",
    "div1.q": "投放不该停留在经验和运气层面。它更接近一份财报：每一个数字都要有来源、有基准、有可验证路径。",
    "div1.sub": "灯塔 · 编辑原则 · 2026",
    "div2.kicker": "",
    "div2.q": "",
    "div2.sub": "",

    "stars.kicker": "§ 05 · 注意力样本",
    "ip.kicker": "§ 01 · 个人 IP 案例",
    "ip.back": "← 返回主案例页",
    "ip.h2_a": "用灯塔，",
    "ip.h2_b": "把人也推成 IP。",
    "ip.p": "不只是项目方。创作者、分析师、Founder、社区主理人都可以用灯塔把一次观点、一次引用池或一次内容协作做成可见增长。下面是一个真实案例——以及后续会持续补充的更多故事。",

    "astra.badge": "灯塔推文引用池 · 2026.04",
    "astra.h2_a": "500 USDC，",
    "astra.h2_b": "换来孙哥的一次引用。",
    "astra.lede": "@0xAstraSpark 在灯塔开了一个 500 USDC 的个人引用池，卖点是 TRON 生态观察。结果不仅上了 XHunt 华语区热榜 TOP 1，还拿到了 Justin Sun 本人的关注 + 引用转发。",
    "astra.name": "Astra",
    "astra.handle": "@0xAstraSpark",
    "astra.avatar": "assets/ip/astra-avatar.jpg",

    "astra.bio": "04 年连续创业者，澳国立大学在读。建立了 GitHub 最大的区块链开源基建之一，Top 1 加密收款方案，获上万独立站采用并认可，累计处理数亿真实流水。🏗️ 正在打造 @GMWalletApp。",

    "astra.stat.budget": "投放预算",
    "astra.stat.budget.v": "500",
    "astra.stat.budget.u": "USDC",
    "astra.stat.campaign": "Campaign 形式",
    "astra.stat.campaign.v": "个人引用池",
    "astra.stat.roi": "游移价值",
    "astra.stat.roi.v": "∞",
    "astra.stat.roi.u": "远超 500U",

    "astra.story.kicker": "故事线",
    "astra.story.h": "小预算也能打出大圈层。",
    "astra.story.p1": "Astra 是一个 TRON 生态观察者和个人 IP。他把 500 USDC 投到灯塔，开了一个个人推文引用池——比项目方通用的 KOL 投放更轻，但聚焦更精。",
    "astra.story.p2": "水到渠成——一篇《为啥转账都在 TRON 链上跑？》的长文，用却调不调的方式推了 TRON 的统治力和落地思维。推文登上 XHunt 实时热榜华语区 4h TOP 1，分数 93。",
    "astra.story.p3a": "真正的转折在 8 小时后。",
    "astra.story.p3b": "Justin Sun 本人关注了这个账号，并用引用转发的方式，给这篇推文配了一句「波场+B.ai 区块链人工智能双轮驱动将更加强大！」。这句引用把一篇普通长文推到了 10 万浏览、 280 赞、244 评论、77 转发。",

    "astra.takeaway.k": "TAKEAWAY",
    "astra.takeaway.v": "灯塔也能帮助个人 IP 用很低预算打进行业内更高质量的讨论圈层。",

    "astra.b1.title": "XHunt 华语区 4h 热榜 TOP 1",
    "astra.b1.note": "Astra 以 93 分占据华语区推文榜首位，压过 CryptoD、Crypto_EZ 等大 V。",
    "astra.b1.badge": "内容出圈",
    "astra.b1.img": "assets/ip/astra-xhunt.jpg",
    "astra.b1.highlight": "0",

    "astra.b2.title": "Justin Sun 亲自关注",
    "astra.b2.note": "在跟水的 8 小时后，H.E. Justin Sun 出现在 「近期被关注」列表。Forbes 徽章 · 黄 V · 孙哥本人。",
    "astra.b2.badge": "链主关注",
    "astra.b2.img": "assets/ip/astra-justin-follow.png",
    "astra.b2.highlight": "1",

    "astra.b3.title": "Justin Sun 引用转发 + 打结语",
    "astra.b3.note": "孙哥配文「波场+B.ai 区块链人工智能双轮驱动将更加强大！」并引用转发 Astra 的推文，直接把流量推上新的量级。",
    "astra.b3.badge": "引用转发",
    "astra.b3.img": "assets/ip/astra-justin-quote.png",
    "astra.b3.highlight": "1",

    "astra.b4.title": "原推文最终数据 · 10 万浏览",
    "astra.b4.note": "引用转发后，Astra 的原推文最终跑出 10 万浏览、280 赞、244 评论、77 转发，账号徽章累计 49,040。",
    "astra.b4.badge": "终局数据",
    "astra.b4.img": "assets/ip/astra-final-tweet.png",
    "astra.b4.highlight": "1",

    "astra.math.kicker": "投产比·算一算这 500U 换了什么",
    "astra.math.k1": "投入预算",
    "astra.math.k1.v": "500",
    "astra.math.k1.u": "USDC",
    "astra.math.k2": "最终推文浏览",
    "astra.math.k2.v": "100,000+",
    "astra.math.k2.u": "次 · Astra 原推文",
    "astra.math.k3": "赞 · 评 · 转",
    "astra.math.k3.v": "280 · 244 · 77",
    "astra.math.k3.u": "徽章累计 · 49,040",
    "astra.math.k4": "IP 突破",
    "astra.math.k4.v": "行业顶圈层",
    "astra.math.note": "这次结果来自内容质量、渠道选择和发布时间共同叠加的自然放大。500 USDC 带来的，不只是流量本身，还包括 Justin Sun 的主动关注、引用推文以及随之而来的行业注意力，在任何市场定价模型下都远高于 500U。",

    "stars.h2_a": "四个样本，",
    "stars.h2_b": "对应四类注意力玩法。",
    "stars.p": "我们挑 4 个代表性样本做深度拆解，是因为它们分别对应了不同预算、不同目标和不同赛道下的常见流量需求。无论你想推项目、推人、推话题，还是测试一组 KOL，都能在这里找到接近的参照。",
    "stars.narr": "项目脉络", "stars.takeaway": "合作启发",
    "stars.sample": "SAMPLE",
    "stars.s1.tag": "冷启动放量", "stars.s1.en": "BEST OVERALL · COST × ENGAGEMENT",
    "stars.s1.story": "Portals 是一条公链里的 AI Agent Meme Launchpad。我们把 4,000 USDC 预算拆成 3 组 KOL 梯队，让头部负责定调，腰部负责扩散，尾部负责承接互动，最后把 CPE 压进了 3 USDC 以内。",
    "stars.s1.take": "小中预算需求只要节奏切得准，效率并不输大预算。这个样本适合作为冷启动、早期放量或新话题试水的参考。",
    "stars.s2.tag": "单场曝光最高", "stars.s2.en": "LARGEST SINGLE-CAMPAIGN REACH",
    "stars.s2.story": "zkVerify 所在的 ZK 基础设施赛道偏技术，内容理解门槛高。我们没有硬推概念，而是把传播任务交给更擅长翻译复杂内容的开发者型 KOL，让预算先转化成理解，再转化成规模曝光。",
    "stars.s2.take": "技术型叙事要先解决听不听得懂，再谈放大。预算越往上，越需要把复杂内容翻译成市场愿意转发的表达。",
    "stars.s3.tag": "讨论深度最强", "stars.s3.en": "DEEPEST AI-NATIVE DIALOGUE",
    "stars.s3.story": "Sentient 面对的是天然活跃、愿意表达观点的 AI 圈层。我们没有把预算压到大号转发，而是把重点放在中腰部 AI KOL 的观点表达和话题争议上，最后把互动率推到 1.14%。",
    "stars.s3.take": "当需求更看重讨论质量，就不能只买大号曝光。更重要的是理解内容节奏、人群情绪和议题推进方式。",
    "stars.s4.tag": "低预算曝光样本", "stars.s4.en": "CHEAPEST CPM ON RECORD",
    "stars.s4.story": "HashKey Exchange 的叙事天然贴近监管、合规和金融信任。我们只选了 8 位华语金融向 KOL，用 1,400 USDC 先做低预算测试，结果 CPM 跑到 19.06，给后续同类项目留下了很强的预算参照。",
    "stars.s4.take": "垂直人群足够清晰时，低预算测试也能跑出很有价值的流量判断。很多需求的第一步都应该从这里开始。",
    "stars.stat.budget": "预算", "stars.stat.imp": "曝光", "stars.stat.cpm": "CPM", "stars.stat.cpe": "CPE", "stars.stat.er": "互动率",
    "stars.u.usdc": "USDC", "stars.u.imp": "IMP", "stars.u.pct": "%",

    "matrix.kicker": "§ 06 · 注意力价格矩阵",
    "matrix.h2_a": "{baselineCount} 个基准样本，",
    "matrix.h2_b": "沉淀出一套可对照的流量判断面。",
    "matrix.p": "横轴是 CPM，纵轴是互动率，气泡大小代表曝光量。这张图的意义，不只是把项目摆在一起看，更是帮助需求方更快判断一次注意力交易的预算效率、内容表现和优化空间。",
    "matrix.legend1": "◇ X 轴 · CPM (USDC)",
    "matrix.legend2": "◇ Y 轴 · 互动率 (%)",
    "matrix.legend3": "◇ 气泡 · 曝光量",
    "matrix.legend_star": "代表样本",
    "matrix.legend_other": "其余样本",
    "matrix.scatter_note": "§ 散点图展示 {baselineCount} 个可进入常规对照的注意力样本",
    "matrix.kaio_note": "KAIO · 旗舰预算样本 · CPM 超出量程 · 详见表格 →",
    "matrix.foot1": "◣ 左下 · 更低 CPM 与更高互动率通常意味着更优流量起点",
    "matrix.foot2": "◤ 右下 · 曝光成本偏高且互动偏弱，后续更值得复盘玩法",
    "matrix.foot3": "气泡越大 · 代表该样本提供了更强的声量规模参考",
    "matrix.hover_idle": "悬停气泡查看单项目数据",
    "matrix.ref_cpm": "加权均价 CPM 58.49",
    "matrix.ref_er": "均值互动率 0.78%",
    "matrix.axis_x": "CPM (USDC) →",
    "matrix.axis_y": "← 互动率 (%)",
    "matrix.tip.budget": "预算", "matrix.tip.imp": "曝光", "matrix.tip.cpm": "CPM", "matrix.tip.er": "互动率", "matrix.tip.cpe": "CPE",
    "matrix.table.title": "完整数据表 · {baselineCount} 个基准样本",
    "matrix.table.sub": "点击表头排序 · 代表项目高亮",
    "matrix.table.compiled": "编制 · Q2 2026 · 全部金额以 USDC 计",
    "matrix.col.num": "#",
    "matrix.col.name": "对象",
    "matrix.col.budget": "预算",
    "matrix.col.imp": "曝光",
    "matrix.col.cpm": "CPM",
    "matrix.col.er": "互动率",
    "matrix.col.cpe": "CPE",
    "matrix.col.tag": "标签",
    "matrix.sum.label": "加权合计 / 均值",
    "matrix.sum.tag": "加权基准",
    "matrix.nonbase": "旗舰",
    "matrix.outlier_k": "",
    "matrix.outlier_d": "",
    "tag.cpm_king": "最低 CPM",
    "tag.value_king": "最佳性价比",
    "tag.reach_king": "最高曝光",
    "tag.eng_king": "最高互动率",
    "tag.eng_2": "高互动率",
    "tag.flagship": "旗舰预算",

    "why.kicker": "§ 07 · 为什么注意力需求适合长期管理",
    "why.h2_a": "交易次数越多，",
    "why.h2_b": "报价会越准，执行也会越稳。",
    "why.principle": "PRINCIPLE",
    "why.w1.t": "数据能回看", "why.w1.d": "曝光、互动和结算都有记录，需求方在复盘和对齐预期时更有抓手。",
    "why.w2.t": "预算有参照", "why.w2.d": "{baselineCount} 个基准项目和 {baselineTweets} 条推文沉淀出一条可对照的参考线，后续不管是投流、助推还是议题讨论，都更容易落到具体预算区间。",
    "why.w3.t": "匹配更清楚", "why.w3.d": "KOL、创作者和话题的历史表现会持续累积，合作越久，哪些人适合什么需求会看得越清楚。",
    "why.w4.t": "节奏可调整", "why.w4.d": "一次需求可以拆成多组 KOL 梯队去测试，让你更早知道预算该往曝光、讨论还是转化哪一段放大。",
    "why.w5.t": "风险会被识别", "why.w5.d": "异常互动、失真数据和舆论场干扰会被单独识别，需求方看到的结果更接近真实表现。",
    "why.w6.t": "经验会累积", "why.w6.d": "每一次注意力协作留下的数据和判断，都会进入下一次需求的起点，让后面的决策越来越快。",

    "cta.kicker": "BRING YOUR ATTENTION DEMAND",
    "cta.h2_a": "想曝光什么，",
    "cta.h2_b": "想让市场讨论什么，都可以来灯塔。",
    "cta.p": "告诉我们你想推项目、推人、推话题，还是支持喜欢的 KOL。灯塔会基于已有样本、KOL 池和历史表现，先帮你判断预算区间、内容节奏、预期结果和更适合的执行组合。",
    "cta.btn1": "关注 @Lighthouse_2026 →",
    "cta.btn2": "邮件 Lighthouse@mangolabs.org",
    "cta.s1.v": "169K", "cta.s1.k": "已结算注意力预算",
    "cta.s2.v": "2.9M", "cta.s2.k": "可对照曝光样本",
    "cta.s3.v": "72h", "cta.s3.k": "需求反馈速度",

    "footer.copy": "© 2026 灯塔实验室 — Case Study Vol. 01 — 编制于 2026 年 Q2",
    "footer.stats": "{baselineCount} 个基准项目 · {baselineTweets} 条推文 · 总曝光 {totalImpFmt} · 可作为后续合作参照",
    "footer.link.contact": "联系",

    "sample.vol": "VOL. 01",
  },

  en: {
    "brand.cn": "Lighthouse",
    "brand.en": "LIGHTHOUSE",
    "brand.tagline": "Lighthouse is a Web3 attention marketplace. Whether you want to push a project, grow a personal IP, support a KOL you like, or make a topic visible, we turn traffic demand into priced, executable, reviewable coordination.",
    "nav.about": "Attention Plays",
    "nav.kpi": "Price Benchmarks",
    "nav.winners": "Playbooks",
    "nav.ip": "Personal IP",
    "nav.stars": "Representative Cases",
    "nav.matrix": "Traffic Matrix",
    "nav.cta": "Submit Demand",
    "nav.cta_btn": "See how we work →",
    "nav.app_btn": "Go to Lighthouse →",
    "nav.lang": "中文",

    "hero.kicker_tl": "CASE STUDY · VOL. 01 / 2026",
    "hero.stats_tl": "{baselineCount} baseline projects · {baselineTweets} tweets · Q4·25 — Q2·26",
    "hero.kicker_tr": "FOR PROJECTS / CREATORS / COMMUNITIES / KOL SUPPORTERS",
    "hero.by_tr": "COMPILED BY · LIGHTHOUSE LABS",
    "hero.eyebrow": "LIGHTHOUSE · WEB3 ATTENTION MARKETPLACE",
    "hero.h1_a": "Bring Web3 attention",
    "hero.h1_b": "to projects, people, and topics",
    "hero.h1_c": "through Lighthouse.",
    "hero.sub": ["Built on ", "{baselineCount} baseline projects", ", ", "{baselineTweets} tweets", ", and ", "more than {totalImpLabel} impressions", ", this case study shows how Lighthouse organizes project launches, KOL boosts, personal IP growth, market conversation, and share-of-voice defense into priced, executable, reviewable attention coordination."],
    "hero.stat1.k": "Settled Budget Pool",
    "hero.stat1.u": "USDC · fully on-chain settled",
    "hero.stat2.k": "Benchmarkable Reach",
    "hero.stat2.u": "across {baselineCount} baseline projects · {baselineTweets} tweets",
    "hero.stat3.k": "Peak ER",
    "hero.stat3.u": "set by {peakErWho} · industry avg ≈ 0.4%",
    "hero.cta1": "Explore traffic samples ↓",
    "hero.cta2": "Talk through your traffic demand",
    "hero.foot": "{baselineCount} baseline samples · {baselineTweets} tweets · paid reach · KOL support · share-of-voice defense",
    "hero.scroll": "SCROLL · 01/07",

    "about.kicker": "§ 02 · WHAT ATTENTION DEMANDS LIGHTHOUSE CAN HANDLE",
    "about.h2_a": "Paid reach, boosts, conversation, support —",
    "about.h2_b": "all organized into reviewable attention coordination",
    "about.h2_c": ".",
    "about.p": "Web3 traffic demand does not only belong to project teams. Someone may want a project seen, a personal IP pushed, a favorite KOL supported, or a topic positioned safely inside a noisy market conversation. Lighthouse brings demand, budget, KOL selection, content pacing, and review data onto one table, so attention is no longer just one-off posting — it becomes managed market coordination.",
    "about.cap1.t": "Paid reach",
    "about.cap1.en": "投流曝光",
    "about.cap1.d": "Match KOLs around vertical, audience, and budget, then turn one reach demand into an executable, trackable, reviewable distribution mix.",
    "about.cap2.t": "KOL boosts",
    "about.cap2.en": "KOL 助推",
    "about.cap2.d": "When you want an opinion, event, asset, or piece of content seen by more people, use performance history to concentrate the push.",
    "about.cap3.t": "Market conversation",
    "about.cap3.en": "议题讨论",
    "about.cap3.d": "When you need the market to discuss a direction, or need share-of-voice defense against competitor pressure, Lighthouse helps organize safer topic positioning and narrative correction.",
    "about.cap4.t": "Creator support",
    "about.cap4.en": "创作者支持",
    "about.cap4.d": "If you like a KOL, analyst, or community lead, Lighthouse can turn that support into a visible boost with real reach.",
    "about.f1": "◇ 2,400+ callable KOLs / creators",
    "about.f2": "◇ 40+ projects / individual demands ({totalCount} sampled · {baselineCount} baseline)",
    "about.f3": "◇ Project launches · personal IP · market conversation · USDC settlement",

    "kpi.kicker": "§ 03 · PRICE BENCHMARKS FOR ATTENTION TRADES",
    "kpi.h2_a": "The value of these numbers",
    "kpi.h2_b": "is that attention plays get prices and reference lines.",
    "kpi.p": "These 6 KPIs come from complete campaign records across {baselineCount} baseline projects. The swings are left intact and the sample is not polished for appearance. What matters is that paid reach, KOL boosts, market conversation, and personal IP growth now have a first reference for price and expected effect.",
    "kpi.k1": "Total Budget", "kpi.k1u": "USDC", "kpi.k1n": "An attention-budget reference built from {baselineCount} baseline samples",
    "kpi.k2": "Total Impressions", "kpi.k2u": "IMPRESSIONS", "kpi.k2n": "Real traffic delivery scale built from {baselineTweets} tweets",
    "kpi.k3": "Total Engagements", "kpi.k3u": "ENGAGEMENTS", "kpi.k3n": "A practical signal for whether content, topic, and audience connected",
    "kpi.k4": "Weighted Avg CPM", "kpi.k4u": "USDC", "kpi.k4n": "A pricing anchor for reach, boosts, and topic tests",
    "kpi.k5": "Lowest CPM", "kpi.k5u": "USDC", "kpi.k5n": "A reach-efficiency sample delivered by {lowestCpmWho}",
    "kpi.k6": "Peak Engagement Rate", "kpi.k6u": "ENGAGEMENT RATE", "kpi.k6n": "{peakErWho} pushed conversation depth above common market levels",
    "kpi.sub1.k": "Secondary metric · Lowest CPE", "kpi.sub1.u": "USDC / ENGAGEMENT", "kpi.sub1.who": "{lowestCpeWho} pushed interaction cost into a very efficient range",
    "kpi.sub2.k": "Secondary metric · Largest Single-Campaign Reach", "kpi.sub2.u": "IMPRESSIONS", "kpi.sub2.who": "{maxImpWho} shows that mid-to-large budgets can still scale share of voice cleanly",

    "win.kicker": "§ 04 · DIFFERENT DEMANDS CALL FOR DIFFERENT PLAYS",
    "win.h2_a": "People can buy attention",
    "win.h2_b": "for very different outcomes.",
    "win.p": "Some people need reach first. Others care more about discussion depth. Some want to give a creator a visible boost, while others need safer positioning inside the market conversation. Lighthouse separates those objectives early, so pricing, execution, and review all become easier afterward.",
    "win.top3": "TOP 3",
    "win.budget": "Budget", "win.imp_u": "imp",
    "win.takeaway": "Key takeaway",
    "win.bench": "Baseline floor",
    "win.d1.label": "Lowest CPM", "win.d1.en": "CHEAPEST ATTENTION", "win.d1.lead": "When the first priority is reach efficiency, these combinations tend to open the fastest.",
    "win.d1.take": "A centralized-exchange narrative paired with top Chinese-language KOLs helped HashKey Exchange land a 19.06 CPM. That outcome gives later reach demands in the same lane a strong budget reference.",
    "win.d2.label": "Highest Engagement", "win.d2.en": "DEEPEST CONVERSATION", "win.d2.lead": "Once the objective shifts toward discussion depth, content structure and audience fit matter more.",
    "win.d2.take": "AI Agent and Meme-adjacent topics pull participation more naturally. Lighthouse's top three in this dimension all cleared 1%, showing that the right topic design can turn traffic into conversation.",
    "win.d3.label": "Best CPE", "win.d3.en": "BEST VALUE PER ENGAGEMENT", "win.d3.lead": "When a demand starts watching interaction cost closely, the playbook has to change with it.",
    "win.d3.take": "Portals pushed cost per engagement down to 2.81 USDC. For small and mid-sized budgets, that leaves a clear lesson: when the objective and audience line up well enough, there is still plenty of room for efficiency.",

    "div1.kicker": "INTERLUDE · EDITORIAL NOTES",
    "div1.q": "Campaign work should not stay at the level of instinct and luck. It is closer to a financial report: every number should have a source, a benchmark, and a path back to verification.",
    "div1.sub": "LIGHTHOUSE · EDITORIAL PRINCIPLES · 2026",
    "div2.kicker": "",
    "div2.q": "",
    "div2.sub": "",

    "stars.kicker": "§ 05 · ATTENTION SAMPLES",
    "ip.kicker": "§ 01 · PERSONAL IP CASES",
    "ip.back": "← Back to main case study",
    "ip.h2_a": "Built with Lighthouse:",
    "ip.h2_b": "people can become IP too.",
    "ip.p": "Not just projects. Creators, analysts, founders, and community leads can use Lighthouse to turn an opinion, a quote pool, or a content collaboration into visible growth. One real case below — with more coming.",

    "ip.placeholder.tag": "待补充",
    "ip.more": "更多案例陆续加入 →",
    "astra.badge": "LIGHTHOUSE QUOTE POOL · 2026.04",
    "astra.h2_a": "500 USDC,",
    "astra.h2_b": "a quote from Justin Sun.",
    "astra.lede": "@0xAstraSpark opened a 500 USDC personal quote pool on Lighthouse with a TRON-ecosystem angle. The thread hit XHunt CN #1, and then Justin Sun personally followed and quote-tweeted it.",
    "astra.name": "Astra",
    "astra.handle": "@0xAstraSpark",
    "astra.avatar": "assets/ip/astra-avatar.jpg",

    "astra.bio": "Serial founder (class of '04), currently at ANU. Built one of GitHub's largest blockchain open-source infrastructures — a top-1 crypto payment solution adopted by tens of thousands of independent sites, processing hundreds of millions in real volume. 🏗️ Now building @GMWalletApp.",

    "astra.stat.budget": "Budget",
    "astra.stat.budget.v": "500",
    "astra.stat.budget.u": "USDC",
    "astra.stat.campaign": "Campaign type",
    "astra.stat.campaign.v": "Personal quote pool",
    "astra.stat.roi": "Earned value",
    "astra.stat.roi.v": "∞",
    "astra.stat.roi.u": "far beyond 500U",

    "astra.story.kicker": "STORY",
    "astra.story.h": "Small budget, top-tier reach.",
    "astra.story.p1": "Astra is a TRON-focused observer and personal IP. He put 500 USDC into Lighthouse as a personal quote pool — lighter than a typical project KOL buy, but tightly focused.",
    "astra.story.p2": "It worked. A long post — 'Why do all the transfers run on TRON?' — framed TRON's governance and execution playbook. It hit XHunt CN real-time #1 within 4h, scoring 93.",
    "astra.story.p3a": "The real moment came 8 hours later.",
    "astra.story.p3b": " Justin Sun himself followed the account and quote-tweeted the thread with 'TRON + B.ai, blockchain × AI — stronger together!' — pushing Astra's original post to 100K views, 280 likes, 244 replies and 77 RTs.",

    "astra.takeaway.k": "TAKEAWAY",
    "astra.takeaway.v": "Lighthouse isn't only for project teams. With a tiny budget, a personal IP can still break into top-tier industry circles.",

    "astra.b1.title": "XHunt CN 4h hot-list — #1",
    "astra.b1.note": "Astra topped the CN thread list with 93 pts, ahead of CryptoD, Crypto_EZ and other big accounts.",
    "astra.b1.badge": "CONTENT BREAKOUT",

    "astra.b2.title": "Justin Sun followed the account",
    "astra.b2.note": "Eight hours after the thread went live, H.E. Justin Sun appeared in the 'Recently Followed' list — Forbes icon, verified, the TRON founder himself.",
    "astra.b2.badge": "FOLLOWED BY JUSTIN",

    "astra.b3.title": "Justin Sun quote-tweeted + endorsed",
    "astra.b3.note": "'TRON + B.ai, blockchain × AI — stronger together!' Sun quoted and retweeted Astra's post, directly lifting its traffic to a new tier.",
    "astra.b3.badge": "QUOTE RETWEET",

    "astra.b4.title": "Final thread numbers · 100K views",
    "astra.b4.note": "After the quote retweet, Astra's original post landed at 100K views, 280 likes, 244 replies and 77 RTs — with 49,040 cumulative account badge score.",
    "astra.b4.badge": "FINAL NUMBERS",

    "astra.math.kicker": "ROI · what 500U actually bought",
    "astra.math.k1": "Spend",
    "astra.math.k2": "Final thread views",
    "astra.math.k2.u": "views · Astra's original post",
    "astra.math.k3": "Likes · replies · RTs",
    "astra.math.k3.u": "Badge · 49,040 total",
    "astra.math.k4": "IP lift",
    "astra.math.k4.v": "Top-tier circle",
    "astra.math.note": "This wasn't a paid celebrity shout. It was an organic quote triggered by content quality + channel fit + timing. The 500 USDC spend — plus Justin Sun's unpaid follow, quote-retweet and the industry attention that followed — is worth far more than 500U under any market pricing model.",

    "stars.h2_a": "Four samples,",
    "stars.h2_b": "four attention plays.",
    "stars.p": "We picked four representative samples because each maps to a common traffic demand under different budgets, goals, and verticals. Whether you want to push a project, a person, a topic, or a KOL test, one of these should feel close.",
    "stars.narr": "NARRATIVE", "stars.takeaway": "TAKEAWAY",
    "stars.sample": "SAMPLE",
    "stars.s1.tag": "Cold-Start Scale", "stars.s1.en": "BEST OVERALL · COST × ENGAGEMENT",
    "stars.s1.story": "Portals is an AI Agent Meme Launchpad on a public chain. We split a 4,000 USDC budget across three KOL tiers — heads set the tone, mid-tiers amplified, long-tails converted engagement — and pushed CPE below 3 USDC.",
    "stars.s1.take": "Small-to-mid budget demands can still match large-budget efficiency when the pacing is right. This sample works as a reference for cold starts, early scaling, or testing a new topic.",
    "stars.s2.tag": "Largest Single-Campaign Reach", "stars.s2.en": "LARGEST SINGLE-CAMPAIGN REACH",
    "stars.s2.story": "zkVerify sits in the ZK infrastructure vertical — technical, with a high comprehension barrier. Instead of pushing concepts hard, we handed distribution to developer-type KOLs who are better at translating complex content, letting budget convert to understanding first, then to scaled impressions.",
    "stars.s2.take": "Technical narratives need to solve comprehension first, then talk about scaling. The higher the budget, the more important it is to translate complexity into language the market will share.",
    "stars.s3.tag": "Deepest Conversation", "stars.s3.en": "DEEPEST AI-NATIVE DIALOGUE",
    "stars.s3.story": "Sentient faces a naturally active AI community willing to express opinions. Instead of pushing budget into big-account retweets, we focused on mid-tier AI KOLs' opinion expression and topic controversy, ultimately pushing engagement rate to 1.14%.",
    "stars.s3.take": "When a demand cares more about discussion quality, buying big-account reach is not enough. Content pacing, audience emotion, and topic sequencing matter more.",
    "stars.s4.tag": "Record-Low CPM", "stars.s4.en": "CHEAPEST CPM ON RECORD",
    "stars.s4.story": "HashKey Exchange's narrative naturally aligns with regulation, compliance, and financial trust. We selected just 8 Chinese-language finance KOLs, using 1,400 USDC for a low-budget test first. The CPM came in at 19.06, leaving a strong budget reference for similar projects going forward.",
    "stars.s4.take": "When the vertical audience is clear enough, low-budget tests can still produce valuable traffic judgment. Many demands should start from here.",
    "stars.stat.budget": "Budget", "stars.stat.imp": "Impressions", "stars.stat.cpm": "CPM", "stars.stat.cpe": "CPE", "stars.stat.er": "ER",
    "stars.u.usdc": "USDC", "stars.u.imp": "IMP", "stars.u.pct": "%",

    "matrix.kicker": "§ 06 · ATTENTION PRICE MATRIX",
    "matrix.h2_a": "{baselineCount} baseline samples,",
    "matrix.h2_b": "distilled into a benchmarkable traffic judgment set.",
    "matrix.p": "X axis: CPM. Y axis: engagement rate. Bubble size: impressions. The point of this chart is not just placing projects side by side — it helps demand owners judge the budget efficiency, content performance, and optimization space of an attention trade faster.",
    "matrix.legend1": "◇ X · CPM (USDC)",
    "matrix.legend2": "◇ Y · ENGAGEMENT RATE (%)",
    "matrix.legend3": "◇ BUBBLE · IMPRESSIONS",
    "matrix.legend_star": "Star samples",
    "matrix.legend_other": "Other samples",
    "matrix.scatter_note": "§ Scatter shows {baselineCount} benchmarkable attention samples (CPM 10–100)",
    "matrix.kaio_note": "KAIO · flagship budget · CPM off-range · see table →",
    "matrix.foot1": "◣ Bottom-left · low CPM + high ER = stronger traffic starting point",
    "matrix.foot2": "◤ Bottom-right · high CPM + low ER = playbook needs review",
    "matrix.foot3": "Larger bubble · stronger share-of-voice reference",
    "matrix.hover_idle": "Hover a bubble for details",
    "matrix.ref_cpm": "Weighted avg CPM 58.49",
    "matrix.ref_er": "Avg engagement rate 0.78%",
    "matrix.axis_x": "CPM (USDC) →",
    "matrix.axis_y": "← ENGAGEMENT RATE (%)",
    "matrix.tip.budget": "Budget", "matrix.tip.imp": "Imp.", "matrix.tip.cpm": "CPM", "matrix.tip.er": "ER", "matrix.tip.cpe": "CPE",
    "matrix.table.title": "Full data table · {baselineCount} baseline samples",
    "matrix.table.sub": "Click a column to sort · star projects highlighted",
    "matrix.table.compiled": "COMPILED · Q2 2026 · ALL AMOUNTS IN USDC",
    "matrix.col.num": "#",
    "matrix.col.name": "Target",
    "matrix.col.budget": "Budget",
    "matrix.col.imp": "Impressions",
    "matrix.col.cpm": "CPM",
    "matrix.col.er": "ER",
    "matrix.col.cpe": "CPE",
    "matrix.col.tag": "Tag",
    "matrix.sum.label": "Weighted total / mean",
    "matrix.sum.tag": "WEIGHTED BASELINE",
    "matrix.nonbase": "flagship",
    "matrix.outlier_k": "",
    "matrix.outlier_d": "",
    "tag.cpm_king": "Lowest CPM",
    "tag.value_king": "Best Value",
    "tag.reach_king": "Top Reach",
    "tag.eng_king": "Top ER",
    "tag.eng_2": "High ER",
    "tag.flagship": "Flagship Budget",

    "why.kicker": "§ 07 · WHY ATTENTION DEMAND SHOULD BE MANAGED OVER TIME",
    "why.h2_a": "The more attention trades you run,",
    "why.h2_b": "the sharper the pricing and the steadier the delivery.",
    "why.principle": "PRINCIPLE",
    "why.w1.t": "Reviewable data", "why.w1.d": "Impressions, engagements, and settlements are all on record, giving demand owners something concrete to use during reviews and expectation alignment.",
    "why.w2.t": "Budget references", "why.w2.d": "{baselineCount} baseline projects and {baselineTweets} tweets have built a reference line that makes it easier to price paid reach, boosts, and market conversation within concrete ranges.",
    "why.w3.t": "Clearer matching", "why.w3.d": "KOL, creator, and topic performance history keeps accumulating. The longer you work together, the clearer it becomes who fits which demand.",
    "why.w4.t": "Adjustable pacing", "why.w4.d": "One demand can be split across multiple KOL tiers, so you learn earlier whether to scale reach, conversation, or conversion.",
    "why.w5.t": "Risks identified", "why.w5.d": "Abnormal engagement, distorted data, and market noise are identified separately, so the result stays closer to real performance.",
    "why.w6.t": "Experience compounds", "why.w6.d": "The data and judgment from each attention coordination become the starting point for the next demand, making every later decision faster.",

    "cta.kicker": "BRING YOUR ATTENTION DEMAND",
    "cta.h2_a": "What do you want visible?",
    "cta.h2_b": "What should the market discuss? Bring it to Lighthouse.",
    "cta.p": "Tell us whether you want to push a project, a person, a topic, or support a KOL you like. Based on existing samples, the KOL pool, and historical performance, Lighthouse will help you judge budget range, content pacing, expected outcome, and the right execution mix.",
    "cta.btn1": "Follow @Lighthouse_2026 →",
    "cta.btn2": "Email Lighthouse@mangolabs.org",
    "cta.s1.v": "169K", "cta.s1.k": "Settled attention budget",
    "cta.s2.v": "2.9M", "cta.s2.k": "Benchmarkable impressions",
    "cta.s3.v": "72h", "cta.s3.k": "Demand response time",

    "footer.copy": "© 2026 Lighthouse Labs — Case Study Vol. 01 — Compiled Q2 2026",
    "footer.stats": "{baselineCount} baseline projects · {baselineTweets} tweets · {totalImpFmt} total impressions · benchmark reference on Base",
    "footer.link.contact": "Contact",

    "sample.vol": "VOL. 01",
  },
};

const LangContext = React.createContext({ lang: "zh", setLang: ()=>{}, t: (k)=>k });

const LIVE_I18N_PLACEHOLDER_REQUIREMENTS = {
  "hero.stats_tl": ["baselineCount", "baselineTweets"],
  "hero.sub": ["baselineCount", "baselineTweets", "totalImpLabel"],
  "hero.stat2.u": ["baselineCount", "baselineTweets"],
  "hero.stat3.u": ["peakErWho"],
  "hero.foot": ["baselineCount", "baselineTweets"],
  "about.f2": ["totalCount", "baselineCount"],
  "kpi.p": ["baselineCount"],
  "kpi.k1n": ["baselineCount"],
  "kpi.k2n": ["baselineTweets"],
  "kpi.k5n": ["lowestCpmWho"],
  "kpi.k6n": ["peakErWho"],
  "kpi.sub1.who": ["lowestCpeWho"],
  "kpi.sub2.who": ["maxImpWho"],
  "matrix.h2_a": ["baselineCount"],
  "matrix.scatter_note": ["baselineCount"],
  "matrix.table.title": ["baselineCount"],
  "why.w2.d": ["baselineCount", "baselineTweets"],
  "footer.stats": ["baselineCount", "baselineTweets", "totalImpFmt"],
};

function liveI18nPlaceholders(value) {
  const text = Array.isArray(value) ? value.join(" ") : String(value ?? "");
  return new Set([...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]));
}

function shouldUseLiveI18nValue(key, value) {
  const required = LIVE_I18N_PLACEHOLDER_REQUIREMENTS[key];
  if (!required) return true;
  const placeholders = liveI18nPlaceholders(value);
  return required.every(k => placeholders.has(k));
}

// Try to load i18n from API, merge over hardcoded DICT
let _liveDict = null;
function loadLiveDict() {
  if (_liveDict) return Promise.resolve(_liveDict);
  return fetch('/api/i18n').then(r => r.ok ? r.json() : null).then(d => {
    if (d) {
      _liveDict = {};
      for (const lang of Object.keys(d)) {
        const merged = { ...(DICT[lang] || {}) };
        _liveDict[lang] = {};
        for (const [key, value] of Object.entries(d[lang] || {})) {
          if (shouldUseLiveI18nValue(key, value)) {
            merged[key] = value;
            _liveDict[lang][key] = value;
          } else {
            _liveDict[lang][key] = merged[key];
          }
        }
        DICT[lang] = merged;
      }
    }
    return DICT;
  }).catch(() => DICT);
}

function LangProvider({children}){
  const [lang, setLangState] = React.useState(() => {
    try { return localStorage.getItem(LANG_KEY) || "zh"; } catch { return "zh"; }
  });
  const [ready, setReady] = React.useState(false);
  const [draftOverrides, setDraftOverrides] = React.useState(null);
  React.useEffect(() => { loadLiveDict().then(() => setReady(true)); }, []);

  // Signal to parent that this iframe is ready for preview messages
  React.useEffect(() => {
    if (ready && window.parent !== window) {
      window.parent.postMessage({ type: 'lh-preview-ready', page: window.location.pathname }, '*');
    }
  }, [ready]);

  // Listen for preview draft messages from admin iframe parent
  React.useEffect(() => {
    function onMsg(e) {
      if (!e.data || e.data.type !== 'lh-preview') return;
      if (e.data.action === 'i18n-draft') {
        setDraftOverrides(e.data.drafts); // { zh: {...}, en: {...} }
      } else if (e.data.action === 'set-lang') {
        setLangState(e.data.lang);
      } else if (e.data.action === 'clear-draft') {
        setDraftOverrides(null);
      }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const setLang = (l)=>{
    setLangState(l);
    try { localStorage.setItem(LANG_KEY, l); } catch {}
    try { document.documentElement.lang = l === "zh" ? "zh-CN" : "en"; } catch {}
  };
  React.useEffect(()=>{ try { document.documentElement.lang = lang === "zh" ? "zh-CN" : "en"; } catch {} }, [lang]);
  const t = (k)=> {
    // Draft overrides take priority (preview mode)
    if (draftOverrides && draftOverrides[lang] && draftOverrides[lang][k] !== undefined) return draftOverrides[lang][k];
    if (draftOverrides && draftOverrides.zh && draftOverrides.zh[k] !== undefined && !(DICT[lang] && DICT[lang][k] !== undefined)) return draftOverrides.zh[k];
    return (DICT[lang] && DICT[lang][k] !== undefined) ? DICT[lang][k] : (DICT.zh[k] ?? k);
  };
  return <LangContext.Provider value={{lang, setLang, t, draftOverrides}}>{children}</LangContext.Provider>;
}

function useT(){ return React.useContext(LangContext); }

function tpl(str, vars) {
  if (!str || !vars) return str;
  if (Array.isArray(str)) return str.map(s => typeof s === 'string' ? tpl(s, vars) : s);
  return String(str).replace(/\{(\w+)\}/g, (_, k) => vars[k] !== undefined ? vars[k] : `{${k}}`);
}

window.i18n = { DICT, LangContext, LangProvider, useT, tpl };
