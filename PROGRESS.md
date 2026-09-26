# 进度与交接 / PROGRESS

> 最后更新 **2026-09-25**。下次开新对话先读这份，再读 `REDESIGN.md`（诊断与品味门槛）和 `REFERENCES.md`（参考站全清单）。
> **未部署。** 线上仍是旧站。

---

## 一句话现状

新首页的**首屏已经做好**（巨型楷体名字 + 黏土形象叠压 + 转头交互）；**作品章已改成四台翻阅装置**（转轮 / 翻书 / 抽屉柜 / 掀角，见第三节）；能力 / 经历 / 个人项目 / 联系四节的排版已成形，但还没按「叠压」语言收过。方向已定、技术链路已通、形象素材已就位。

> **未部署。** 线上仍是旧站。

---

## 一、目录地图（先搞清楚哪个是哪个）

| 路径 | 是什么 | 处理 |
| --- | --- | --- |
| **`site/`** | **新网站**：`index.html` / `style.css` / `main.js` / `figure.js` | ★ **一切新工作在这里** |
| **`assets/raw/`** | 新素材：`character/`（黏土形象）· `photo/`（人物照）· `works/` · `video/` · `proof/` | 保留 |
| **`tools/`** | 开发工具：`serve.mjs`（静态服务器）· `shoot.mjs`（截图自检，PLAN 支持 `js` 字段）· `record.mjs`（**录屏自检**，CDP 抓帧 + ffmpeg 合成 mp4） | 保留 |
| `demo/` | 各种实验页：`a|b|c.html`（已废弃方向）· `clay.html`（手写 WebGL 版）· `figure.html`（形象组件原型）· `font-compare.html` · `name-compare.html`；`demo/shots/` 放录屏 | 可留可删 |
| `versions/` | **【已废弃】** 三个方向初版（章制编辑体 / 沉浸叙事 / 证据仪表盘） | **可删** |
| `index.html` + `styles/` + `scripts/` | **【旧站】** 线上正在跑的版本 | **暂不要动**，等新站确定后再替换 |
| `REDESIGN.md` | 诊断、三站逆向、品味门槛、refuse list | 仍有价值 |
| `REFERENCES.md` | 40+ 参考站，全部 curl 实测过状态码 | 仍有价值 |

---

## 二、已定的决策（不要重新讨论，除非用户主动推翻）

### 视觉
- **浅暖中性**：底 `#EFEDE6` 骨白 / 字 `#1A1917` 近黑偏暖 / 次级 `#6B675E` 暖灰 / 强调 `#B4472A` 暖砖红（极少用）
- **彩色只留给作品**：页面本身几乎无彩；作品卡片默认灰度，悬停才恢复彩色（obys 手法，也是把风格散乱的素材归一的关键）
- 废弃原来的深绿黑。理由：黏土质感需要光，深色底上会发闷

### 参考站（用户亲自点名）
1. **https://obys.agency/work/ai-modernism-of-kharkiv** ← 用户口语里说成 "AI model … reason of car"
2. https://www.nalakun.com/
3. https://noho.ink

### 字体
- 名字：**霞鹜文楷 Medium**（楷体）。1476 字节内联子集（只有「周性运」三字 + `unicode-range`）
- 已试过并否决：苹方（无性格）· 思源宋体 600（偏硬朗）· 得意黑（斜体太有攻击性）· 朱雀仿宋（278px 下太细撑不住）
- 正文目前是系统黑体。**待定**：是否把标题也统一成楷体（正文建议保持黑体，楷体小字号可读性差）

### 形象
- AI 生成的**黏土半身像**（单色雕塑版）。用户原话：「首页是一个三维的立体形象，粘土那种，挺好的，不会太严肃」
- 实现方式：**多角度图集 + 光标横向插值**，不是真 3D
- 真 3D 版本（`demo/clay.html`，867 行手写 WebGL、零依赖）能跑但观感差，**不作为主方案**

### 技术
- **零构建、零依赖，必须能 `file://` 直接打开** → 不用 ES module、不用 fetch、不用 CDN
- 全部素材内联或相对路径引用

### 动效规则（严格遵守）
- 只用 `transform` / `opacity` / `clip-path`
- 两种缓动：`--ease-out: cubic-bezier(.22,1,.36,1)`、`--ease-expo: cubic-bezier(.16,1,.3,1)`
- 四档时长：160ms（悬停）/ 320ms（UI 状态）/ 700ms（卡片入场）/ 1000ms（首屏入场）
- 悬停弱、点击强，差一个数量级
- 每个入场**只播一次**
- 禁止：`transition: all`、`ease-in`、`scale(0)` 入场、每节 eyebrow、`01/06` 编号、`SCROLL` 提示、玻璃拟态、自定义光标、纯灰次级文字

---

## 三、核心设计语言：叠压

首屏重做时发现的一条原则，**其余五节都要照这个走**：

> **叠压（overlap）比放大更能制造纵深。**

最初的做法是「四个角各放一样东西」——名字（左上）、形象（正中）、定位语（右上）、数字（左下）。四个焦点互相抢，等于没有焦点。

改成：名字做成 278px 的巨型背景层，**黏土形象压在他自己的名字上**。纵深、主次、张力一次全出来。

中途试过「名字居中 + 形象居中」，结果「性」字被完全挡住、名字读不全，已废弃。**最终是名字靠左、形象偏右（`--fig-x: 66%`），叠压但读得完。**

---

## 三、作品章：四块 = 四台翻阅装置（2026-09-26 重构）

**不是“一个大网格装十六件”，也不是“每块换一种版式”。用户要的是每块一台不同的翻阅装置：** Browse 本身就是动效，一次只完整露出一个。

| 块 | 装置 | 机械动作 | 数量 |
| --- | --- | --- | --- |
| 短视频 | **转轮** `ring` | 六盘排成圆环（60°/盘），整圈绕 Y 轴转；正面那盘朝你，两侧斜着、后面转到背面自动消失 | 6 |
| 视觉创意 | **翻书** `book` | 海报页绕书脊（左边）转出去；过 90° 背面不可见，下面那页自然露出来 | 7 |
| 内容规划与外包协作 | **抽屉柜** `cabinet` | 三个把手，点哪个就从柜子里拉出哪一步；窗口高度固定，只动 translateX | 3 步 |
| 长文 | **掀角** `peel` | 报纸版面从右下角整张掀开（`rotate3d(-1,1,0,152deg)`），露出下一版 | 2 |

代码：`site/main.js` 的「2.6 翻阅装置」——外壳（计数 / 上一件 下一件 / 圆点 / 信息栏 / 键盘）四块共用：

```
viewers[块id]   每块一个
stageRing/stageBook/stagePeel   三种舞台，接口：init / begin / settle / finish
buildViewer(block, items, kind)
cabGo(cab, i)   抽屉柜单独一套
viewerKeys      焦点在 .viewer 里才接管 ←/→
```

每块的「目标 / 我负责的 / 怎么实现的」**全部取自 `content.js` 已有字段**（`brief` / `duties` / `role` / `credit` / `steps` / `tags`），没有新写事实。

录屏：`demo/shots/dev-{1-ring,2-book,3-cabinet,4-peel}.mp4`（用 `tools/record.mjs` 生成）。

### 写新舞台时必须知道的五条

1. **`clip-path` 不能下在被 IntersectionObserver 观察的元素上。** 裁到 0 面积 → `intersectionRatio` 恒为 0 → 永远等不到揭示回调，元素会永久隐形。裁 `.book-under` / `.card-media` / `.feat-media`，不要裁 `.viewer` / `.card` / `.feat`。
2. **入场动画不要抢 `transform`。** 舞台元素的 `transform` 常常是 JS 写的内联样式（转轮角度、翻页角度），或者被 hover/状态类用着。入场只能用 `opacity`，或者裁一个不被共用的子元素。转轮那次就因此白转了两轮。
3. **`--rw` 变了半径跟着变。** 转轮半径 = `calc(var(--rw) * .866)`（正六边形外接圆），所以窄屏上改 `--rw` 就行，不用另写几何。
4. **格数 / 盘数一变就要重算。** 海报墙曾经是「7 张 + 1 格文字 = 8 格」，改成翻书后那条约束不再存在；但转轮是「360° / 张数」，换成 5 张就是 72°/盘。
5. **`open` 不会重载已经开着的页面**，改完要用带时间戳的地址重开（`...?v=$(date +%H%M%S)`），否则用户看到的还是旧版——这一轮为此沟通过两次。

每块的「目标 / 我负责的 / 怎么实现的」**全部来自 `content.js` 已有字段**（`brief` / `duties` / `role` / `credit` / `steps` / `tags`），没有新写事实。

**两条硬约束（改之前先读）：**
1. **`clip-path` 不能下在被 IntersectionObserver 观察的元素上**（裁到 0 面积 → `intersectionRatio` 恒为 0 → 永远等不到回调）。所以裁的是 `.card-media` 或 `.feat-media`，被观察的 `.card` / `.feat` 保持完整面积。这个坑这次又踩了一次。
2. **海报墙 8 格不能改成 7 格**（7 张海报 + meta = 8）。同理，块 1 是“通栏主片 + 5 条片单”，5 格刚好铺满。改数量之前先算格数，否则末行会留空洞。

改任一块的 `kind`（`video` / `poster` / `flow` / `text`）要同时改 `style.css` 里对应的 `.blk--*` 规则。

### 每块一个开关

- 峰值 A/B 开关还在：`?peak=hero` → 1.6M 升为首屏巨数，证据条只剩其余三个。
- **这个开关现在有点尴尬**：作品区的通栏主片已经是峰值了，再加首屏巨数就是两个峰值（违反“只有一个峰值”）。建议删掉 `?peak=hero`。

---

## 四、已完成 / 未完成

### ✅ 已完成
- 首屏完整重做（构图 + 楷体 + 形象接入 + 转头交互）
- **作品章四台翻阅装置**（转轮 / 翻书 / 抽屉柜 / 掀角，见第三节）
- **每块的「目标 / 我负责的 / 怎么实现的」**（全取自 `content.js` 已有字段，包括之前一直被闲置的 `tiktok.duties` 五步、`localization.steps` 三步）
- **每节导语 + 每件的「我做了什么」**（正面信息补齐，不再只靠点开）
- **TikTok 六条按播放从高到低排**（块导语对读者承诺了这个顺序，不能改回原顺序）
- **录屏工具 `tools/record.mjs`**（CDP 抓帧 → ffmpeg）——验证动效只能靠它，截图不行
- 黏土形象 **4 个风格变体**（自然肤色 / 单色雕塑 / 低多边形 / 精致黏土），存在 `assets/raw/character/`
- **单色雕塑版的 5 帧转角**（±15°/±30° + 正面），WebP 每张 72–76KB
- 互动形象组件 `site/figure.js` + 径向羽化遮罩
- 14 张人物照已入库（已降采样到 1536px）
- 生图链路打通（见第六节）

### ⚠️ 未完成（按优先级）

1. **全页灰度层次拉开** —— 从页底到文字到图片还是同一档灰。`filter:grayscale(1) contrast(.9)` + `opacity:.72` 把对比也削掉了（降饱和不该降对比），这是全页最大的工艺问题
2. **经历三节还是 JD 语言** —— 「赛事热点追踪与选题策划」这类是职责不是成果。要改成成果，**需要用户提供「哪段实习产出了哪些作品」**，不能编
3. **首屏四个数字仍是等权的一行** —— 四个数字来自四个语境（TikTok / 虎扑 / 小游戏 / 历史记录），加不起来
4. **块 1 的块头仍偏高**（约 500px），装置要滚一段才出现
5. **移动端首屏名字只显示一个「周」** —— 形象横跨 144–370px，正好压住「性运」。桌面端是设计，移动端看起来像 bug
6. **装置的滑鼠手势** —— 目前只能点按钮/圆点/键盘，还不能拖拽或滚轮连续转（用户提过“轮回感”可以再强一点）
7. **帧加密到 10° 一档**（现在 15°，交叉淡入中点是双影）
8. **另外三个形象变体的转角集**（v1 / v3 / v4）
9. **PDF 导出**（`scripts/export-pdf.mjs`）还没和新站对接；`?peak=hero` 开关建议删掉（作品区已有峰值）

### 可以删的
- `?peak=hero` 开关（见第三节）
- `versions/` 三个方向初版、`demo/a|b|c.html`

---

## 五、预览与自检

```bash
cd /Users/xindong/Documents/个人网站
node tools/serve.mjs "$PWD" 8899 &            # 起服务器
open http://localhost:8899/site/index.html    # 或 open -a Safari <上面的地址>
```

截图自检：
```bash
PLAN='[{"path":"site/index.html","name":"hero","scroll":0,"wait":800}]' \
  OUTDIR=/tmp/shots node tools/shoot.mjs
```
PLAN 每项支持 `js` 字段：截图前在页面里执行一段脚本（例：`window.__page.open("tt-TT5")`）。

**录屏自检（验证动效只能靠它）：**
```bash
node tools/record.mjs --out /tmp/deck.mp4 --path "site/index.html" \
  --scroll "#works-tiktok" --offset -70 --ms 2600 \
  --act "const t=document.querySelectorAll('.deck-tab'); t[2].click(); await new Promise(r=>setTimeout(r,1000)); t[0].click();"
```

> **重要：截图验证不了动效。** `Page.captureScreenshot` 有 100–300ms 延迟，而本项目的过渡只有 160–700ms，
> 所以截图永远抓到的是动效结束后的状态。用 `tools/record.mjs` 录 mp4，
> 或者在页面里采样：每 60ms 读一次 `getComputedStyle(el).transform`，把结果写进 DOM 再截图。
> 另：`getComputedStyle` 返回的 `rotateY` 是 `matrix3d`，不是 `matrix`，解析时别写错。

> **`open` 不会重载已经开着的页面。** 它只会把旧标签页切到前台，所以改完代码后
> 用带时间戳的地址重开（`...index.html?v=$(date +%H%M%S)`），否则看到的还是旧版。

**不要用 `python3 -m http.server`** —— 它会偶发 `ERR_CONNECTION_RESET`，导致 `main.js`/`content.js` 加载失败、页面只剩空壳、截图全黑，看起来像代码写坏了。这个坑踩过。

---

## 六、已知的坑（全部实测过，别重复踩）

1. **`clip-path` 会让元素自身的 IntersectionObserver 恒为 0 面积。**
   `inset(100% 0 0 0)` 的元素即使几何上占满视口，`intersectionRatio` 也返回 `0.000`。
   → 任何「初始被裁切、等滚进视口再显示」的元素，**永远等不到自己的揭示回调**。必须用外层不裁切的哨兵元素承担观察职责。

2. **headless 截图看不到 WebGL。** `--disable-gpu` 会让 `getContext('webgl')` 返回 null，页面走降级分支把 canvas 移除。
   → 加 `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`，且**不能带 `--disable-gpu`**。`tools/shoot.mjs` 已处理。

3. **快速程序化滚动会让 `loading="lazy"` 的图不发起请求**，截图里像破图。
   → `tools/shoot.mjs` 每个页面都会先预热滚动一遍。

4. **macOS 自带 bash 3.2 不支持 `declare -A`**，脚本里用简单列表代替。

5. **Safari 下 `file://` 跨目录引用素材容易白屏**（页面在 `site/`，素材在上一级 `assets/`）。→ 用本地服务器预览。

6. **不要用 `osascript` 读 Safari 标签名** —— 会弹自动化授权并卡住。

7. **cindy media 改图：输入图太大会失败。** 手机原图 7–8MB / 2000 万像素会返回 `SUBMISSION_OUTCOME_UNKNOWN`（看起来像上游故障）。压到 **1024px / 40–60KB** 后一次成功。
   而且 `media.request` 的 `image` 字段**只接受 Cindy 受管媒体地址**，本地路径会报 `MEDIA_INPUT_INVALID`。解法：媒体库是内容寻址的（`~/Library/Application Support/Cindy/cindy-media/blobs/<sha256 前两位>/<完整 sha256>.<ext>`），压完算 sha256 直接放进去即可拿到可用地址。

8. **cindy media 的 `prepare` → `request` 之间有 TTL。** 中间插一个跑几分钟的任务，回来就报 `INVOCATION_NOT_FOUND`。这两步必须连着做。

---

## 七、素材状态

### 已有
- 14 张人物照原图（3.3–11MB / 2000 万像素），已降采样 4 张到 1536px
- 4 个黏土形象变体 + 单色雕塑版的 5 帧转角
- TikTok 6 条**可以下载**（`yt-dlp` 已装在 `~/.local/bin/`，实测 720×1280 h265 mp4，元数据完整）
- Instagram Reel **可以下载**（1080×1920 mp4）

### 缺（要向用户要）
| 要什么 | 为什么重要 |
| --- | --- |
| **TikTok / IG 成片 mp4** | 能做卡片 hover 静音循环播放，同一张卡片档次差一整级 |
| **作品原片**：TT5（1.6M 那条）静帧只有 576×1024 | 铺满一屏立刻能看出糊，需要 1080×1920 导出 |
| **IG 5 张海报原图** | 抓取只能拿到 640×640 方形缩略图，**比仓库现有的还差** |
| **RALLY 实机录屏**（横屏 30–60 秒） | 现在只有 844×390 的静态截图，放大就废 |
| **工作痕迹**：内容排期表 / 数据后台截图 / 工作现场照 | 内容运营岗位最有说服力，且别人抄不走 |
| 抖音「詹库侠」账号截图 + 19.6K 粉丝的证据截图 | 现在只有文字没有图 |

### 可选
- 抖音可在 **Cindy 侧边栏登录**（一次解锁抖音内容；IG 高清图也能拿到）
- YouTube 日本区账号被 bot 检测挡着，需要 cookie

---

## 八、下次开对话怎么接

1. 先读这份 `PROGRESS.md` → `REDESIGN.md`（第三节品味门槛）→ `REFERENCES.md`
2. 起服务器，用**带时间戳的地址**打开（`...?v=$(date +%H%M%S)`，`open` 不会重载旧标签页）：
   `node tools/serve.mjs "$PWD" 8899 &` → `open "http://localhost:8899/site/index.html?v=$(date +%H%M%S)"`
3. 看一眼当前状态：`demo/shots/dev-*.mp4` 是四台装置的录屏，比截图快
4. 当前进度：首页 + 作品章（四台装置）已完成；**能力 / 经历 / 个人项目 / 联系四节还未按「叠压」语言收过**
5. **建议的下一步**：全页灰度层次（未完成第 1 条）——`grayscale(1) contrast(.9)` + `opacity:.72` 把对比也削掉了，是全页最大的工艺问题，而且改动最小、全页见效

**改之前先看第三节的「写新舞台时必须知道的五条」。**

代码注释一律中文。零构建、零依赖这条底线不要破。
