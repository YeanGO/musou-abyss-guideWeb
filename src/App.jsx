import { useEffect, useMemo, useState } from 'react';
import { Check, Download, Search, Trash2, Upload, UserRound, UsersRound, X } from 'lucide-react';
import officers from './data/officers.json';
import traits from './data/traits.json';
import categories from './data/categories.json';
import {
  TRAIT_CATEGORIES,
  calculateBuildResult,
  createTraitMap,
  emptyBuild,
  filterOfficers,
  hydrateTraitEntries,
  normalizeBuild,
} from './logic/buildCalculator.js';

const STORAGE_KEY = 'muso-abyss-build-simulator-v3';

const T = {
  appKicker: '\u624b\u52d5 Build Simulator',
  appTitle: '\u7121\u96d9\u6df1\u6df5 Build Simulator \u4e2d\u6587\u7248',
  playerOfficer: '\u64cd\u4f5c\u82f1\u5091',
  teamOfficers: '\u968a\u4f0d\u82f1\u5091',
  noPlayer: '\u5c1a\u672a\u9078\u64c7\u64cd\u4f5c\u82f1\u5091',
  noTeam: '\u5c1a\u672a\u9078\u64c7\u968a\u4f0d\u82f1\u5091',
  playerRule: '\u64cd\u4f5c\u82f1\u5091\u6703\u8a08\u5165\u5c6c\u6027\u52a0\u7e3d\uff0c\u4f46\u4e0d\u6703\u6aa2\u67e5\u53ec\u559a\u6280\u8207\u56fa\u6709\u6230\u6cd5\u3002',
  selectedTeamCount: '\u968a\u4f0d',
  people: '\u4eba',
  traitTotal: 'Trait \u7e3d\u91cf',
  activeUnique: '\u5df2\u767c\u52d5\u56fa\u6709\u6230\u6cd5',
  inactiveUnique: '\u672a\u767c\u52d5\u56fa\u6709\u6230\u6cd5',
  upgradedSummon: '\u5df2\u5f37\u5316\u53ec\u559a\u6280',
  notUpgradedSummon: '\u672a\u5f37\u5316\u53ec\u559a\u6280',
  clear: '\u6e05\u7a7a',
  export: '\u532f\u51fa',
  import: '\u532f\u5165',
  copied: '\u5df2\u8907\u88fd\u914d\u7f6e JSON',
  exportFallback: '\u5df2\u653e\u5165\u532f\u5165\u6b04\u4f4d\uff0c\u53ef\u624b\u52d5\u8907\u88fd',
  imported: '\u5df2\u532f\u5165\u914d\u7f6e',
  invalidJson: 'JSON \u683c\u5f0f\u7121\u6cd5\u8b80\u53d6',
  cleared: '\u5df2\u6e05\u7a7a\u76ee\u524d Build',
  remove: '\u79fb\u9664',
  setPlayer: '\u8a2d\u70ba\u64cd\u4f5c',
  addTeam: '\u52a0\u5165\u968a\u4f0d',
  removeTeam: '\u79fb\u51fa\u968a\u4f0d',
  officerList: '\u82f1\u5091\u9078\u64c7',
  searchPlaceholder: '\u641c\u5c0b\u82f1\u5091\u3001\u52e2\u529b\u3001trait\u3001\u64cd\u4f5c\u7279\u6027\u3001\u53ec\u559a\u6280\u6216\u56fa\u6709\u6230\u6cd5',
  faction: '\u52e2\u529b',
  all: '\u5168\u90e8',
  traitCategory: 'Trait \u5206\u985e',
  statusFilter: '\u72c0\u614b\u7be9\u9078',
  allOfficers: '\u5168\u90e8\u82f1\u5091',
  onlyPlayer: '\u64cd\u4f5c',
  onlyTeam: '\u968a\u4f0d',
  uniqueActive: '\u56fa\u6709\u5df2\u767c\u52d5',
  summonUpgraded: '\u53ec\u559a\u5df2\u5f37\u5316',
  currentBuild: '\u76ee\u524d Build',
  uniqueTactic: '\u56fa\u6709\u6230\u6cd5',
  summonSkill: '\u53ec\u559a\u6280',
  operationTrait: '\u64cd\u4f5c\u7279\u6027',
  weaponBreakthrough: '\u6b66\u5668\u7a81\u7834\u6548\u679c',
  specialWeapon: '\u6301\u6709\u7279\u6b66',
  limitBreak: '\u9650\u754c\u7a81\u7834',
  passed: '\u9054\u6210',
  missing: '\u5c1a\u7f3a',
  noTraits: '\u5c1a\u7121 trait',
  noActivatedUnique: '\u76ee\u524d\u6c92\u6709\u5df2\u767c\u52d5\u7684\u56fa\u6709\u6230\u6cd5',
  noInactiveUnique: '\u76ee\u524d\u6c92\u6709\u672a\u767c\u52d5\u7684\u56fa\u6709\u6230\u6cd5',
  noUpgradedSummon: '\u76ee\u524d\u6c92\u6709\u5df2\u5f37\u5316\u7684\u53ec\u559a\u6280',
  noNotUpgradedSummon: '\u76ee\u524d\u6c92\u6709\u672a\u5f37\u5316\u7684\u53ec\u559a\u6280',
  importJson: '\u532f\u5165 JSON \u914d\u7f6e',
  importPlaceholder: '\u8cbc\u4e0a\u532f\u51fa\u7684 Build JSON',
  level: 'Lv.',
};

function loadSavedBuild() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeBuild(JSON.parse(saved), officers) : emptyBuild;
  } catch {
    return emptyBuild;
  }
}

function TraitPill({ trait, count }) {
  return (
    <button type="button" className={['trait-pill', `trait-pill--${trait.category}`].join(' ')}>
      <span>{trait.name}</span>
      {typeof count === 'number' ? <strong>{count}</strong> : null}
    </button>
  );
}

function TraitList({ items, emptyText = T.noTraits }) {
  if (items.length === 0) return <div className="empty-state">{emptyText}</div>;

  return (
    <div className="trait-list">
      {items.map((trait) => (
        <TraitPill key={trait.id} trait={trait} count={trait.count} />
      ))}
    </div>
  );
}

function InfoBlock({ title, item }) {
  if (!item) return null;

  return (
    <article className="info-block">
      <span>{title}</span>
      <strong>{item.name}</strong>
      <p>{item.description}</p>
    </article>
  );
}

function OfficerSummary({ officer, emptyText, action }) {
  if (!officer) return <div className="empty-state">{emptyText}</div>;

  return (
    <article className="selected-summary">
      <div>
        <span>{officer.factionName} / {T.level}{officer.level}</span>
        <strong>{officer.name}</strong>
      </div>
      {action}
    </article>
  );
}

function PlayerDetails({ officer, playerStatus, traitMap }) {
  if (!officer) return null;

  return (
    <div className="player-details">
      <TraitList items={hydrateTraitEntries(officer.playerData?.traits ?? [], traitMap)} />
      <InfoBlock title={T.operationTrait} item={playerStatus.operationTrait} />
      <div className="breakthrough-grid">
        <InfoBlock title={T.specialWeapon} item={playerStatus.weaponBreakthrough.specialWeapon} />
        <InfoBlock title={T.limitBreak} item={playerStatus.weaponBreakthrough.limitBreak} />
      </div>
    </div>
  );
}

function MissingList({ missing }) {
  if (!missing || missing.length === 0) return null;

  return (
    <ul className="missing-list">
      {missing.map((item) => (
        <li key={`${item.type}-${item.traitId ?? item.officerId}`}>
          {item.type === 'trait'
            ? `${item.traitName} ${item.current}/${item.required} (${T.missing} ${item.missing})`
            : `${T.missing} ${item.officerName}`}
        </li>
      ))}
    </ul>
  );
}

function StatusBadge({ passed }) {
  return <span className={passed ? 'status-badge is-passed' : 'status-badge'}>{passed ? T.passed : T.missing}</span>;
}

function SupportSkillPreview({ officer, status }) {
  return (
    <div className="skill-grid">
      <div>
        <span>{T.uniqueTactic}</span>
        <strong>{officer.supportData.uniqueTactic.name}</strong>
        <p>{officer.supportData.uniqueTactic.description}</p>
        <MissingList missing={status.uniqueTactic.missing} />
      </div>
      <div>
        <span>{T.summonSkill}</span>
        <strong>{officer.supportData.summonSkill.name}</strong>
        <p>{officer.supportData.summonSkill.description}</p>
        <MissingList missing={status.summonSkill.missing} />
      </div>
    </div>
  );
}

function OfficerCard({ officer, status, build, traitMap, onSetPlayer, onToggleTeam }) {
  const isPlayer = build.playerOfficerId === officer.id;
  const isTeam = build.teamOfficerIds.includes(officer.id);
  const traitItems = hydrateTraitEntries(officer.supportData?.traits ?? [], traitMap);

  return (
    <article className={isPlayer ? 'officer-card is-player' : 'officer-card'}>
      <div className="officer-card__main">
        <div>
          <div className="eyebrow">{officer.factionName} / {T.level}{officer.level}</div>
          <h3>{officer.name}</h3>
        </div>
        <div className="status-pair">
          <StatusBadge passed={status.uniqueTactic.passed} />
          <StatusBadge passed={status.summonSkill.passed} />
        </div>
      </div>

      <TraitList items={traitItems} />
      <SupportSkillPreview officer={officer} status={status} />

      <div className="officer-card__actions">
        <button type="button" className={isPlayer ? 'is-active' : ''} onClick={() => onSetPlayer(officer.id)}>
          <UserRound size={16} aria-hidden="true" />
          {T.setPlayer}
        </button>
        <button type="button" className={isTeam ? 'is-active' : ''} disabled={isPlayer} onClick={() => onToggleTeam(officer.id)}>
          {isTeam ? <Check size={16} aria-hidden="true" /> : <UsersRound size={16} aria-hidden="true" />}
          {isTeam ? T.removeTeam : T.addTeam}
        </button>
      </div>
    </article>
  );
}

function TeamOfficerDetail({ officer, status, traitMap, onRemove }) {
  return (
    <article className="team-detail">
      <OfficerSummary
        officer={officer}
        action={
          <button type="button" className="icon-button" title={T.remove} onClick={() => onRemove(officer.id)}>
            <X size={16} aria-hidden="true" />
          </button>
        }
      />
      <TraitList items={hydrateTraitEntries(officer.supportData?.traits ?? [], traitMap)} />
      <SupportSkillPreview officer={officer} status={status} />
    </article>
  );
}

function ResultList({ title, items, kind, emptyText }) {
  return (
    <section className="result-block">
      <div className="result-block__head">
        <h3>{title}</h3>
        <strong>{items.length}</strong>
      </div>
      {items.length === 0 ? (
        <div className="empty-state">{emptyText}</div>
      ) : (
        <div className="result-list">
          {items.map((item) => {
            const result = kind === 'unique' ? item.uniqueTactic : item.summonSkill;
            return (
              <article key={`${kind}-${item.officerId}`} className="result-item">
                <strong>{item.officerName} - {result.name}</strong>
                <MissingList missing={result.missing} />
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function App() {
  const [build, setBuild] = useState(loadSavedBuild);
  const [search, setSearch] = useState('');
  const [activeFaction, setActiveFaction] = useState('');
  const [activeTraitCategories, setActiveTraitCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [importText, setImportText] = useState('');
  const [notice, setNotice] = useState('');

  const traitMap = useMemo(() => createTraitMap(traits), []);
  const result = useMemo(() => calculateBuildResult(officers, traits, build), [build]);
  const allStatusMap = useMemo(() => new Map(result.allOfficerStatuses.map((status) => [status.officerId, status])), [result]);
  const teamStatusMap = useMemo(() => new Map(result.officerStatuses.map((status) => [status.officerId, status])), [result]);
  const filteredOfficers = useMemo(
    () =>
      filterOfficers(officers, traits, {
        search,
        faction: activeFaction,
        activeTraitCategories,
        statusFilter,
        result,
      }),
    [search, activeFaction, activeTraitCategories, statusFilter, result],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(build));
  }, [build]);

  function setNoticeBriefly(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  }

  function updateBuild(updater) {
    setBuild((current) => normalizeBuild(updater(current), officers));
  }

  function setPlayer(officerId) {
    updateBuild((current) => ({
      ...current,
      playerOfficerId: current.playerOfficerId === officerId ? '' : officerId,
      teamOfficerIds: current.teamOfficerIds.filter((id) => id !== officerId),
    }));
  }

  function toggleTeam(officerId) {
    updateBuild((current) => {
      if (current.playerOfficerId === officerId) return current;
      const exists = current.teamOfficerIds.includes(officerId);
      return {
        ...current,
        teamOfficerIds: exists ? current.teamOfficerIds.filter((id) => id !== officerId) : [...current.teamOfficerIds, officerId],
      };
    });
  }

  function clearBuild() {
    setBuild(emptyBuild);
    setSearch('');
    setActiveFaction('');
    setActiveTraitCategories([]);
    setStatusFilter('all');
    setImportText('');
    setNoticeBriefly(T.cleared);
  }

  async function exportBuild() {
    const text = JSON.stringify(build, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setNoticeBriefly(T.copied);
    } catch {
      setImportText(text);
      setNoticeBriefly(T.exportFallback);
    }
  }

  function importBuild() {
    try {
      setBuild(normalizeBuild(JSON.parse(importText), officers));
      setNoticeBriefly(T.imported);
    } catch {
      setNoticeBriefly(T.invalidJson);
    }
  }

  function toggleTraitCategory(categoryId) {
    setActiveTraitCategories((current) =>
      current.includes(categoryId) ? current.filter((id) => id !== categoryId) : [...current, categoryId],
    );
  }

  const statusOptions = [
    { id: 'all', label: T.allOfficers },
    { id: 'player', label: T.onlyPlayer },
    { id: 'team', label: T.onlyTeam },
    { id: 'unique-active', label: T.uniqueActive },
    { id: 'summon-upgraded', label: T.summonUpgraded },
  ];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p>{T.appKicker}</p>
          <h1>{T.appTitle}</h1>
        </div>
        {notice ? <div className="notice" role="status">{notice}</div> : null}
      </header>

      <main className="workbench">
        <section className="toolbar panel">
          <div className="toolbar__summary">
            <span>{T.selectedTeamCount} {build.teamOfficerIds.length} {T.people}</span>
            <span>{T.traitTotal} {Object.values(result.traitTotals).reduce((sum, count) => sum + count, 0)}</span>
            <span>{T.activeUnique} {result.activatedUniqueTactics.length}</span>
            <span>{T.upgradedSummon} {result.upgradedSummonSkills.length}</span>
          </div>
          <div className="toolbar__actions">
            <button type="button" onClick={exportBuild}>
              <Download size={16} aria-hidden="true" />
              {T.export}
            </button>
            <button type="button" className="danger-button" onClick={clearBuild}>
              <Trash2 size={16} aria-hidden="true" />
              {T.clear}
            </button>
          </div>
        </section>

        <section className="selection-grid selection-grid--v3">
          <section className="slot-card">
            <div className="slot-card__head">
              <div>
                <UserRound size={18} aria-hidden="true" />
                <h2>{T.playerOfficer}</h2>
              </div>
            </div>
            <p className="rule-note">{T.playerRule}</p>
            <OfficerSummary
              officer={result.playerOfficer}
              emptyText={T.noPlayer}
              action={
                result.playerOfficer ? (
                  <button type="button" className="icon-button" title={T.remove} onClick={() => setPlayer(result.playerOfficer.id)}>
                    <X size={16} aria-hidden="true" />
                  </button>
                ) : null
              }
            />
            <PlayerDetails officer={result.playerOfficer} playerStatus={result.playerStatus} traitMap={traitMap} />
          </section>

          <section className="slot-card slot-card--wide">
            <div className="slot-card__head">
              <div>
                <UsersRound size={18} aria-hidden="true" />
                <h2>{T.teamOfficers}</h2>
              </div>
              <span>{result.teamOfficers.length} {T.people}</span>
            </div>
            {result.teamOfficers.length === 0 ? (
              <div className="empty-state">{T.noTeam}</div>
            ) : (
              <div className="team-summary-list">
                {result.teamOfficers.map((officer) => (
                  <TeamOfficerDetail
                    key={officer.id}
                    officer={officer}
                    status={teamStatusMap.get(officer.id)}
                    traitMap={traitMap}
                    onRemove={toggleTeam}
                  />
                ))}
              </div>
            )}
          </section>
        </section>

        <section className="planner-grid">
          <aside className="panel filter-console">
            <div className="section-heading">
              <h2>{T.officerList}</h2>
              <span>{filteredOfficers.length} {T.people}</span>
            </div>

            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={T.searchPlaceholder} />
            </label>

            <div className="control-group">
              <div className="control-label">{T.faction}</div>
              <div className="segmented-wrap">
                <button type="button" className={!activeFaction ? 'is-active' : ''} onClick={() => setActiveFaction('')}>
                  {T.all}
                </button>
                {categories.map((category) => (
                  <button key={category.id} type="button" className={activeFaction === category.id ? 'is-active' : ''} onClick={() => setActiveFaction(category.id)}>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <div className="control-label">{T.traitCategory}</div>
              <div className="segmented-wrap">
                {TRAIT_CATEGORIES.map((category) => (
                  <button key={category.id} type="button" className={activeTraitCategories.includes(category.id) ? 'is-active' : ''} onClick={() => toggleTraitCategory(category.id)}>
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="control-group">
              <div className="control-label">{T.statusFilter}</div>
              <div className="segmented-wrap">
                {statusOptions.map((option) => (
                  <button key={option.id} type="button" className={statusFilter === option.id ? 'is-active' : ''} onClick={() => setStatusFilter(option.id)}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="panel candidate-panel">
            <div className="candidate-list">
              {filteredOfficers.map((officer) => (
                <OfficerCard
                  key={officer.id}
                  officer={officer}
                  status={allStatusMap.get(officer.id)}
                  build={build}
                  traitMap={traitMap}
                  onSetPlayer={setPlayer}
                  onToggleTeam={toggleTeam}
                />
              ))}
            </div>
          </section>

          <aside className="panel stat-panel">
            <div className="section-heading">
              <h2>{T.currentBuild}</h2>
            </div>

            <div className="stats-stack">
              {TRAIT_CATEGORIES.map((category) => (
                <section key={category.id} className="stat-block">
                  <div className="stat-block__head">
                    <h3>{category.name}</h3>
                    <strong>{result.traitGroups[category.id].reduce((sum, item) => sum + item.count, 0)}</strong>
                  </div>
                  <TraitList items={result.traitGroups[category.id]} />
                </section>
              ))}
            </div>

            <div className="condition-stack">
              <ResultList title={T.activeUnique} items={result.activatedUniqueTactics} kind="unique" emptyText={T.noActivatedUnique} />
              <ResultList title={T.inactiveUnique} items={result.inactiveUniqueTactics} kind="unique" emptyText={T.noInactiveUnique} />
              <ResultList title={T.upgradedSummon} items={result.upgradedSummonSkills} kind="summon" emptyText={T.noUpgradedSummon} />
              <ResultList title={T.notUpgradedSummon} items={result.notUpgradedSummonSkills} kind="summon" emptyText={T.noNotUpgradedSummon} />
            </div>

            <div className="import-box">
              <label htmlFor="import-json">{T.importJson}</label>
              <textarea id="import-json" value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={T.importPlaceholder} rows={5} />
              <button type="button" onClick={importBuild}>
                <Upload size={16} aria-hidden="true" />
                {T.import}
              </button>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
