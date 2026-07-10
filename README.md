# 無雙深淵 Build Simulator 中文版

這是一個本地使用的《無雙深淵》中文版 Build Simulator MVP。專案使用 Vite + React 製作，資料全部放在 `src/data/*.json`，不需要後端。

目前版本採用「單頁 Build 操作台」設計：先選目標收集印，再用 AND / OR 找候選武將，接著配置固有戰法、召喚技與隨行武將。

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

- 顯示候選武將列表
- 搜尋武將名稱、勢力或標籤
- 依勢力篩選：魏、蜀、吳、晉、群雄
- 依印分類篩選：能力系、屬性系、特殊系
- 選擇目標收集印
- 篩選模式：AND / OR
- 候選武將顯示命中目標印數
- 選擇固有戰法、召喚技、隨行武將
- 點擊已選武將切換限界突破
- 一鍵切換全員限界突破
- 顯示目標印已達成 / 尚缺
- 自動計算固有戰法印、隨行武將印、召喚技印、固有 + 隨行合計、全印合計
- 使用 localStorage 保存目前配置
- 清空配置
- 匯出 / 匯入 JSON 配置
- RWD 版面，手機也能使用

## 資料檔案

資料位於：

```text
src/data/seals.json
src/data/categories.json
src/data/officers.json
```

## seals.json

`seals.json` 是印的主資料。武將資料只引用 `sealId`，不要重複寫印名稱。

```json
{
  "id": "attack",
  "name": "攻擊",
  "type": "ability",
  "typeName": "能力系",
  "sort": 10
}
```

欄位說明：

- `id`：印的唯一識別碼，請不要重複。
- `name`：印名稱。
- `type`：印分類代碼，目前支援 `ability`、`element`、`special`。
- `typeName`：印分類顯示名稱，例如能力系、屬性系、特殊系。
- `sort`：顯示排序，數字越小越前面。

## categories.json

`categories.json` 是勢力 / 分類資料。

```json
{
  "id": "shu",
  "name": "蜀",
  "sort": 20
}
```

## officers.json

每一筆武將資料格式如下：

```json
{
  "id": "zhao-yun",
  "name": "趙雲",
  "faction": "shu",
  "factionName": "蜀",
  "roles": ["突進", "高機動"],
  "companionSeals": [
    { "sealId": "attack", "count": 1 },
    { "sealId": "wind", "count": 1 }
  ],
  "uniqueSkill": {
    "name": "龍膽突",
    "seals": [
      { "sealId": "attack", "count": 2 },
      { "sealId": "speed", "count": 1 }
    ]
  },
  "summonSkill": {
    "name": "蒼龍召喚",
    "seals": [
      { "sealId": "wind", "count": 2 },
      { "sealId": "combo", "count": 1 }
    ]
  }
}
```

欄位說明：

- `id`：武將唯一識別碼，請不要重複。
- `name`：武將名稱。
- `faction`：勢力代碼，對應 `categories.json` 的 `id`。
- `factionName`：勢力顯示名稱。
- `roles`：標籤，例如突進、高火力、援護。
- `companionSeals`：作為隨行武將時提供的印。
- `uniqueSkill.name`：固有戰法名稱。
- `uniqueSkill.seals`：選為固有戰法時提供的印。
- `summonSkill.name`：召喚技名稱。
- `summonSkill.seals`：選為召喚技時提供的印。

## 印引用格式

```json
{ "sealId": "attack", "count": 1 }
```

- `sealId`：對應 `seals.json` 裡的印 `id`。
- `count`：印數量。

## 匯入 / 匯出配置格式

配置只保存選擇狀態，不保存完整武將資料。

```json
{
  "version": 2,
  "uniqueOfficerId": "zhao-yun",
  "summonOfficerId": "lu-bu",
  "companionIds": ["cao-cao", "wang-yuanji"],
  "limitBreaks": {
    "zhao-yun": true
  },
  "targetSealIds": ["attack", "wind"],
  "filterMode": "AND"
}
```

只要武將 `id` 與印 `id` 沒有改變，更新資料後舊配置仍可繼續使用。

## 專案結構

```text
src/
  data/            JSON 武將、印、勢力資料
  logic/           統計與篩選計算邏輯
  App.jsx          主畫面與狀態管理
  main.jsx         React 入口
  styles.css       全站樣式
```

## 注意

這是重新設計與自行實作的本地工具，不包含原網站程式碼或素材。
