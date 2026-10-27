# 郁涵的首爾秋日旅程 🍁

2026/10/28–11/3，薄荷綠行程手帳與美食景點攻略。

## 用手機 Codex 修改

1. 在網頁或桌面把 `Korea-travel-2026-10-11` 雲端環境準備完成並發布。環境須先發布，才可從手機使用。
2. 手機開啟 Codex，選擇已發布的這個雲端環境。
3. 例如：「把 11/2 下午改成首爾林散步，保留晚上自由活動。請更新 data/trip.json、檢查並建立 PR。」
4. 檢查變更後合併 PR 到 main。GitHub Actions 會建置、測試並部署。

程式與部署在雲端運作，不需要筆電開機。清單、筆記與收藏目前僅存在裝置自己的瀏覽器。

## 首次啟用 GitHub Pages

儲存庫 Settings → Pages → Build and deployment → Source 選 **GitHub Actions**。
main 上有檔案後，在 Actions 查看 `Check and deploy travel site`，必要時按 Run workflow。
網站實際網址以成功的 Pages 部署結果為準。預期專案網址為：
`https://yuyu520316.github.io/Korea-travel-2026-10-11/`。

GitHub Pages 的可用性依帳號方案與儲存庫可見性而定。網站發布可能公開旅行內容，請確認可見範圍。
本專案不會自動將 GitHub 更新發布到原本的 chatgpt.site 網址；兩個主機是獨立的。

## 本機或雲端檢查

需要 Node.js 22 以上，沒有外部 npm 依賴。

```sh
npm run build
npm test
npm run preview
```

## 官方說明

- [Codex Cloud 環境與手機使用](https://learn.chatgpt.com/docs/environments/cloud-environments)
- [GitHub Pages 自動部署](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

現有私人網站：https://yuhan-seoul-autumn-2026.agileflea21.chatgpt.site

## 公開發布
2026/10/27 使用者已要求公開發布此旅行網站。GitHub Pages 提供免登入瀏覽；原本的私人 Sites 網站獨立保留。
