# 首爾秋日旅程 — Codex Cloud 工作指南

## 目的
讓郁涵透過手機 Codex 對話修改旅遊網站；修改不依賴個人筆電開機。

## 專案結構
- `data/trip.json`：2026/10/28–11/3 每日行程、地圖區域。修改時間、地點、說明時優先編輯此檔。
- `data/places.json`：第二頁美食與景點攻略；`scope` 為 `group` 或 `solo`，`type` 為 `food`、`sight` 或 `shopping`。
- `site/index.html`：行程首頁、行前清單、薄荷綠與楓葉設計。
- `site/guide.html`、`site/guide.css`、`site/guide.js`：攻略第二頁。
- `scripts/build.mjs`：以 data/ 的正式資料覆蓋網頁範本中的行程資料，產出 dist/。
- `.github/workflows/pages.yml`：PR 檢查；main 更新後部署 GitHub Pages。

## 修改規則
1. 保持繁體中文、薄荷綠和楓葉風格、手機可讀性。
2. 不把個人推薦候選當成已定行程。11/1 找朋友，11/2 個人行程待規劃。
3. 郁涵 10/28 15:40 TPE T1 → 19:15 ICN T2；11/3 12:30 ICN → 14:20 TPE T1，09:30 前到仁川機場，回程仁川航廈未確認。
4. 郁涵跟學弟妹團；10/29 看 TOUCH FIVE，10/31 18:00 與學姊團晚餐會合、20:00 看秀。
5. 網路方案：中華電信 20GB／NT$788（使用者提供）。
6. 行程與攻略的正式資料在 data/，不要只修改範本中的重複資料；不要提交 dist/。
7. 不提交任何 token、cookie、密碼或 .env。GitHub Actions 使用內建權限，無須個人存取權杖。
8. 清單勾選、筆記、收藏目前採 localStorage，不是跨裝置同步。

## 驗證與發布
執行 `npm run build` 與 `npm test`。必要時 `npm run preview` 在 4173 預覽。
修改完成後提交或建立 PR，遵循使用者當次指示。PR 合併到 main 後，Actions 才會發布網站。
不要聲稱 PR 尚未合併的版本已上線。部署網址應從成功的 GitHub Actions / Pages 回應確認。

既有 ChatGPT Sites 網址仍是獨立發布來源；本 workflow 只部署 GitHub Pages，不會自動更新 chatgpt.site。

2026/10/27：使用者明確要求部署到公開 GitHub 與 GitHub Pages，取代先前不公開上傳的限制。只發布本專案檔案，不包含憑證與瀏覽器儲存資料。
