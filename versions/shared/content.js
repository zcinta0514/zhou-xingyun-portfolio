/* ============================================================
   全站唯一事实来源。三个方向共用这一份数据，
   保证同一件事在三个版本里说法一致、数字一致、口径一致。
   所有数字都来自当事人提供的原始记录，不得改写、不得编造。
   ============================================================ */
(function () {
  'use strict';

  // 三个版本页都在 versions/X/index.html，资产在仓库根 assets/
  window.ASSET_PREFIX = '../../';
  window.asset = function (p) { return window.ASSET_PREFIX + p; };

  window.SITE = {
    identity: {
      name: '周性运',
      en: 'Lucky',
      title: '产品运营 · 内容策划 · AI 应用实践',
      // 首屏主张句：替换原来的岗位名。岗位名回答“我是谁”，主张句回答“我做什么、凭什么”
      claim: '做内容，也做工具。把需求拆成工作流，用 AI 把想法做成可以使用的作品。',
      // 首屏次级行：岗位名 + 届别 + 学历（比原来多带一个岗位名，因为主张句占了主行）
      subline: '内容策划与海外社媒运营 · 2027 届 · 应用经济学硕士 · 数学与应用数学本科',
      cohort: '2027 届 · 硕士',
      oneLine: '本科数学，硕士应用经济学，2027 届。在网易、虎扑、盛力世家做过海外社媒内容、社区运营和赛事现场。',
      about: [
        '我是周性运，也可以叫我 Lucky。本科读数学，现在读应用经济学硕士，预计 2027 年毕业。',
        '最近在折腾各种 AI 工具，试着做点自己的小项目。',
        '在网易、虎扑和盛力世家实习过，做过海外社媒内容、社区运营，也在赛事现场忙过。',
        '平时爱看体育赛事。遇到新知识、新工具，总忍不住想多了解一点。',
      ],
      portrait: 'assets/hero_profile_soft-v1.png',
      portraitSquare: 'assets/profile-id-original-v1.jpg',
    },

    /* 首屏证据条：全站最强的四个数字，出处见各条 source */
    proof: [
      { value: 1.6,   dec: 1, suffix: 'M', label: '单条视频播放',   source: 'TikTok · 2026-09-09 核实', peak: true },
      { value: 571226, dec: 0, suffix: '',  label: '单篇文章阅读',   source: '虎扑 · 2026-08-12 记录' },
      { value: 300,   dec: 0, suffix: '+', label: '小游戏玩家',     source: '本人提供 · 2026-09-14' },
      { value: 19.6,  dec: 1, suffix: 'K', label: '账号粉丝',       source: '2026-08-12 历史记录' },
    ],

    education: [
      { period: '2024.09—2027.06（预计）', school: '上海师范大学', major: '应用经济学 · 硕士在读', level: 'MASTER' },
      { period: '2019.09—2023.06',        school: '浙江工业大学', major: '数学与应用数学 · 本科', level: 'BACHELOR' },
    ],

    experience: [
      {
        period: '2026.09—至今', company: '心动', role: '产品运营实习生 · AI Agent 产品 Cindy',
        points: ['拆解插件需求、设计 Prompt 与验收标准，以 AI Coding 完成搭建；「录屏→宣传短片」插件已投入团队内部使用', '设计并落地 2 条自动化工作流，串联原本依赖人工衔接的步骤', '结合真实场景测试产品、归因问题，整理用户反馈、Bug 与需求建议，参与评审和优先级讨论', '独立完成产品演示视频，并构建动效素材库，沉淀可复用的制作流程'],
      },
      {
        period: '2026.03—2026.07', company: '网易', role: '游戏海外市场营销策划实习生',
        points: ['内容选题策划与制作发布', '海外社媒独立运营', 'AIGC 视觉内容创作', '官方社媒动态创意与素材制作', '日韩发行筹备与外包制作协作'],
      },
      {
        period: '2025.11—2026.02', company: '虎扑', role: '赛事运营实习生',
        points: ['赛事热点追踪与选题策划', '资料研究与原创内容撰写', '内容发布与社区互动运营'],
      },
      {
        period: '2025.03—2025.05', company: '盛力世家', role: '上海花剑大奖赛 · 赛事运营实习生',
        points: ['赛事信息对接与现场执行协作', '场地搭建与执行进度跟进', '人员协调与赛事后勤保障'],
      },
    ],

    capabilities: [
      {
        id: 'content', index: '01', name: '内容策划与制作', short: '选题 · 脚本 · 制作',
        summary: '把一个内容想法从选题推进到发布，也会用 AIGC 辅助处理视觉素材。',
        evidence: ['选题与脚本', '内容 Brief', '制作协调', 'AIGC 素材'],
        jump: '#works-tiktok',
      },
      {
        id: 'global', index: '02', name: '海外社媒运营', short: 'TikTok · IG · 日韩协作',
        summary: '参与 TikTok、Instagram 内容策划与发布；日韩项目负责中文制作说明、教学目标和外包成片审核。详细脚本、本地化与剪辑由外包团队完成。',
        evidence: ['TikTok', 'Instagram', '中文制作说明', '外包审核'],
        jump: '#works-localization',
      },
      {
        id: 'community', index: '03', name: '社区与活动', short: '社区 · 赛事',
        summary: '在虎扑做热点内容和社区互动，也在上海花剑大奖赛参与现场执行与协作。',
        evidence: ['热点内容', '社区互动', '现场信息', '赛事协作'],
        jump: '#works-hupu',
      },
      {
        id: 'ai', index: '04', name: 'AI 应用实践', short: '工作流 · 插件 · 工具',
        summary: '在心动参与 Cindy 产品运营，拆解需求、搭建插件与工作流；独立制作产品视频，构建动效素材库、摄影调色工具及羽毛球小游戏。',
        evidence: ['工作流编排', '插件设计', '产品测试', '效果验收'],
        jump: '#practice-rally',
      },
    ],

    /* 2026-10-08：本人确认独立完成视频、自建素材库及摄影调色项目。
       心动岗位、日期及职责由桌面《周性运27届硕士简历.pdf》核实。 */
    projects: {
      heading: '把想法做成作品，也做成工具。',
      intro: '在心动参与 Cindy 产品运营：拆解需求、搭建插件与自动化工作流，测试产品并跟进用户反馈。这里展示其中的视频制作与素材库实践。',
      video: {
        title: '手机交代任务，电脑完成。',
        name: 'Cindy · 远程操作功能演示',
        description: '以制作「周末去野」露营活动网页为具体任务，串起手机提出需求、电脑完成网页、远程查看与验证成果的完整故事。',
        role: '独立完成：选题策划、脚本分镜、界面演示、视觉与动效编排、音乐音效及成片迭代；使用 AI 辅助制作。',
        src: 'assets/projects/cindy/remote-camping.mp4',
        poster: 'assets/projects/cindy/video-poster.jpg',
        meta: '1 分 16 秒 · 1080p / 60fps · 2026.10',
        note: '双端界面依据产品源码与设计规范复刻；网页成果可交互。',
        steps: [
          { title: '先确定要讲清什么', text: '把远程操作落到一个具体任务，用“提出需求—执行—验证成果”组织脚本。' },
          { title: '把步骤变成画面', text: '编排手机与电脑的操作顺序，突出输入、执行和结果，用视觉引导交代两端关系。' },
          { title: '做成片，也沉淀方法', text: '调整字幕、节奏、音乐与音效；整理风格要求与修改记录，供后续同类内容复用。' }
        ]
      },
      library: {
        title: '动效素材库',
        subtitle: '让下一次制作，有东西可找、有方法可用。',
        description: '把网页动效与视频参考整理为可检索的素材库。按表达需要查找、预览和比较，为同一栏目保留风格与往期决定，将已验证的实现带入制作。',
        role: '独立构建素材库与使用工作流，串联收集、分类、预览、比较和复用。',
        image: 'assets/projects/cindy/motion-atlas.jpg',
        alt: 'Motion Atlas 动效素材库实际界面，包含分类导航、检索和素材预览',
        note: '实际界面截图。库内包含原创实现与第三方参考，来源及复用状态分别记录。',
        steps: [
          { title: '找得到', text: '分类、编号与关键词检索，把参考变成可再次找到的素材。' },
          { title: '选得清', text: '动态预览与比较，区分参考作品和已验证的可用实现。' },
          { title: '接着用', text: '保存栏目风格、往期决定与常用素材，导出已验证源码。' }
        ]
      },
      photo: {
        title: '摄影调色',
        subtitle: '让照片的风格，可以比较，也可以复用。',
        description: '构建本地调色工具，将照片导入、风格选择、参数微调、真实预览和导出串成完整流程。支持 AI 推荐与复查，也能逐张调整曝光和白平衡后批量处理。',
        role: '个人构建的 AI 应用项目 · 工作流设计与工具实现',
        before: 'assets/projects/photo-grade/before.jpg',
        alt: '阴天的建筑、草地与行人，同一张照片的调色前后对比',
        styles: [
          { name: '自然通透', image: 'assets/projects/photo-grade/dt-natural.jpg' },
          { name: '日系胶片', image: 'assets/projects/photo-grade/dt-film-japanese.jpg' },
          { name: 'Ins 清透', image: 'assets/projects/photo-grade/dt-ins-clear.jpg' }
        ],
        note: '展示同一张照片的默认显影与工具实际输出。切换风格、拖动分界线比较；网页仅展示已有结果。',
        details: '在本地显影引擎上构建调色流程，保留原始照片；将风格强度与照片自身的曝光、白平衡校正分开。导出支持 JPEG 与 16 位 TIFF。'
      }
    },

    /* ── TikTok 篮球短视频 ── */
    tiktok: {
      heading: 'TikTok 篮球短视频运营',
      brief: '围绕 NBA 赛事、球员话题和社交媒体热点，为游戏相关 TikTok 账号策划并发布短视频。结合游戏角色、场景和玩法素材制作内容，让更多泛篮球用户接触游戏。',
      scope: ['平台：TikTok', '内容：篮球与游戏', '形式：短视频'],
      duties: [
        { n: '01', name: '找选题',       text: '跟进 NBA 赛事、球员动态和平台热点，筛选适合账号的内容。' },
        { n: '02', name: '写创意和脚本', text: '确定视频切入点、叙事顺序和画面参考，把想法整理成制作需求。' },
        { n: '03', name: '制作与审核',   text: '按内容需要制作素材或与美术协作，筛选 AIGC 画面并审核成片。' },
        { n: '04', name: '发布与复盘',   text: '选标题、安排发布，记录播放和互动数据，复盘不同选题的表现。' },
        { n: '05', name: 'AI 协同与工作流', text: '与 AI Agent 协同搭建完整内容工作流，串联选题、创意脚本、素材制作与审核。' },
      ],
      account: { name: '@dunkcitydynasty_guide', followers: '19.6K', followersNote: '账号粉丝为 2026-08-12 历史记录' },
      note: '作品公开累计数据 · 2026-09-09 核实；包含发布后的持续传播。',
      works: [
        { id: 'TT1', title: 'SGA 判罚与 Wemby UFO', cat: '季后赛实时热点', views: 15500,   likes: 505,    src: 'assets/library/TT1-cover.png',
          url: 'https://www.tiktok.com/@dunkcitydynasty_guide/video/7641907933189606670',
          face: '踩在赛后判罚讨论的高峰发布',
          why: '判罚争议自带讨论度，发布时点踩在比赛结束后的讨论高峰。' },
        { id: 'TT2', title: 'Air Corgi 选择 Wemby 或 Brunson', cat: '总决赛前热点二创', views: 59800, likes: 2829, src: 'assets/works_tt2_dog_v1.png',
          url: 'https://www.tiktok.com/@dunkcitydynasty_guide/video/7647074934975401247',
          face: '把总决赛对阵做成“二选一”，把观看变成参与',
          why: '把总决赛的对阵关系做成让角色“二选一”的形式，把观看变成参与。互动率 4.7%。' },
        { id: 'TT3', title: 'Warriors 球员阵容话题', cat: '自由市场热点', views: 11200,  likes: 177,    src: 'assets/library/TT3-cover.png',
          url: 'https://www.tiktok.com/@dunkcitydynasty_guide/video/7668281272610884878',
          face: '纯资讯型选题：信息够，但没有对立关系',
          why: '纯资讯型选题，信息量够但缺少对立关系。这条是六条里互动率最低的一条，也是后来调整选题方向的直接原因。' },
        { id: 'TT4', title: 'Herro 与 Bam：从队友到对手', cat: '冲突热点', views: 4221,  likes: 114,    src: 'assets/library/TT4-cover.png',
          url: 'https://www.tiktok.com/@dunkcitydynasty_guide/video/7661890195465309454',
          face: '冲突题材，卡在分发规模上',
          why: '播放最低，但冲突类题材的互动率并不差。这类内容的问题在分发规模，不在内容质量。' },
        { id: 'TT5', title: '三分王与街球传奇 1v1', cat: '热点二创', views: 1600000, likes: 103700, src: 'assets/works_tt5_03.png',
          url: 'https://www.tiktok.com/@dunkcitydynasty_guide/video/7667850870834433294',
          face: '把球星的对抗关系映射到游戏角色，让观众一眼看懂谁在打谁',
          why: '播放 1.6M，互动率 6.5%，两项都是最高。球星对抗关系被完整映射到游戏角色上，观众能一眼看懂谁在打谁。' },
        { id: 'TT6', title: 'Bronny 登机与 LeBron 直升机', cat: '热点二创', views: 174700, likes: 4192, src: 'assets/works_tt6_plane_v1.png',
          url: 'https://www.tiktok.com/@dunkcitydynasty_guide/video/7667898737976495373',
          face: '抓住父子话题，做成能出圈到非球迷的选题',
          why: '父子话题的传播面比篮球本身更宽，是这批里少数能出圈到非球迷的选题。' },
      ],
      lead: 'TT5',   // 峰值作品：三个方向都必须把它当作最重要的一件事
    },

    /* ── Instagram ── */
    instagram: {
      heading: '在 Instagram 玩点花样',
      brief: '为官方 Instagram 组织海报、短视频和竞猜企划，把 NBA 热点、游戏角色与上线节点转化为用户能理解、能参与的内容。',
      tags: ['内容策略', '视觉表达', 'AIGC 协作'],
      note: '本人提供数据 · 2026-08-12',
      works: [
        { id: 'finalsPredict', title: '总决赛预测', cat: '赛事节点 · 海报视觉',
          face: '独立完成视觉设计与制作，把赛事信息、角色素材和参与引导整合进一张海报',
          desc: '用对阵关系和游戏球员形象组织预测话题，引导用户在总决赛节点参与讨论。',
          role: '独立完成视觉设计与制作，将赛事信息、角色素材和参与引导整合到一张海报。',
          credit: '本人设计与制作。',
          images: [{ src: 'assets/library/poster_predict.png', alt: '总决赛预测海报完整画面' }],
          url: 'https://www.instagram.com/p/DZHqPCNlBbx/', metrics: [{ value: '1,848', label: '点赞' }, { value: '125', label: '评论' }] },
        { id: 'championship', title: '夺冠庆祝', cat: '赛事节点 · AIGC 辅助视觉',
          face: '提出创意与版式要求，用 AIGC 生成候选画面并做筛选',
          desc: '围绕夺冠节点制作庆祝视觉，将赛事热度与游戏内容结合。',
          role: '提出创意和版式要求，使用 AIGC 生成候选画面，并完成筛选与结果判断。',
          credit: 'AIGC 辅助产出；本人负责创意、版式要求与生成结果筛选。',
          images: [{ src: 'assets/library/poster_championship.png', alt: '夺冠庆祝海报完整画面' }],
          url: 'https://www.instagram.com/p/DZjdfJ_FGZx/', metrics: [{ value: '2,617', label: '点赞' }, { value: '39', label: '评论' }] },
        { id: 'griffin', title: 'GUESS WHO · Blake Griffin', cat: '上线预热 · 竞猜企划',
          face: '创意、草图、Brief 与审核；成图由美术团队完成',
          desc: '把球员生涯信息转化为竞猜线索，为游戏内新球员上线预热。',
          role: '提炼竞猜创意，整理草图、线索与制作 Brief，并审核最终画面。',
          credit: '本人负责创意、草图、Brief 与审核；美术团队完成最终成图。',
          images: [{ src: 'assets/library/guess_griffin.png', alt: 'Blake Griffin 猜球星创意海报' }],
          url: 'https://www.instagram.com/p/DaxOdoEFF6L/', metrics: [] },
        { id: 'iverson', title: 'GUESS WHO · Allen Iverson', cat: '上线预热 · 竞猜企划',
          face: '创意、草图、Brief 与审核；成图由美术团队完成',
          desc: '通过有辨识度的球员线索组织互动，让用户在揭晓前参与猜测。',
          role: '设计创意方向与线索表达，提供草图和制作 Brief，跟进画面审核。',
          credit: '本人负责创意、草图、Brief 与审核；美术团队完成最终成图。',
          images: [{ src: 'assets/library/guess_iverson.png', alt: 'Allen Iverson 猜球星创意海报' }],
          url: 'https://www.instagram.com/p/DXb1LJziGz6/', metrics: [] },
        { id: 'edwards', title: 'GUESS WHO · Anthony Edwards', cat: '上线预热 · 竞猜企划',
          face: '创意、草图、Brief 与审核；成图由美术团队完成',
          desc: '沿用竞猜系列的内容结构，把不同球员的信息转化为视觉线索。',
          role: '整理竞猜创意、草图与制作 Brief，检查成图能否准确传达线索。',
          credit: '本人负责创意、草图、Brief 与审核；美术团队完成最终成图。',
          images: [{ src: 'assets/library/guess_edwards.png', alt: 'Anthony Edwards 猜球星创意海报' }],
          url: 'https://www.instagram.com/p/Db5UvHLnUMJ/', metrics: [] },
        { id: 'basketballCall', title: '篮球来电', cat: '互动创意 · 短视频静帧',
          face: '选题、创意、标题、封面方案与成片审核',
          desc: '借用社交媒体的“来电”形式，把篮球话题与游戏角色结合，组织短视频的互动切入点。',
          role: '负责选题、创意、标题、封面方案与成片审核，向制作团队说明画面和内容要求。',
          credit: '本人负责策划与审核，团队负责视频制作；这里展示成片静帧。',
          images: [
            { src: 'assets/library/call-a.png', alt: '篮球来电视频静帧 1' },
            { src: 'assets/library/call-b.png', alt: '篮球来电视频静帧 2' },
            { src: 'assets/library/call-c.png', alt: '篮球来电视频静帧 3' }],
          url: 'https://www.instagram.com/p/DaO5UIOAngK/', metrics: [] },
        { id: 'palette', title: '调色盘 Reel', cat: '视觉创意 · 短视频静帧',
          face: '选题、创意、标题、封面方案与成片审核',
          desc: '将社交媒体上的视觉创意与游戏画面结合，形成适合 Instagram 的短视频内容。',
          role: '负责选题、创意、标题、封面方案和审核，协调视频表达与账号内容方向。',
          credit: '本人负责策划与审核，团队负责视频制作；这里展示成片静帧。',
          images: [
            { src: 'assets/library/palette-a.png', alt: '调色盘视频静帧 1' },
            { src: 'assets/library/palette-b.png', alt: '调色盘视频静帧 2' },
            { src: 'assets/library/palette-c.png', alt: '调色盘视频静帧 3' }],
          url: 'https://www.instagram.com/reel/DX6fmcTGIR3/', metrics: [] },
      ],
      note2: '作品集记录 · 2026-08-12',
    },

    /* ── 日韩上线教学内容 ── */
    localization: {
      heading: '给新玩家带个路',
      brief: '围绕日韩服上线前的用户上手需要，规划教学内容的方向与目标，并将制作要求交接给外包团队。',
      face: '规划教学目标与选题，写中文制作说明，审核外包成片',
      count: { value: '20+', label: '条上线前教学内容规划与协作' },
      countNote: '规划协作数量，不等于公开发布数量。作品集记录 · 2026-08-12',
      credit: '本人负责规划、中文制作说明和审核；日韩详细脚本、本地化、剪辑及制作由外包团队完成。',
      capture: { src: 'assets/library/youtube-account.png', alt: '日本区 NBADunkCityJP YouTube 账号公开页面截图', caption: '日本区公开账号 · 作品集留存截图' },
      accountUrl: 'https://www.youtube.com/@NBADunkCityJP',
      accountLabel: '查看日本区 YouTube 账号',
      steps: [
        { n: '01', name: '规划内容与选题', text: '确定内容方向、阶段性选题和每条视频需要讲清的教学目标。' },
        { n: '02', name: '整理中文制作说明', text: '写清选题、教学目标与制作要求，作为外包制作和沟通的依据。' },
        { n: '03', name: '审核成片与反馈', text: '核对成片是否符合教学目标和制作要求，整理修改意见并跟进。' },
      ],
    },

    /* ── 虎扑 ── */
    hupu: {
      heading: '在虎扑聊点什么',
      brief: '在体育社区里，内容需要明确的问题、清楚的信息和可继续讨论的切入点。两篇代表文章展示选题与文字表达。',
      tags: ['热点判断', '资料检索', '社区互动'],
      role: '选题策划、资料检索、标题与正文撰写、发布及互动跟进。',
      note: '阅读与回复数据 · 2026-08-12 作品集记录',
      articles: [
        { n: '01', cat: '热点辨析', title: '真相探求：身高 187cm 的李昊，真的因为太矮被马竞淘汰？',
          face: '检索资料、整理信息、组织标题与正文',
          desc: '围绕“身高是否影响留洋经历”的讨论提出问题，检索相关资料、整理信息，并组织标题与正文。',
          views: 571226, replies: 521, url: 'https://bbs.hupu.com/636921071.html?is_reflow=pc' },
        { n: '02', cat: '赛后议题', title: '0-4 背后的鸿沟：中国足球和日本足球的差距在哪里？',
          face: '从比赛结果切入议题，组织正文并跟进社区讨论',
          desc: '从 0–4 的比赛结果切入中日足球差距这一议题，组织正文内容，并跟进发布后的社区讨论。',
          views: 267726, replies: 746, url: 'https://bbs.hupu.com/637121504.html?is_reflow=pc' },
      ],
      event: {
        label: '线下协作', title: '上海花剑大奖赛 · 赛事运营实习',
        text: '2025.03—05，参与现场信息对接、搭建跟进、人员协调，以及餐饮、交通和物资保障。',
        jump: '#experience',
      },
    },

    /* ── 账号实践 ── */
    practice: {
      douyin: {
        name: '詹库侠', label: '个人账号 · 抖音图文',
        desc: '我目前运营的抖音账号，围绕 NBA 发布图文内容。',
        tags: ['NBA 内容', '图文表达', '个人运营'],
        url: 'https://v.douyin.com/tR5hxQ_DiJ0/',
      },
      rally: {
        label: '个人项目 · AI 应用 / 浏览器游戏',
        heading: '用 AI 做了个羽毛球小游戏',
        intro: '打球打到一半冒出一个想法：做个不用安装、打开网页就能玩的羽毛球小游戏。后来，这个想法变成了「开拍 RALLY」。',
        visual: { src: 'assets/rally-gameplay-v1.png', alt: '开拍 RALLY 手机横屏羽毛球比赛画面', caption: '游戏实机画面' },
        play: 'https://zcinta0514.github.io/rally-badminton/',
        code: 'https://github.com/zcinta0514/rally-badminton',
        story: [
          { n: '01', name: '念头从哪来', text: '空闲时也想找款羽毛球游戏过过瘾。试了几款，有的是 2D，有的玩起来不太对胃口。与其继续找，索性试着做一个自己想玩的版本。' },
          { n: '02', name: '怎么折腾出来的', text: '我先找几个朋友聊过想法，再借助 AI 把初步设想落地。球场、人物和对打一点点搭起来，边试玩边调整，现在还在继续迭代。' },
          { n: '03', name: '现在怎么样', text: '上线近一周的累计玩家数。', metric: { value: '300+', label: '玩家' }, source: '本人提供 · 2026-09-14' },
        ],
      },
    },

    /* ── 每节导语 ──
       这一节要让读者看到什么。不写数字、不下结论，只交代读法。
       四条长度刻意不同，避免四节又长成同一套模具。 */
    sections: {
      works: '按能做的事分成四块：短视频、视觉创意、内容规划与外包协作、长文。每块旁边写清目标、我负责的和具体怎么实现的。',
      capability: '下面这四条不是我说的，是上面那些作品证明的。',
      experience: '从赛事现场、体育社区和海外社媒，到心动的 AI 工作流与视频制作。持续把内容想法变成具体作品。',
      practice: '没人要求我做的部分。',
    },

    contact: {
      heading: '来找我聊聊',
      lead: '内容策划、海外社媒与社区运营。关于作品、项目经历或岗位机会，欢迎联系。',
      email: '2228144556@qq.com',
      phone: '17857994564',
      phoneDisplay: '178 5799 4564',
      github: 'zcinta0514',
      githubUrl: 'https://github.com/zcinta0514',
      resume: { src: 'assets/resume-zhou-xingyun.pdf', name: '周性运_27届硕士_简历.pdf', note: '更新于 2026-09-25 · 558 KB' },
    },
  };

  /* 数据核对辅助：所有百分比都由原始数字现算，不写死 */
  window.SITE.tiktok.works.forEach(function (w) {
    w.rate = +(w.likes / w.views * 100).toFixed(1);
  });
}());
