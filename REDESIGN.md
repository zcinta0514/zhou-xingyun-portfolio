# 改版方向 / REDESIGN

> 工作文档。记录 2026-09-25 的现状诊断、参考坐标与待定方向。
> 状态：**待拍板**（方向、基调、授权范围三项未定）

---

## 一、现状诊断

### 1.1 客观体量

| 项 | 实测 |
| --- | --- |
| 页面总高 | 8704px（1440 宽下约 9.7 屏） |
| 各章高度 | 首页 900 / 经历 1065 / 能力 939 / 作品 3000+ / 账号 1199 / 联系 587 |
| 正文量 | 约 3200 字，其中「精选作品」一章占约 1900 字 |
| 依赖 | 0 个第三方库，7 份 CSS + 6 个脚本，无构建 |
| 滚动驱动动效 | **1 处**（projects.css 的 `animation-timeline: view()`，只动 opacity） |
| `backdrop-filter` | 15 处（blur 8–25px） |
| 硬编码近似色 | 主绿 ≥12 个值、次级正文灰 7 个值 |
| 圆角取值 | ≥23 个；过渡时长 16 个；标题 clamp 公式 5 套 |

### 1.2 六个真问题（按影响排序）

**① 整页视觉是"均匀的灰"，没有起伏。**
除了 Instagram 海报和两张浅色截图，整页没有第三档明暗。深底 + 低对比正文（`#9eaea4` 级）叠加 15 处玻璃模糊，眯眼测试直接失败：所有东西糊成一片。**这是"单调"的第一来源，不是缺动效。**

**② 六个章节用同一套模具。**
`小号英文 eyebrow → 大标题 → 一段说明 → 网格/卡片`，六次重复。锚点：`base.css:42-43`、`profile.css:176`、`capability.css:165`、`projects.css:262`。章节之间只有 56px margin，没有紧松对比，没有停顿。

**③ 最强的证据埋在第四屏之后。**
`1.6M 播放`、`571,226 阅读`、`300+ 玩家`、`19.6K 粉丝` 全部在首页之后。首屏是四段散文 + 两个 CTA。HR 首屏看不到任何战绩。

**④ 滚动时画面几乎不变。**
全站只有一处滚动动效。滚动 = 平移，没有叙事。

**⑤ 能力章（atlas）是自说自话的装饰。**
轨道圆 + 中心菱形 + 四个浮空卡片，与"我能做什么"没有信息关系，占掉一整屏，还和作品章 1:1 重复表达。

**⑥ 内容重复 + 数据口径重复。**
学历讲 3 次（首屏 / 简介 / 学历卡）；`本人提供，2026-08-12` 一类口径出现 4 次。

### 1.3 更关键的一点：AI 页面识别符号过载

现有页面命中了大量「AI 生成页面」的典型符号。这类符号单看无害，叠加起来会让页面**看起来像模板而不像作品**——对一个求职作品集来说这是真实损失：

| 命中项 | 出现位置 |
| --- | --- |
| 每一章都有一条英文 eyebrow | 全部 6 章 |
| 章节编号 `01 / 06`、`PROFILE / 01` | 顶栏 + 右侧 rail + 目录面板 |
| 滚动提示 `SCROLL · 01—04`、`↓` | 各章顶栏、两个 CTA 按钮 |
| 玻璃拟态当装饰（而非特定效果） | 15 处 backdrop-filter、`glass-link` |
| 三列等宽卡片网格 | 三段实习（`profile.css` 的 `track-v3`） |
| 左大标题 + 右说明浮动的分栏头 | 作品章多处 |
| 同款布局重复出现 | 六章同模具 |

参考标准：`scroll-craft` 的 refuse list（见 §三）。

### 1.4 技术债（改版时顺手清掉）

- **死 CSS 约 350 行**：`base.css:51-94`、`profile.css:1-17`、`capability.css:1-14` 大量类名在 HTML 中已不存在；`works.css:307-470` 是 `navigation.css` 的整段副本。
- **同一意图的多套断点**：900 / 920 / 980 三种并存。
- **字体声明与事实不符**：多处声明 `Inter`，但 `assets/fonts` 里并没有 Inter，实际静默回退到 Segoe UI / 雅黑。
- **右栏 rail 的 rAF 常驻**：`rail.js` 无限自循环且无 `visibilitychange` / `IntersectionObserver` 退出，而移动端 rail 已被 `display:none`，等于纯浪费。
- **图片全是 PNG**，无 `srcset` / AVIF / WebP；`<img>` 多数缺 `width`/`height`（CLS 风险）。
- **PDF 模式是隐藏地雷**：`?pdf=1` 由 headless Chrome 截帧，任何依赖滚动位置或延迟初始化的动效都可能被抓到中间态。

---

## 二、参考坐标（GitHub 开源项目，星标为 2026-09-25 实测）

### 2.1 直接决定方法论的

| 项目 | 星 | 许可 | 看什么 |
| --- | --- | --- | --- |
| [nateherkai/scroll-craft](https://github.com/nateherkai/scroll-craft) | 2750 | MIT | **先读这个。** 一整套"高级滚动站"的设计标准：情绪曲线、单峰值工程、拒绝清单、排版/间距/色彩硬门槛，外加一套引擎与无头浏览器校验脚本（可测"无效滚动""对比度不达标""文字永远半透明"） |
| [argyleink/transition.css](https://github.com/argyleink/transition.css) | 2024 | Apache-2.0 | 46 个即插即用 CSS 过渡，`transition-style="in:wipe:up"` 一个属性搞定，零构建可直用 |
| [iDev-Games/Trig-JS](https://github.com/iDev-Games/Trig-JS) | 170 | MIT | 零依赖、把元素位置写成 CSS 变量（`--trig` / `--trig-px` / `--trig-deg`），动效完全在 CSS 里写。最贴合本项目的零构建约束 |
| [codrops/OnScrollTypographyAnimations](https://github.com/codrops/OnScrollTypographyAnimations) | 343 | MIT | 滚动驱动的排版揭示（本项目"文字墙"的直接解法） |
| [codrops/TextRepetitionEffect](https://github.com/codrops/TextRepetitionEffect) | 114 | MIT | 大字重复滚动的章间过渡 |
| [barvian/CodropsCarousels](https://github.com/barvian/CodropsCarousels) | 100 | — | 纯 CSS 滚动驱动轮播（作品画廊的候选实现） |

### 2.2 结构与叙事参考

| 项目 | 星 | 许可 | 看什么 |
| --- | --- | --- | --- |
| [HamishMW/portfolio](https://github.com/HamishMW/portfolio) | 3544 | MIT | 顶级作品集的章节节奏与滚动编排（React + three.js，看结构不看技术） |
| [albinotonnina/albinotonnina.com](https://github.com/albinotonnina/albinotonnina.com) | 2812 | — | 交互叙事型个人站，滚动即故事 |
| [Musab-Hassan/musabhassan.com](https://github.com/Musab-Hassan/musabhassan.com) | 221 | MPL-2.0 | Awwwards 上榜作品集完整源码 |
| [codrops/ScrollingLettersAnimation](https://github.com/codrops/ScrollingLettersAnimation) | 229 | — | 固定元素随滚动切换标题 |
| [Ladvace/astro-bento-portfolio](https://github.com/Ladvace/astro-bento-portfolio) | 386 | MIT | Bento 布局的极简作品集，密度控制好 |
| [Evavic44/portfolio-ideas](https://github.com/Evavic44/portfolio-ideas) | 6343 | MIT | 作品集灵感合集（带截图，适合挑参考站点） |

### 2.3 已核实的技术事实

| 事实 | 数据来源 |
| --- | --- |
| CSS Scroll-driven Animations：Chrome 115+、**Safari 26+** 已支持；Firefox 仍为 preview | MDN browser-compat-data：`animation-timeline` / `animation-range` |
| View Transitions（同文档）：Chrome 155+ / Safari 27.1+ / Firefox 157+ 全绿 | caniuse |
| **GSAP 现已完全免费**（含商用；前提是终端用户不付费使用） | gsap.com/standard-license |
| 体积（gzip）：Lenis 5.3KB（MIT）、GSAP 26.7KB、anime.js 39.3KB、motion 46.6KB、three 180.6KB | bundlephobia / npm registry |

**结论**：本项目要的滚动叙事，**原生 CSS 就能覆盖大部分**，且 Safari 已不再是阻断项。Firefox 桌面端会退化为静态版（可接受，属安全降级）。GSAP 只在需要"精确编排 / pin / Flip"时才引，且已无授权顾虑。

---

## 三、诊断方法：借用 scroll-craft 的硬门槛

以下不是我的品味，是一份可核验的清单。当前站点的命中情况已标注：

| 门槛 | 现站 |
| --- | --- |
| 章节间距要有"紧—松"对比，不能一把尺子 | ✗ 全站 56px |
| 标题上方留白 > 下方留白 | 部分 ✗ |
| 正文行宽 45–75ch | 部分 ✗（`#profile` 段落到 98% 宽） |
| 深色底上的浅色字要三轴补偿（行高 / 字距 / 字重各加一档） | ✗ 未做，故显"发虚" |
| 次级文字要"染色"，不能用纯灰 | ✗ 7 个纯灰值 |
| 不用纯黑 | ✓ `#080f0c` |
| 色彩六角色 + 一个强调色，全站锁定 | 部分 ✗（绿紫双强调且绿有 12 个近似值） |
| 深度用五件套（偏移阴影 / 边缘高光 / 缩放模糊 / 叠压 / 颗粒），而非一种 | ✗ 只有玻璃模糊，无颗粒、无叠压、无边缘高光 |
| 只有一个工程化的**峰值**（三个峰值 = 没有峰值） | ✗ 全章等权，无峰值 |
| 峰值前要有"静默" | ✗ |
| 结尾必须"收住"，不能拖进 footer | 部分 ✓（联系章是全站最强的一屏） |
| 只用 transform / opacity（wipe 可用 clip-path），禁止 `transition: all` | ✗ `profile.css` 有 4 处无属性名过渡 |
| 缓动不用 `ease-in`；UI 过渡 <300ms | 部分 ✗ |
| 禁止 `scale(0)` 入场 | ✓ |
| reduced-motion = **更少更轻**，而非全部归零 | ✗ 现为全局 `0.01ms` 熔断 |
| 章间至少 3 节才出现一条 eyebrow | ✗ 每节都有 |
| 不用 `01 / 06` 章节编号（除非序号本身是信息） | ✗ |
| 不用滚动提示（"scroll" / "↓"） | ✗ |
| 玻璃与模糊只在特定效果下用 | ✗ 15 处 |
| 不用自定义光标 | 建议遵守 |
| 不编造数据 | ✓ 全站数据都带来源与日期，这是本站最大优点 |

---

## 四、待定方向（三个打包方案）

### 方向 A：「章制编辑体 + 一个峰值」← 我的推荐

**核心主张**：不追求"更炫"，追求**起伏、证据、识别度**。

- **页面语法**：章制编辑体。六章压到五章（删掉能力章，其内容并入作品），每章语法不同：人物访谈 → 时间线 → 全屏作品峰值 → 账号与实验 → 收口。
- **视觉起伏**：整页从"均匀的灰"改成三段明暗。深（人物）→ 中（经历）→ **全屏浅色峰值（代表作）** → 回深（账号 / 联系）。用一个亮色章节制造硬切，这是最低成本、最高识别度的做法。
- **定义的峰值**：滚到 TikTok 代表作时，底色由深硬切为浅，`1.6M` 从 0 滚上去，主画面以 clip-path 自下而上揭开，其余内容静默。峰值前留一屏近乎空白作为"静默"。
- **首屏加证据条**：1.6M 播放 / 571K 阅读 / 300+ 玩家 / 19.6K 粉丝，四个真实数字。
- **动效主线只留 4 条**：滚动揭示（标题遮罩擦除 + 段落逐行）、章节进度（右栏 rail 升级为 SVG 描边 + 真实进度）、峰值章（计数 + 揭开）、画廊切换（View Transitions 共享元素过渡）。
- **删除清单**：atlas 能力图、每节 eyebrow、`01/06` 编号、`SCROLL` 提示、玻璃装饰、三列等宽卡片、白色证件照（改深底抠像或干脆不用）。
- **技术**：0 新增依赖（原生 CSS scroll-driven + IntersectionObserver + View Transitions）。GSAP 只在峰值编排需要时引。
- **成本**：中。**风险**：低。**辨识度**：中高。

### 方向 B：「沉浸叙事」

**核心主张**：加一层 WebGL / canvas，把"从内容运营到 AI 项目"做成可滚动的连续世界。

- **页面语法**：电影式一镜到底或连续世界。
- **动效**：GSAP + ScrollTrigger 编排 + 一层 canvas（颗粒 / 粒子 / 位移贴图 / 生成艺术背景），背景随滚动变形，指针移动改变环境。
- **成本**：高。**风险**：高——与本页 15 处 backdrop-filter 叠加会拖垮低端机；PDF 导出模式必须整体禁用；Firefox 与低端安卓需要单独降级路径。
- **适合**：想立"创意技术"人设。与"内容运营 / 海外社媒"的求职定位有偏差，可能放大技术感、稀释内容感。
- **参考**：[HamishMW/portfolio](https://github.com/HamishMW/portfolio)、[bizarro/bizar.ro](https://github.com/bizarro/bizar.ro)、[olivierlarose/awwwards-landing-page](https://github.com/olivierlarose/awwwards-landing-page)

### 方向 C：「证据仪表盘」

**核心主张**：把求职作品集当数据产品做，用可视化把"内容运营"变成可读的战绩。

- **页面语法**：节奏切分 + 数据可视化。
- **峰值**：一张交互式「作品表现图」——6 条 TikTok 的播放 / 点赞做成可 hover 的散点或条形，悬停出缩略图与选题类型；虎扑两篇阅读量对比；RALLY 的玩家曲线。
- **动效**：数字计数、图表随滚动生长、hover 联动高亮。全部手写 SVG，0 依赖。
- **成本**：中高（数据处理与信息设计的工作量大于动效）。**风险**：中——数据点太少（6 条视频、2 篇文章）时图表会显得空。
- **优势**：人设极其突出，别人抄不走。可与 A 叠加（作为 A 的峰值章）。

---

## 五、我的建议

**选 A，把 C 的「作品表现图」并进 A 的峰值章；B 暂不做。**

理由三条：

1. 现在的问题不是"不够炫"，是**平、灰、没有证据**。这个判断有截图与代码双重证据：全站 1 处滚动动效、0 处明暗起伏、最强的数字在第 4 屏之后。这种情况下先加 WebGL，等于给一份平铺的文档加抖动。
2. 方向 A 的每一项收益都不依赖新依赖，改完仍是零构建静态站，**没有回不去的技术债**。B 会同时引入新依赖 + 性能风险 + PDF 导出地雷。
3. 「把最强的证据变成峰值」这件事，对**内容运营求职**的收益远大于"展示我会写 WebGL"。而且 A 里那一屏浅色硬切本身就足够高级——它靠的是对比和克制，不是特效。

**执行顺序建议**（每步都能单独上线，可随时停）：

1. **立设计令牌**：一份 `tokens.css` 收口颜色 / 字号 / 间距 / 圆角 / 时长 / 缓动；清掉约 350 行死 CSS；修掉 Inter 缺失。
2. **提对比度 + 加颗粒**：正文提亮一档，次级文字改为染色灰，加 4–5% 颗粒层，玻璃从 15 处砍到 ≤3 处。**这一步不改结构、不加动效，但观感变化最大。**
3. **重构章节**：删能力章、首屏加证据条、作品分"精选 3 件 + 更多"、口径脚注收口到一处。
4. **落峰值章**：暗→亮硬切 + 计数 + 揭开 + 静默前奏。
5. **铺动效**：滚动揭示、右栏描边进度、画廊 View Transitions 过渡。
6. **收口**：reduced-motion 改为"更少更轻"、图片转 AVIF/WebP + srcset、rail rAF 加退出、PDF 模式回归测试。

---

## 六、可交互原型

已按三个方向各做一个可跑的原型，放在 `demo/`，直接双击打开即可（零依赖、不需服务器）：

| 文件 | 方向 | 看什么 |
| --- | --- | --- |
| `demo/a.html` | A 章制编辑体 + 一个峰值 | 首屏证据条（数字滚动）→ 静默段 → **深色硬切骨白峰值**（底色擦除、1.6M 计数、主图自下揭开）→ 收口 |
| `demo/b.html` | B 沉浸叙事 | 手写 canvas 粒子场，响应指针与滚动速度；滚动打钉的三段舞台；卡片向外展开 |
| `demo/c.html` | C 证据仪表盘 | 六条作品的播放量 × 互动率散点图，hover / 键盘可选中并联动详情；虎扑阅读量对比 |
| `demo/shots/` | — | 上面三个原型在 1440×900 下的实拍截图 |

三者都用了真实素材与真实数据，沿用现有字体令牌；A 与 C 是零新增依赖。

### 6.1 实施踩坑记录

**`clip-path` 会让元素自身的 IntersectionObserver 判定为 0 面积。**

实测：`clip-path: inset(100% 0 0 0)` 的元素，即使几何上占满视口，`intersectionRatio` 也返回 `0.000`，`isIntersecting` 为 `false`。

后果：任何“初始被完全裁切、靠进入视口再显示”的元素，**永远等不到自己的揭示回调**，形成死锁。改版里大量用 clip-path 做擦除，一定会踩到。

解法：用一个**不被裁切的哨兵元素**（外层 wrapper）承担观察职责，再把状态类作用到被裁切的后代上：

```html
<div class="peak-trigger"><section class="peak">…</section></div>
```
```css
.peak { clip-path: inset(100% 0 0 0); transition: clip-path 1.15s var(--ease) }
.peak-trigger.in .peak { clip-path: inset(0) }
```

（`demo/a.html` 已按此实现。）

### 6.2 已核实的参考站点

全部实测可访问（2026-09-25）：

**工艺与细节**（最值得先看的两组）
- <https://rauno.me> · <https://rauno.me/craft> — 交互细节的教科书，站上还挂着可直接读的 craft 文档
- <https://emilkowal.ski> — 动效与缓动的具体做法，偏“为什么这样做”（含纯 CSS 硬核演示）
- <https://paco.me> — 极简+克制，面向内容的人也能用

**编辑/内容感**
- <https://transition.style> — 46 个 CSS 过渡的可视化预览，可一个个试
- <https://tympanus.net/Development/OnScrollTypographyAnimations/> — 滚动排版捺开
- <https://tympanus.net/Development/TextRepetitionEffect/> — 大字重复的章间过渡
- <https://tympanus.net/Development/OnScrollColumnsRows/> — 列/行的滚动编排
- <https://idev-games.github.io/Trig-JS/> — 零依赖，位置写成 CSS 变量的滚动动效

**沉浸叙事**
- <https://bruno-simon.com> — WebGL 个人站的业界天花板
- <https://bizar.ro> — 转场与空间感
- <https://albinotonnina.com> — 滚动即故事
- <https://www.hamishw.com> — 作品集结构与章节节奏

**商业/创作者参考**
- <https://www.nateherk.com> — 亮调创作者作品集，数字前置
- <https://aiautomationsociety.ai> — 暗调编辑体，一个数字撑起整句承诺
- <https://musabhassan.com> — Awwwards 上榜作品集完整实现

**灵感库**（不是单站，用来挑参考）
- <https://www.awwwards.com/websites/personal/>
- <https://godly.website>

---

## 六、三个方向的完整初版（已交付）

三个方向的**完整页面**已全部建成，入口：

```
open /Users/xindong/Documents/个人网站/versions/index.html
```

这个页面对比链接三个版本，每版说明语法、峰值、动效与成本。整页截图在 `versions/shots/`。

### 6.1 共享底座（三个版本跑同一份事实）

| 文件 | 作用 |
| --- | --- |
| `versions/shared/base.css` | 令牌层：六角色 + 一个强调色、4px 基准间距、7 级字号、行高/字距/字重三轴补偿、深度五件套、颗粒、浏览器自带表面上色 |
| `versions/shared/content.js` | 全站唯一事实来源。三个版本共用，**保证同一件事说法一致、数字一致、口径一致** |
| `versions/shared/motion.js` | 动效原语：单一 rAF 时钟、揭示、计数、进度、可暂停循环。内建 clip-path 哨兵机制 |

这样做的目的：差异只留在设计与叙事本身，对比才是有效的。

### 6.2 三版客观对照（自动体检，1440px 与 390px 各跑一遍）

| 指标 | A 章制编辑体 | B 沉浸叙事 | C 证据仪表盘 |
| --- | --- | --- | --- |
| 页面总高（1440px） | 12375px | 15857px | 6969px |
| 第三方依赖 | 0 | 0 | 0 |
| 对比度不达标文字 | 0 | 0 | 0 |
| 横向溢出 | 0 | 0 | 0 |
| `<11px` 小字 | 0 | 0 | 0 |
| `transition: all` / `ease-in` | 0 / 0 | 0 / 0 | 0 / 0 |
| 标题层级跳级 | 0 | 0 | 0 |
| 无名可交互元素 | 0 | 0 | 0 |
| `?flat=1` 降级态完整性 | 完整 | 完整 | 完整 |

三版均无纯灰次级文字、无纯黑、无 `01/06` 章节计数器、无滚动提示、无自定义光标。

### 6.3 实施踩坑记录

**① `clip-path` 会让元素自身的 IntersectionObserver 判定为 0 面积。**

实测：`clip-path: inset(100% 0 0 0)` 的元素，即使几何上占满视口，`intersectionRatio` 也返回 `0.000`。

后果：任何“初始被完全裁切、靠进入视口再显示”的元素，**永远等不到自己的揭示回调**，形成死锁。改版里大量用 clip-path 做擦除，一定会踩到。

解法：用一个**不被裁切的哨兵元素**承担观察职责。三个版本的擦除效果全部走这个机制（`data-watch` 属性）：

```html
<div class="peak-trigger"><section class="peak" data-watch="#peak-trigger">…</section></div>
```
```css
.peak { clip-path: inset(100% 0 0 0); transition: clip-path 1.15s var(--ease-soft) }
.peak-trigger.in .peak { clip-path: inset(0) }
```

**② 本地 Python 静态服务器会偶发 `ERR_CONNECTION_RESET`。**

现象：`content.js` 加载失败 → 页面只剩空壳 → 截图全是黑屏，看起来像代码写坏了。实际是服务端问题。换成自写的 Node 静态服务器后稳定（`/tmp/serve.mjs`）。**以后测页面一律不用 `python3 -m http.server`。**

**③ 深底上的四级文字不能再压暗。**

`--ink-faint` 原本取 `#5D6E65`，在 `--ground` 上只有 3.57:1，12px 小字全部不达标；这也解释了原站为何“发虚”。已拉到 `#74887C`（底色 5.1:1、浮起面 4.9:1）。**深色底上的小字需要更多对比，不是更少。**

**④ 快滚会让 Chrome 跳过懒加载。**

自动化截图快速扫过整页时，个别 `loading="lazy"` 的图不会发起请求，看起来像破图。手动滚到位置就正常。**测速时不要把懒加载当成缺陷。**

### 6.4 一个被纠正的数据结论

初版原型里我写过“播放最高的那条不是互动率最高的”。**这句话是错的。**

TT5（三分王与街球传奇 1v1）播放 1.6M、互动率 6.5%，两项都是第一。真实情况是：

| 作品 | 播放 | 互动率 |
| --- | --- | --- |
| TT5 三分王与街球传奇 1v1 | 1,600,000 | 6.5% |
| TT2 Air Corgi 选择 Wemby 或 Brunson | 59,800 | 4.7% |
| TT1 SGA 判罚与 Wemby UFO | 15,500 | 3.3% |
| TT4 Herro 与 Bam：从队友到对手 | 4,221 | 2.7% |
| TT6 Bronny 登机与 LeBron 直升机 | 174,700 | 2.4% |
| TT3 Warriors 球员阵容话题 | 11,200 | 1.6% |

站得住的版本是：互动率**最低**的是唯一的纯资讯选题（TT3 1.6%）；对抗关系题材普遍高于均值（均值 3.5%）。但 TT6 播放第二高却只有 2.4%、TT4 播放最低却有 2.7%，说明**题材不是唯一变量**，六条样本也太小，不能推成“方法论”。三个版本已按修正后的口径写。

---

## 七、待你拍板

| 决策 | 选项 |
| --- | --- |
| 方向 | A 章制编辑体 / B 沉浸叙事 / C 证据仪表盘 / A+C |
| 视觉基调 | 保持深绿黑 / 加入一屏浅色硬切峰值 / 整体转浅色纸感 |
| 授权 | 内容结构可大幅增删（推荐）/ 只增不删 / 先出细化方案再定 |
