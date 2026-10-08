# PDF 作品集

2026-10-08 更新，17 页、16:9 横向，适合电脑阅读和求职附件。与新版网站共用 `versions/shared/content.js`。

## 内容

1. 封面与自我介绍
2. 目录与代表成果
3. 心动：Cindy 产品运营与 AI 工作流
4. Cindy 产品演示视频（成片链接）
5. 动效素材库 Motion Atlas
6. 摄影调色：真实前后对比（在线交互链接）
7–9. TikTok 案例与数据复盘
10–12. Instagram 视觉与创意
13. 日韩教学内容协作
14. 虎扑长文
15. 开拍 RALLY 与个人账号
16. 教育与此前实习
17. 联系、网站二维码与简历链接

## 导出

需要 Node.js、Google Chrome、Python 3，以及 `pymupdf`、`Pillow`。可在虚拟环境中安装 Python 依赖。

```sh
node tools/export-portfolio-pdf.mjs
python3 tools/finish-portfolio-pdf.py
```

生成 `dist/zhou-xingyun-portfolio-2026.pdf`。正式下载文件为 `assets/zhou-xingyun-portfolio.pdf`，导出后复制至该路径。

## 验收

17 页与 17 个书签，24 个页内跳转、35 个外链；图片、内容边界、文字提取及新案例检查通过。视频采用静帧与成片链接，摄影调色采用静态前后对比。成品约 4.7 MB。
