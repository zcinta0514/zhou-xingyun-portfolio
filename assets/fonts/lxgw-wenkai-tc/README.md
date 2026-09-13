# 首页介绍字体

首页四段介绍使用 LXGW WenKai TC 400。这里保存的是 Google Fonts 官方 CSS 提供的 27 个通用 Unicode WOFF2 分片，总计 1,642,448 字节；`font.css` 保留每个分片原有的 `unicode-range`，浏览器只请求当前文字实际需要的文件。

- 获取日期：2026-09-13
- 上游项目：<https://github.com/lxgw/LxgwWenKaiTC>
- Google Fonts 官方目录：<https://github.com/google/fonts/tree/main/ofl/lxgwwenkaitc>
- 官方字体 CSS：<https://fonts.googleapis.com/css2?family=LXGW+WenKai+TC:wght@400&display=swap>
- 字重与样式：400 / normal
- 许可：SIL Open Font License 1.1，原文见 `OFL.txt`

官方 CSS 请求没有使用 `text=` 参数，也没有向字体服务发送首页姓名、教育、实习或兴趣文案。所需分片是在本地根据官方 `unicode-range` 清单筛选；对应的原始 CSS 和筛选记录位于 `tmp/home-intro-handwritten-20260913/`。
