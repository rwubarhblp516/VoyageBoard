# VoyageBoard
## 多人旅行协作与AA结算系统
### Product Design Document
### Version 1.0

---

# 1. 项目定位

VoyageBoard 是一个：

> “多人旅行协作 + 行程攻略 + 实时AA结算”的 Web App。

核心目标：

- 旅行中快速记录
- 多人实时同步
- 自动AA结算
- 自动生成最终转账方案
- 行程与记账一体化
- 手机端体验优先
- 无学习成本
- 高质量现代UI
- 避免传统财务系统感

---

# 2. 产品理念（非常重要）

## 不要做成：

- 企业后台
- Excel
- 财务系统
- 密密麻麻表格
- AI味 SaaS 页面
- 普通 Tailwind 模板

## 要做成：

> “旅行小队作战面板”

用户感受应该是：

- 轻松
- 有组织
- 清晰
- 有节奏
- 有仪式感
- 有团队行动感

---

# 3. UI/UX 核心风格（必须遵守）

本项目严格参考：

https://github.com/unobtuse/reactbits-frontend-design-skill

中的 frontend-design skill 规范。

---

# 4. 设计锚点（Design Anchor）

## Primary Anchor

### Modern Travel Dashboard
+
### Soft Industrial Glassmorphism
+
### Apple-like Spatial UI

## Secondary Anchor

- Minimal Transit Interface
- Lightweight Expedition HUD
- Collaborative Mission Board

---

# 5. 禁止事项（极其重要）

## 禁止：

- 默认 SaaS 风
- 默认紫色渐变
- 普通后台模板
- 白色卡片堆叠
- “管理系统”感
- 数据表格主导页面
- 大量边框
- 信息过密
- 传统财务UI
- 小字体
- 复杂菜单
- 企业ERP感

---

# 6. 整体视觉语言

## 气质关键词

- 轻松
- 高级
- 清爽
- 空间感
- 旅行感
- 协作感
- 即时感
- 半透明磨砂玻璃
- 地图系统
- iOS-like
- Calm
- Spatial

---

# 7. 色彩系统

## Base Colors

### Background

```css
#0F1722
#111827
#0B1220
```

### Surface

```css
rgba(255,255,255,0.06)
rgba(255,255,255,0.08)
```

### Primary Accent

```css
#3BC9FF
```

旅行系统核心色，用于当前状态、激活按钮、导航、当前日期与当前旅程。

### Secondary Accent

```css
#6EE7B7
```

用于收入、已结算、成功、正收益。

### Warning

```css
#FFB84D
```

用于待付款、注意事项、超预算。

### Danger

```css
#FF6B6B
```

用于欠款、删除、危险操作。

---

# 8. 字体规范

- 主字体：Inter
- 数字字体：JetBrains Mono（金额、数据、统计、里程、转账）

---

# 9. 圆角规范

- 全局：24px
- 小组件：16px
- 大卡片：32px

---

# 10. 阴影规范

禁止传统厚重阴影；优先使用 backdrop blur 与 subtle ambient glow。

---

# 11. 动效规范（极其重要）

动效原则：

> “像正在运行的旅行系统” 而不是 “游戏特效”

必须：缓慢、柔和、空间感、有惯性、有层次。

禁止：大爆炸、强烈粒子、花哨弹跳、浮夸动画。

推荐：Framer Motion、React Bits 动效、微弱呼吸、模糊渐变漂移、数字滚动、卡片轻微浮动。

---

# 12. 技术栈

- Frontend：React / Vite / TypeScript / TailwindCSS / Framer Motion / Zustand / React Query
- Backend：Supabase（Auth / Database / Realtime / Storage）

---

# 13. 响应式策略

Mobile First；断点覆盖 Mobile / Tablet / Desktop。

手机端必须：单手操作、3秒记账、大按钮、底部导航、不依赖 hover。

---

# 14. 页面结构（首页 Dashboard）

展示：当前旅行、当前日期、今日行程、今日花费、当前结算状态、快速记账入口。

布局：
- 顶部：旅行标题 / 当前城市 / 天气 / 日期
- 中间：今日行程卡片
- 下方：今日消费 / 当前人均 / 待结算金额
- 底部：快速操作

---

# 15. 底部导航

[ Dashboard ] [ Itinerary ] [ Expenses ] [ Settlement ] [ Stats ]

---

# 16. 行程页面（Itinerary）

采用 Timeline，而不是表格。

每一天为一个 Day Card，包含日期、城市、驾驶时长、住宿、景点、备注。

示例结构：
- DAY 3 · 万宁
- 地图 / 酒店 / 景点 / 美食 / Tips

---

# 17. 记账页面（核心）

核心原则：

> “3秒完成记录”

布局：
- 顶部：当前总消费 / 当前人均
- 中间：消费流
- 底部：巨大“+ 添加支出”按钮

---

# 18. 添加支出 Modal

字段：金额（Number）、类型（Select）、付款人（User）、参与人（MultiSelect）、日期（Day）、备注（Optional）。

---

# 19. 消费类型

住宿、餐饮、油费、停车、门票、购物、娱乐、其他。

---

# 20. Expense Card

视觉重点：金额最大。

示例：
- ¥328
- 海鲜晚餐
- 张三支付
- 参与：全员
- Day 2 · 三亚

---

# 21. Settlement 页面（灵魂）

功能：自动计算谁该给谁钱、最小转账路径、最终净结算。

输入：所有 Expense。

输出：最小转账集合（例如：李四 -> 张三 ¥182）。

---

# 22. Settlement UI

不要表格，使用“转账流”视觉：

李四 ↓ ¥182 张三。

已完成转账自动绿色。

---

# 23. Stats 页面

展示：
- 总花费
- 人均消费
- 分类占比（环形图 + 柔和动画）
- 每日消费趋势（Smooth Line Chart）
- 油费统计（总里程 / 总油费 / 每公里成本）

---

# 24. 数据库设计

- users: id, name, avatar, email, created_at
- trips: id, title, start_date, end_date, cover_image, owner_id, created_at
- trip_members: id, trip_id, user_id, role
- itinerary_days: id, trip_id, day_index, city, notes, date
- expenses: id, trip_id, title, amount, payer_id, category, note, expense_date, created_at
- expense_participants: id, expense_id, user_id, share_amount
- settlements: id, trip_id, from_user_id, to_user_id, amount, is_paid, created_at

---

# 25. 实时同步

使用 Supabase Realtime；要求多人同时在线、实时刷新、无需手动同步。

---

# 26. Auth

支持：Google、Apple、GitHub、Email Magic Link。

---

# 27. PWA

必须支持：添加到桌面、全屏启动、离线缓存、手机 App 体验。

---

# 28. ReactBits 使用规范

可使用：background mesh gradients、soft noise、floating blur、subtle scanline、card hover float、soft parallax、number rolling、smooth fade、kinetic number、smooth counter。

禁止：强烈 glitch、hacker 风、terminal flood、重赛博朋克、过度 shader、flashy effects。

---

# 29. Design System 原则

所有组件必须统一：空间语言、圆角、玻璃材质、动效节奏、阴影逻辑。

---

# 30. 开发优先级

- Phase 1（MVP）：登录、创建旅行、添加成员、记账、自动结算
- Phase 2：行程管理、地图、统计、图表、PWA
- Phase 3：图片上传、发票拍照识别、AI 行程建议、油耗统计、导航整合

---

# 31. 最终产品气质

> “Apple 做的多人旅行协作系统”

而不是 “一个AA记账网站”。

---

# 32. 最重要原则（必须牢记）

这个产品不是财务软件、不是后台、不是 Excel。

它应该是“朋友一起旅行时的共享行动面板”，让用户感受到：轻松、愉快、有组织、一起出发、一起行动、一起结算。
