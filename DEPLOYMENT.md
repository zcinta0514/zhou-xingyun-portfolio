# 新版发布

2026-10-07：根首页进入 `site/` 新版，桌面与手机共用同一站点，保留查询参数与章节锚点。

正式入口：https://zcinta0514.github.io/zhou-xingyun-portfolio/

GitHub Pages 从 main 分支根目录发布；`.nojekyll` 让静态资源直接发布。简历入口下载现有 PDF。Vercel 已同步：https://zhou-xingyun-portfolio.vercel.app 。2026-10-07 使用原项目完成生产部署，包含桌面最新简历。Vercel 当前通过 CLI 手动发布。旧版 PDF 导出工具为独立本地工作，不包含在本次发布中。

新版源码在 `site/`，内容数据在 `versions/shared/content.js`。开发目录内未提交的旧站 PDF 改动保留，因此本次在独立的 `publish-responsive` worktree 中切换入口并发布。
