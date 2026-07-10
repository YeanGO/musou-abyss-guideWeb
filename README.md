# 無雙深淵 Build Simulator 中文版

這個專案不是一般攻略網站，也不是流派推薦網站。它的目標是做一個《無雙深淵》本地 / GitHub Pages 可用的 Build Simulator：由玩家手動選擇「主控武將」與「隨行武將」，系統即時計算目前隊伍的 traits 總量，並判斷召喚技是否升級、固有戰法是否啟用。

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

請不要直接雙擊 `index.html`。這是 Vite + React 專案，需要透過 `npm run dev` 啟動本地開發伺服器。

## 目前功能

- 手動選擇 1 名主控武將
- 手動選擇多名隨行武將
- 操作英傑 traits 會計入 traits 總量
- 隊伍英傑 traits 會計入 traits 總量
- 操作英傑不檢查召喚技與固有戰法
- 隊伍英傑才檢查召喚技強化與固有戰法發動
- 顯示能力系、屬性系、特殊系 traits 總量
- 判斷每名武將的召喚技升級條件
- 判斷每名武將的固有戰法啟用條件
- 顯示條件尚缺的 trait 或武將
- 可依武將名稱、勢力、技能名稱搜尋
- 可依勢力、trait 分類、條件狀態篩選
- 使用 localStorage 保存目前 Build
- 支援匯出 / 匯入 JSON Build
- 支援 GitHub Pages 部署

## 資料檔案

資料位於：

```text
src/data/traits.json
src/data/categories.json
src/data/officers.json
```

## traits.json

`traits.json` 是 trait 主資料。

```json
{
  "id": "power",
  "name": "力",
  "category": "ability",
  "categoryName": "能力系",
  "sort": 10
}
```

欄位說明：

- `id`：trait 唯一識別碼，請不要重複。
- `name`：trait 顯示名稱。
- `category`：分類代碼，目前支援 `ability`、`element`、`special`。
- `categoryName`：分類顯示名稱，例如能力系、屬性系、特殊系。
- `sort`：顯示排序。

## officers.json

每名英傑同時支援兩種用途：

- `playerData`：作為操作英傑時使用
- `supportData`：作為隊伍英傑時使用

每名英傑格式如下：

```json
{
  "id": "guan-yu",
  "name": "關羽",
  "faction": "shu",
  "factionName": "蜀",
  "level": 36,
  "playerData": {
    "traits": [
      { "traitId": "shu", "count": 1 },
      { "traitId": "brave-general", "count": 1 }
    ],
    "operationTrait": {
      "name": "軍神",
      "description": "操作時的專屬特性。"
    },
    "weaponBreakthrough": {
      "specialWeapon": {
        "name": "持有特武",
        "description": "持有特武時發動的效果。"
      },
      "limitBreak": {
        "name": "限界突破",
        "description": "限界突破時發動的效果。"
      }
    }
  },
  "supportData": {
    "traits": [
      { "traitId": "shu", "count": 1 },
      { "traitId": "brave-general", "count": 1 }
    ],
    "summonSkill": {
      "name": "裂刃・炎",
      "description": "召喚技描述",
      "level": 1,
      "upgradeConditions": {
        "all": [
          { "type": "trait", "traitId": "brave-general", "required": 5 }
        ]
      }
    },
    "uniqueTactic": {
      "name": "五虎集結",
      "description": "固有戰法描述",
      "activationConditions": {
        "all": [
          { "type": "trait", "traitId": "shu-five-tigers", "required": 5 }
        ]
      }
    }
  }
}
```

## 條件格式

Trait 條件：

```json
{ "type": "trait", "traitId": "fire", "required": 3 }
```

指定武將條件：

```json
{ "type": "officer", "officerId": "zhang-fei" }
```

全部符合：

```json
{
  "all": [
    { "type": "trait", "traitId": "shu", "required": 3 },
    { "type": "trait", "traitId": "power", "required": 2 }
  ]
}
```

任一符合：

```json
{
  "any": [
    { "type": "trait", "traitId": "fire", "required": 3 },
    { "type": "trait", "traitId": "thunder", "required": 3 }
  ]
}
```

## Build JSON 格式

匯入 / 匯出只保存選擇狀態，不保存完整武將資料。

```json
{
  "version": 3,
  "playerOfficerId": "guan-yu",
  "teamOfficerIds": ["zhang-fei", "zhao-yun", "ma-chao", "huang-zhong"]
}
```

欄位說明：

- `playerOfficerId`：操作英傑。
- `teamOfficerIds`：隊伍英傑。
- 操作英傑的 `playerData.traits` 會計入 traits 總量。
- 隊伍英傑的 `supportData.traits` 會計入 traits 總量。
- 操作英傑不檢查召喚技與固有戰法。
- 只有隊伍英傑會檢查 `supportData.summonSkill` 與 `supportData.uniqueTactic`。
- `teamOfficerIds` 不允許重複。
- 若某英傑被設為操作英傑，會自動從隊伍英傑移除。

## 計算邏輯

主要邏輯位於：

```text
src/logic/buildCalculator.js
```

核心函式：

- `createTraitMap(traits)`
- `createOfficerMap(officers)`
- `calculateBuildTraitTotals(officers, build)`
- `evaluateCondition(condition, context)`
- `evaluateOfficerStatus(officer, context)`
- `calculateBuildResult(officers, traits, build)`

## GitHub Pages

此專案已設定 Vite base：

```js
base: '/musou-abyss-guideWeb/'
```

並已加入 GitHub Actions 部署檔案：

```text
.github/workflows/deploy.yml
```

GitHub Pages 後台請設定：

- `Settings` → `Pages`
- `Build and deployment`
- `Source` 選 `GitHub Actions`

部署網址：

```text
https://yeango.github.io/musou-abyss-guideWeb/
```
