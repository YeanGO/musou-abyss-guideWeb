# 無雙深淵 Build Simulator 中文版

這是一個本地使用的《無雙深淵》中文版 Build Simulator MVP。專案使用 Vite + React 製作，資料全部放在 `src/data/*.json`，不需要後端。

## 啟動方式

請先確認電腦已安裝 Node.js，然後在本專案資料夾執行：

```bash
npm install
npm run dev
```

啟動後，依照終端機顯示的網址開啟瀏覽器，通常是：

```text
http://localhost:5173/
```

請不要直接雙擊 `index.html`。這是 Vite + React 專案，需要透過 `npm run dev` 啟動本地開發伺服器，武將列表與統計才會正常載入。

## 目前功能

- 顯示武將列表
- 搜尋武將名稱或勢力
- 依印分類篩選：能力系、屬性系、特殊系
- 篩選模式：AND / OR
- 選擇固有戰法武將
- 選擇召喚技
- 選擇隨行武將
- 點擊已選武將切換限界突破
- 一鍵切換全員限界突破
- 自動計算固有戰法印、隨行武將印、召喚技印、固有 + 隨行合計、全印合計
- 顯示合併計數後的收集印列表
- 使用 localStorage 保存目前配置
- 清空配置
- 匯出 / 匯入 JSON 配置
- RWD 版面，手機也能使用

## 新增武將資料

武將資料位於：

```text
src/data/officers.json
```

每一筆資料格式如下：

```json
{
  "id": "zhao-yun",
  "name": "趙雲",
  "category": "蜀",
  "seals": [
    { "name": "攻擊", "type": "能力系", "count": 1 },
    { "name": "風", "type": "屬性系", "count": 1 }
  ],
  "uniqueSkill": {
    "name": "龍膽突",
    "seals": [
      { "name": "攻擊", "type": "能力系", "count": 2 }
    ]
  },
  "summonSkill": {
    "name": "蒼龍召喚",
    "seals": [
      { "name": "風", "type": "屬性系", "count": 2 }
    ]
  },
  "tags": ["突進", "高機動"]
}
```

## 欄位說明

- `id`：唯一識別碼，請不要重複。
- `name`：武將名稱。
- `category`：分類，例如魏、蜀、吳、晉、群雄。
- `seals`：作為隨行武將時提供的印。
- `uniqueSkill.name`：固有戰法名稱。
- `uniqueSkill.seals`：選為固有戰法武將時提供的印。
- `summonSkill.name`：召喚技名稱。
- `summonSkill.seals`：選為召喚技時提供的印。
- `tags`：可自由補充的標籤，會顯示在武將列表。

## 印格式

```json
{ "name": "攻擊", "type": "能力系", "count": 1 }
```

- `name`：印名稱。
- `type`：目前支援 `能力系`、`屬性系`、`特殊系`。
- `count`：印數量。

## 匯入 / 匯出配置

頁面中間的操作區可以匯出目前配置為 JSON，也可以貼上先前匯出的 JSON 後匯入。

配置只保存選擇狀態與限界突破狀態，不保存完整武將資料。因此更新 `officers.json` 後，只要武將 `id` 沒有改變，舊配置仍可繼續使用。

## 專案結構

```text
src/
  components/      React 元件
  data/            JSON 武將資料
  logic/           統計與配置計算邏輯
  App.jsx          主畫面與狀態管理
  main.jsx         React 入口
  styles.css       全站樣式
```

## 注意

這是重新設計與自行實作的本地工具，不包含原網站程式碼或素材。
