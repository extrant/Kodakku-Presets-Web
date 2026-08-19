# 可达鸭预设检索站 (Kodakku Presets Web)

一个为 **KodakkuAssist** 社区预设脚本提供检索与浏览的静态网页工具。在线访问 `https://kodakku.ottocorp.xyz/`。

## 项目简介

可达鸭预设检索站从多个作者维护的 `OnlineRepo.json` 仓库中聚合预设脚本数据，通过 Cloudflare Worker 中转 API 统一拉取，前端提供关键词搜索、副本/地图筛选、作者筛选等功能，方便玩家快速找到自己需要的预设，而不用挨个翻找各个作者的仓库。

## 功能特性

- 🔍 关键词搜索（名称 / 作者）
- 🗺️ 按副本 / 地图筛选
- 👤 按作者筛选
- 📊 实时统计（已加载预设数量 / 当前显示数量）
- ⚡ 基于 Cloudflare Worker 的中转 API，聚合多个来源的数据，规避直接访问 GitHub Raw 的限制

## 技术架构

- **前端**：纯静态页面（`index.html` + `script.js` + `style.css`），无需构建工具，开箱即用
- **数据映射**：`territory_names.json` 提供副本 / 地图 ID 与中文名称的对照表
- **后端**：数据源清单与聚合逻辑运行在 Cloudflare Worker 上，由 Worker 定期拉取各作者仓库中的 `OnlineRepo.json` 并聚合，再通过 API 返回给前端

## 目录结构

```
.
├── icon.png               # 站点图标
├── index.html              # 页面结构
├── script.js                # 前端逻辑（搜索 / 筛选 / 渲染）
├── style.css                # 样式
└── territory_names.json     # 副本 / 地图名称映射表
```

## 关于新增预设作者 / 仓库

本站收录的预设数据来源清单配置在 Cloudflare Worker（`worker.js`）中，**理论上**可以通过修改 `worker.js`、新增作者的 `OnlineRepo.json` 数据源地址来实现收录新作者的预设。

不过 `worker.js` 并不在本仓库内，也无法通过 Pull Request 直接修改并生效——新增数据源最终仍然需要由仓库作者在 Cloudflare Worker 后台手动更新并重新部署。

如果你希望把自己的预设仓库加入检索站，欢迎联系我（如果你能找到我的联系方式，直接 @ 我即可），我会尽快帮忙添加。您可以先提交pr，然后由我手动来进行处理。

## 致谢

感谢 KodakkuAssist（可达鸭助手）以及各位预设作者对社区的贡献。

## License

暂未指定，如有需要请自行补充。
