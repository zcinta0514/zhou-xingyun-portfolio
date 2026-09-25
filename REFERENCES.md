# 参考站台集 / REFERENCES

> 全部 URL 于 2026-09-25 用 curl 实测（Chrome UA、跟随跳转、15–20s 超时），标注状态码与页面标题。
> `403 / 429 / 000` = 被 CDN 拦截或连不上，**不等于站点不存在**，浏览器通常可正常打开。

---

## 概念一 · 球探报告 / 运动员档案

**结论：这个形式有大量现成范式，但没有「个人网站写成球探报告」的成熟先例。最近的只有两个（Nick Ho、数据肖像）。这是差异化机会，不是死路。**

| URL | 实测 | 看什么 |
| --- | --- | --- |
| https://baseballsavant.mlb.com/savant-player/shohei-ohtani-660271 | 200 | **最重要的一站。** MLB 官方球员页：百分位横条就是现成的「球探评分」语言，配上击球数据和视频片段，三项全中 |
| https://www.tankathon.com/players/victor-wembanyama | 200 | 选秀档案页：体测 + 优势 + 球员对比 + 预测顺位。这就是「新秀档案」的标准结构 |
| https://www.playerprofiler.com/nfl/justin-jefferson/ | 200 | Athleticism Score（体测评分）+ **Best Comparable Player（同类对比）**，可直接搬 |
| https://www.nfl.com/prospects/bo-nix/32004345-4c41-9909-4cfa-9970c23f0c5a | 200 | NFL 官方新秀体测库，官方口径的「待选秀新秀页」 |
| https://nickho-motorsports.nl/ | 200 | **概念一落到个人网站的真实先例：**首屏直接是 98 号车 / 17 个领奖台 / 14 条赛道 |
| https://wc26.bogachev.fr/ | 200 | 世界杯「数据肖像」项目，把球员转成可视化档案，视觉可直接抄 |
| https://www.fut.gg/ | 200 | FUT 卡面数据库：一张卡＝分项评分 + 总评 |

被 Cloudflare 拦住但真实存在（浏览器可开）：Basketball-Reference、NBA.com、MLB.com、ESPN、NBADraft.net、NFLDraftBuzz、Spotrac、Transfermarkt（202 挑战页）。

---

## 概念二 · 球星卡收藏册

**结论：找得到，而且比预想丰富。但真正的「翻页卡册」交互几乎没人做到位——商业站都在做「卡 + 数据面板」。翻页册是可差异化的部分。抄 Scryfall 的信息层级 + poke-holo 的卡面材质，自己加翻页。**

| URL | 实测 | 看什么 |
| --- | --- | --- |
| https://scryfall.com/card/2x2/117/lightning-bolt | 200 | **信息层级范本。**一张卡一个页面：正面卡图 + 背面式数据面板（稀有度 / 系列 / 价格 / 赛制合法性） |
| https://poke-holo.simey.me/ | 200 | **卡面材质范本。**开源的全息闪光 + 3D 倾斜卡面效果（仓库 8,232★） |
| https://alt.xyz | 200 | 评级体育卡交易：估值曲线 + 评级人口分布，就是「这张卡为什么值钱」的数据面板 |
| https://nbatopshot.com | 200 | NBA 官方数字球星卡：卡＝一个比赛瞬间，稀有度＝限量序列号，与「稀有度对应真实播放量」同构 |
| https://sorare.com | 200 | 球员卡正面图像 + 背面赛季数据 |
| https://goldin.co | 200 | 高端藏品拍卖：单卡成交历史数据面板 |
| https://www.cardbase.io | 200 | 卡牌收藏册的产品化范本 |

开源：`simeydotme/pokemon-cards-css` **8,232★**（卡面全息效果，最值得抄的一套）· `PokemonTCG/pokemon-tcg-data` 872★

---

## 概念三 · 账号即网站 / 垂直信息流

**结论：风险最高。垂直卡流在 app 式年度报告和 Web Stories 里成熟，但那是消费型内容；求职站的访客是招聘方，滑 12 张卡很难快速看完简历。**

| URL | 实测 | 看什么 |
| --- | --- | --- |
| https://www.nalakun.com/ | 200 | **最贴的一个：**非程序员作品集，实测命中 `scroll-snap-type` + Swiper + 竖向橡皮筋，把「一屏一作品」做成整站 |
| https://artsandculture.google.com/story/BwWBFnmqKgbuhQ | 200 | Google 艺术文化的展览导览，实测有 Google 自己的垂直翻页组件（snapper），移动端手感标杆 |
| https://wrapup.playstation.com/ | 200 | 索尼年度报告：一屏一个数据，上下翻。商业大厂的成熟做法 |
| https://trends.google.com/trends/yis/2025/GLOBAL/ | 200 | Google 年度热搜，垂直翻页的数据叙事 |
| https://www.nike.com/launch | 200 | Nike 发售日历，球鞋卡片流，最接近「一屏一件作品」|
| https://www.indiatoday.in/visualstories/entertainment/5-dark-comedy-films-on-netflix-you-need-to-watch-269958-16-12-2025 | 200 | AMP Web Stories 标准（一卡一屏），实测命中 `<amp-story>` 标签 |

开源：`nolimits4web/swiper` **41,902★**（竖向 + scroll-snap 首选）· `zyronon/douyin` **11,543★**（Vue3 仿抖音竖屏流，最接近的成品）· `alvarotrigo/fullPage.js` 35,384★

---

## 概念四 · 编辑部中控台

**结论：参照物是「真实后台 demo」而不是个人站——说明这个形式本身不新鲜。做它的成败取决于内容是否真像运营数据（粉丝增长、发文节奏、爆款复盘）。**

| URL | 实测 | 看什么 |
| --- | --- | --- |
| https://playground.wordpress.net/ | 200 | 浏览器里跑真的 wp-admin：左栏栏目树 + 文章列表 + 编辑器，编辑部后台本体 |
| https://demo.ghost.io/ghost/ | 200 | Ghost 后台 demo，左导航（内容 / 成员 / 分析）+ 内容列表 |
| https://plausible.io/plausible.io | 200 | 把自家的流量后台公开直播：指标卡 + 趋势图 + Top Pages，整站就是后台布局 |
| https://play.grafana.org/ | 200 | 实时数据中控台，70+ 仪表盘，「数据面板」那一栏的终局形态 |
| https://demo.nocodb.com/ | 200 | 表格 + 看板双视图，可直接当「内容库」 |
| https://dustinbrett.com/ | 200 | daedalOS：个人网站做成整台桌面操作系统，可用先例 |
| https://buffer.com/ · https://www.later.com/ · https://www.metricool.com/ | 200 | **直接对应你的求职方向：**海外社媒运营工具，首页即展示内容日历 / 排期 UI |
| https://chartbeat.com/ | 200 | 新闻编辑室的实时数据大屏，最贴「编辑部」这三个字 |

开源：`shadcn-ui/ui` 125k（dashboard 示例）· `grafana/grafana` 77k · `nocodb/nocodb` 65k · `TryGhost/Ghost` 55k · `tabler/tabler` 42k · `ant-design/ant-design-pro` 39k · `refinedev/refine` 36k · `plausible/analytics` 29k

---

## 概念五 · 可玩的工作流

**结论：「输入 → 数据反馈」的最佳原型是数据新闻，不是游戏站。Pudding 那支让人交出真实数据换回一句刻薄评价，正是「选题→角度→封面→时机」关卡该有的手感。**

| URL | 实测 | 看什么 |
| --- | --- | --- |
| https://ncase.me/trust/ | 200 | **机制标准答案。**每回合点「合作 / 欺骗」，和不同策略 AI 打囚徒困境，累积曲线实时长出来（开源 6,297★） |
| https://ncase.me/ballot/ | 200 | 「切换制度 → 看结果翻转」的最短实现：一页里同时有滑块、切换器和结果可视化（开源 222★） |
| https://ncase.me/polygons/ | 200 | 拖滑块调参数，看隔离如何自发涌现（开源 1,358★） |
| https://pudding.cool/2020/12/judge-my-spotify/ | 200 | **概念五的机制原型：**交出真实数据，换回一句刻薄点评 |
| https://playground.tensorflow.org/ | 200 | 增删隐藏层 / 换激活函数 / 点训练，决策边界实时重画（13,032★） |
| https://flexboxfroggy.com | 200 | 一行代码＝青蛙动一格。「知识即操作」的教科书 |
| https://sandspiel.club | 200 | 画火就有火、画水就灭火。作品可存档、可被 fork 继续改 |
| https://ig.ft.com/coronavirus-chart/ | 200 | 下拉选国家，整张图表全量重绘 |
| https://ciechanow.ski/gears/ | 200 | 可拖拽旋转的机械解释图，15 篇文章全部实测 200 |

`neal.fun` 主站 200，但所有子页被 Cloudflare 拦（403）——浏览器可开，别用 curl 判断。

---

## 通用 · 工艺上限（不论选哪个概念都该看）

| URL | 实测 | 「贵」在哪里（具体到技法） |
| --- | --- | --- |
| https://obys.agency | 200 | 自绘字体 + **逐行文字遮罩上推**（`overflow:hidden` + `translateY(102%)`）+ 带百分比的预载 + 可切 Vertical / Horizontal / Grid 三种浏览模式 |
| https://locomotive.ca | 200 | **每个项目切换整站强调色**（用 `html[data-theme]`）+ 统一缓动 `cubic-bezier(.215,.61,.355,1)` |
| https://garden-eight.com | 200 | 大量留白 + 极细分隔线 + 光标跟随，日式克制的工程精度 |
| https://family.co | 200 | 极慢的缓动曲线 + 大圆角，**把「慢」做成品牌识别** |
| https://noho.ink | 200 | 家具站的 Explore in 3D + 暗黑模式 + 减少动效开关（页内写明可省 35% 电量） |
| https://radio.garden | 200 | 整套 token 系统（z-index / 尺寸 / 字号全变量）+ `data-increased-contrast` 无障碍模式。**贵在动效之外还有可访问性预算** |
| https://www.kokuyo.co.jp | 200 | 日文竖排 / 横排混排的数位排版控制，企业站做出杂志感 |
| https://gilhuybrecht.com | 200 | 图集式排版：每个项目按 1 2 3 4 5 分页横滑，索引与详情共用同一网格 |
| https://leoparpeix.com/ | 200 | 个人站却用工作室级的大字号排版 + 逐案视觉编码 |
| https://www.daylightcomputer.com | 200 | 暖色调色板 + 纸张质感贯穿全站，产品摄影与 UI 用同一套色彩系统 |

其余实测 200 存量：`rauno.me` · `paco.me` · `emilkowal.ski` · `henry.codes` · `luruke.com` · `mattdesl.com` · `ayamflow.fr` · `cassie.codes` · `frankchimero.com` · `cabel.com` · `craigmod.com` · `maggieappleton.com` · `joshwcomeau.com` · `jhey.dev` · `raycast.com` · `linear.app` · `stripe.com` · `basement.studio` · `merci-michel.com` · `immersive-g.com` · `darkroom.engineering` · `lusion.co` · `activetheory.net`

**连不上，勿用**：`rleonardi.com`、`cabbibo.com`、`variable.io`、`monopo.co`

**Awwwards 站点日榜可以正则抓真实外链**：`https://www.awwwards.com/websites/sites_of_the_day/` 返回 200，抓 `href="/sites/<slug>"` 得详情页，再逐个提外链域名。本次由此取到并实测 200 的：`illoca.com`、`thetiebreak.merci-michel.com`（体育向）、`www.trevornoah.com`、`white-desert.com`、`decathlonyestalgia.com`、`www.paulhtickets.com` 等一批。
