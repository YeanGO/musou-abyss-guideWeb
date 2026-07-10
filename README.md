# 無雙深淵 Build Simulator 中文版

這個專案不是一般攻略網站，也不是流派推薦網站。它的目標是做一個《無雙深淵》本地 / GitHub Pages 可用的 Build Simulator：由玩家手動選擇「操作英傑」與「隊伍英傑」，系統即時計算目前隊伍的 traits 總量，並判斷召喚技是否強化、固有戰法是否發動。

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

- 手動選擇 1 名操作英傑
- 手動選擇多名隊伍英傑
- 操作英傑的 `playerData.traits` 會計入 traits 總量
- 隊伍英傑的 `supportData.traits` 會計入 traits 總量
- 操作英傑不檢查召喚技與固有戰法
- 只有隊伍英傑會檢查召喚技強化與固有戰法發動
- 顯示能力系、屬性系、特殊系 traits 總量
- 顯示操作特性、持有特武、限界突破效果
- 顯示條件尚缺的 trait 或英傑
- 可依英傑名稱、勢力、trait、技能名稱搜尋
- 可依勢力、trait 分類、條件狀態篩選
- 使用 localStorage 保存目前 Build
- 支援匯出 / 匯入 JSON Build
- 支援 GitHub Pages 部署

## 資料維護流程

目前資料採用 CSV 作為主要維護來源，再透過轉換腳本產生網站使用的 JSON。

主要維護檔：

```text
data-source/traits.csv
data-source/officers.csv
```

網站讀取檔：

```text
src/data/traits.json
src/data/categories.json
src/data/officers.json
```

請優先修改 `data-source/*.csv`，再執行轉換指令產生 `src/data/*.json`。不要手動維護 `officers.json`，避免資料格式不一致。

## 轉換指令

先轉 traits，再轉 officers：

```bash
npm run convert:traits
npm run convert:officers
```

完整建置：

```bash
npm run build
```

目前已設定的 scripts：

```json
{
  "dev": "vite",
  "build": "vite build",
  "convert:officers": "node scripts/convert-officers-csv.mjs",
  "convert:traits": "node scripts/convert-traits-csv.mjs",
  "preview": "vite preview"
}
```

## traits.csv

`data-source/traits.csv` 是 trait 主資料來源。

欄位：

```csv
id,name,category,categoryName,sort
```

範例：

```csv
power,力,ability,能力系,10
fire,火,element,屬性系,110
brave-general,猛將,special,特殊系,240
```

欄位說明：

- `id`：trait 唯一識別碼，不可重複。
- `name`：trait 顯示名稱，不可空白。
- `category`：分類代碼，只允許 `ability`、`element`、`special`。
- `categoryName`：分類顯示名稱，例如 `能力系`、`屬性系`、`特殊系`。
- `sort`：排序數字，轉換後會依此排序。

轉換輸出：

```text
src/data/traits.json
```

重要原則：

- 網站邏輯與轉換流程不寫死任何 `traitId`。
- 實際遊戲資料可以繼續新增能力系、屬性系、特殊系 trait。
- `officers.csv` 只要引用存在於 traits 資料中的 `traitId`，就可以正常轉換與顯示。

## officers.csv

`data-source/officers.csv` 是英傑資料來源。

欄位：

```csv
id,name,faction,factionName,level,playerTraits,supportTraits,operationTraitName,operationTraitDescription,specialWeaponDescription,limitBreakDescription,summonSkillName,summonSkillDescription,summonSkillLevel,summonUpgradeConditionType,summonUpgradeConditions,uniqueTacticName,uniqueTacticDescription,uniqueTacticConditionType,uniqueTacticConditions
```

目前先放入 3 筆範例資料：

- 關羽
- 張飛
- 趙雲

轉換輸出：

```text
src/data/officers.json
```

## Trait 欄位格式

`playerTraits` 與 `supportTraits` 使用同一種格式：

```text
traitId:count;traitId:count;traitId:count
```

範例：

```text
shu:1;brave-general:1;power:1;fire:1
```

規則：

- `traitId` 必須存在於 `traits.json` 或最新的 `traits.csv`。
- `count` 必須是數字。
- 多個 trait 用分號 `;` 分隔。
- 不限制 trait 數量。

## 條件欄位格式

`summonUpgradeConditions` 與 `uniqueTacticConditions` 支援兩種條件。

Trait 條件：

```text
trait:traitId:required
```

範例：

```text
trait:brave-general:5
```

指定英傑條件：

```text
officer:officerId
```

範例：

```text
officer:zhang-fei
```

多個條件用分號 `;` 分隔：

```text
trait:brute-force:3;trait:brave-general:3
```

條件類型欄位：

- `summonUpgradeConditionType`：只允許 `all` 或 `any`
- `uniqueTacticConditionType`：只允許 `all` 或 `any`

## officers.json 結構

每名英傑同時支援兩種用途：

- `playerData`：作為操作英傑時使用
- `supportData`：作為隊伍英傑時使用

簡化範例：

```json
{
  "id": "guan-yu",
  "name": "關羽",
  "faction": "shu",
  "factionName": "蜀",
  "level": 36,
  "playerData": {
    "traits": [
      { "traitId": "shu", "count": 1 }
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
      { "traitId": "shu", "count": 1 }
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

## 轉換驗證

`convert-traits-csv.mjs` 會檢查：

- `id` 不可重複
- `name` 不可空白
- `category` 只能是 `ability`、`element`、`special`
- `sort` 必須是數字
- 輸出依 `sort` 排序

`convert-officers-csv.mjs` 會檢查：

- `id` 不可空白且不可重複
- `name`、`faction`、`factionName` 不可空白
- `level`、`summonSkillLevel` 必須是數字
- `playerTraits`、`supportTraits` 格式正確
- trait 條件中的 `traitId` 必須存在於 traits 資料
- officer 條件中的 `officerId` 必須存在於 CSV 的 id 清單
- 條件格式只能是 `trait:traitId:required` 或 `officer:officerId`
- 條件類型只允許 `all` 或 `any`

如果資料錯誤，轉換會停止並顯示類似訊息：

```text
第 3 列欄位 playerTraits 錯誤：traitId "xxx" 不存在於 src/data/traits.json
```

## Build JSON 格式

匯入 / 匯出只保存選擇狀態，不保存完整英傑資料。

```json
{
  "version": 3,
  "playerOfficerId": "guan-yu",
  "teamOfficerIds": ["zhang-fei", "zhao-yun"]
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

## 目前驗證狀態

目前已用內建 Node 執行器成功執行：

```bash
npm run convert:traits
npm run convert:officers
```

並確認：

- `src/data/traits.json` 是合法 JSON
- `src/data/officers.json` 是合法 JSON
- 輸出文字為 UTF-8，繁體中文直接顯示
- 專案檔案沒有殘留中文 Unicode escape

此工作階段的終端機目前找不到 `npm` / `node`，因此無法直接在終端機完成 `npm run build`。在本機 Node.js / npm PATH 正常的環境下，請執行：

```bash
npm run convert:traits
npm run convert:officers
npm run build
```
