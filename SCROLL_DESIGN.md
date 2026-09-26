# 滚动节奏与行书姓名字稿

2026-09-26。用户要求：上下滑动时更有设计感，参考开源作品，克制、不花哨；恢复原版首页自我介绍；姓名喜欢飘逸、飒爽的手写行书。

## 实际查阅的参考

以下只借鉴编排机制，网页实现为本站原生代码，没有复制演示资产或引入依赖。

| 参考 | 查阅内容 | 本站取舍 |
| --- | --- | --- |
| [Codrops OnScrollTypographyAnimations](https://github.com/codrops/OnScrollTypographyAnimations) | README、`src/js/index.js`，MIT | 采用标题字窗逐步推开；去掉逐字随机旋转、弹跳和拉伸 |
| [Codrops ScrollTextMotion](https://github.com/codrops/ScrollTextMotion) | README、`js/index.js`，MIT | 借鉴文字与视口进度对应的节奏，不做文字打乱或布局剧烈切换 |
| [Bramus Image Reveal](https://scroll-driven-animations.style/demos/image-reveal/css/anonymous.html) | 作者页公开的裁切和时间线代码；作者站注明 Apache-2.0 | RALLY 图片用小幅窗口展开，在进入主要阅读区前结束 |
| [Scroll-driven Animations 阅读进度](https://scroll-driven-animations.style/demos/progress-bar/waapi/) | 作者页的缩放进度条示例 | 导航底部仅一条细线，不增加数字与提示按钮 |
| [Trig.js](https://github.com/iDev-Games/Trig-JS) | README、`src/trig.js`，MIT | 采用“元素位置 → CSS 变量 → 视觉层”的分工；不导入库 |
| [simpleParallax.js](https://github.com/geosigno/simpleParallax.js) | README、`src/core/math.ts`、`transform.ts`、MIT LICENSE | 借鉴固定外框与内层视觉分离，控制缩放幅度，保持版面位置 |
| [Codrops StickySections](https://github.com/codrops/StickySections/blob/main/js/demo2/index.js) | README、Demo 2 源码、MIT LICENSE | 借鉴章节前后层次；不用整屏固定、亮度减半和大圆角 |

## 页面里的动效

- 首屏：姓名外层最多上移 48px，人物外层最多下移 80px，形成轻微错速。原有转头、呼吸仍由内部组件控制。
- 章节标题：进入视口时沿字窗推开；正文一直保持正常可读，不做逐字动画。
- 四种作品装置：外层最多抬入 44px，从 97.5% 到原尺寸；进入阅读位置即保持终态。开始操作、键盘聚焦时归位，内部转轮、翻书、抽屉、掀角不叠加另一套手势。
- 经历：一条细线随阅读位置推进，圆点标出已经读到的经历，不暗化正文。
- RALLY：图片窗从小幅裁切展开，内图从 1.055 缩回 1；图注、试玩链接和纸底不随之裁切。
- 联系：深色页内部轻抬入，页尾裁切防止装饰位移增加整页长度。
- 顶栏：一条细线指示阅读进度。

原生滚动，没有滚轮劫持、强制停留或自动翻作品。静止时停止帧更新；图片加载、字体就绪、展开说明和窗口变化后重新测量。`prefers-reduced-motion`、`?flat=1`、860px 以下均为静态终态。章节锚点壳不运动。

## 自我介绍

根据用户后续纠正，四段介绍现在完整放在首屏内部、毛笔姓名正下方，不再设独立“关于我”章节。仍读取共享事实数据，与旧站首页逐字一致。姓名保留毛笔字稿，介绍使用细线硬笔手写字体，形成粗细对比。

## 行书字稿

资产：`assets/raw/type/name-xingshu-v1.png`，1983×793，RGBA PNG。使用内置 `image_gen`，生成一次，未裁切或重绘。透明底、无印章，三字目视核对为“周性运”。这是姓名装饰字图，不是可安装字库。

网页保留真实 H1 与姓名的无障碍标签。图片未加载或失败时沿用原来的文字字体。正文继续使用清晰的系统字体。

### 最终生成提示词

```text
Use case: logo-brand
Asset type: A finished high-resolution transparent PNG Chinese calligraphy name artwork for the hero of a personal portfolio website; it will be composited on warm ivory paper behind and in front of a clay character.
Text (verbatim): "周性运"
The artwork contains exactly these THREE simplified Chinese characters, written left to right on ONE horizontal line: 周, 性, 运. Check the writing carefully: 周 is the surname Zhou; 性 must have 忄 on the left and 生 on the right; 运 must be the simplified character with 云 and 辶. Do not substitute 星, 行, 云, or traditional 運. No other writing at all.
Style/medium: Authentic expressive handwritten Chinese running script (行书), elegant and free-flowing, wind-swept and confident, 飘逸、飒爽. Fluid brush rhythm with varied stroke lengths and weight, lively turning and strong purposeful stroke endings. Clearly running script, not static regular script or a digital font. Each character must still be readily legible: not wild cursive. Refined black Chinese ink, restrained organic ink-density variation and modest dry-brush flying-white texture within the strokes.
Composition: A compact wide horizontal name composition around 2.5:1, high resolution, generous enough safety margin to preserve EVERY complete brush stroke. Three characters have natural individual widths and lively rhythm while forming one harmonious line. Avoid long decorative swashes crossing the entire artwork.
Background: GENUINELY TRANSPARENT background, alpha channel preserved in the PNG, isolated ink strokes only. The transparent regions must not contain painted white, gray, cream, paper texture, or a checkerboard pattern.
Constraints: Only black/gray monochrome ink. No red seal, no stamp, no watermark, no pinyin, no Latin letters, no borders, no illustration, no graphic decoration. Avoid mechanical Kaishu, Ming/Song type, uniformly chunky heavy black glyphs, and excessive splatter. Produce the finished name artwork alone, not a mockup, not a presentation board.
```

## 界面微交互补充

2026-09-26 用户继续要求更多 UI 反馈，同时强调自我介绍必须在首页姓名下面。

- 查阅 [Codrops MagneticButtons](https://github.com/codrops/MagneticButtons) 的 `src/js/demo1/buttonCtrl.js`：保留“轻微跟手”的反馈，仅主行动文字移动最多 3px；不移动点击区域、不使用自定义光标、不跑常驻循环。
- 查阅 [Codrops LineHoverStyles](https://github.com/codrops/LineHoverStyles) 的 `css/base.css`：用细线的 transform-origin 与 scaleX 表达链接状态，顶栏指示线在当前项和悬停项之间移动。两者均为 MIT 项目，此处机制参考、代码独立实现。
- 作品分类在作品章内停靠，滚动时标出当前类别；使用额外锚点间距避免标题被两行导航遮住。这不是每件作品的数字分页。
- 制作说明及个人项目说明使用原生 details；点击时用 Web Animations 平滑改变单个面板高度，结束恢复 auto。支持快速反向、原生键盘、动态减弱动效；滚动层会在尺寸变化后重新测量。
- 首屏介绍按段短暂错峰进入，长文不做逐字打字效果。

## 介绍字体

采用 [YShi-Written / 写意体](https://github.com/Steve-Yuu/YShi-Written) 的细线硬笔手写字形，未把长段落生成成图片。按原介绍提取字形并重命名为 Portfolio Pen，保留 SIL OFL 1.1 许可（`assets/fonts/portfolio-pen/OFL.txt`）；WOFF2 子集约18KB，当前介绍所有字符已验证覆盖。仍可选择、复制和自适应换行。该字体提供硬笔手写观感，不将它宣称为一套新制作的钢笔行书字库。
