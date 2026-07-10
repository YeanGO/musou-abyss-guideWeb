import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Download,
  RotateCcw,
  Search,
  ShieldPlus,
  Sparkles,
  Sword,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import officers from './data/officers.json';
import seals from './data/seals.json';
import categories from './data/categories.json';
import {
  SEAL_TYPES,
  calculateBuildStats,
  createSealMap,
  emptyBuild,
  filterOfficers,
  getSelectedOfficerIds,
  hydrateSeals,
  isOfficerLimitBroken,
  normalizeBuild,
} from './logic/buildCalculator.js';

const STORAGE_KEY = 'muso-abyss-build-simulator-zh-v2';

const T = {
  noSeals: '\u5c1a\u7121\u5370',
  remove: '\u79fb\u9664',
  limitBreak: '\u9650\u754c\u7a81\u7834',
  noLimitBreak: '\u672a\u7a81\u7834',
  companions: '\u96a8\u884c\u6b66\u5c07',
  people: '\u4eba',
  noCompanions: '\u5c1a\u672a\u9078\u64c7\u96a8\u884c\u6b66\u5c07',
  matchedSeals: '\u547d\u4e2d\u5370',
  uniqueShort: '\u56fa\u6709',
  summonShort: '\u53ec\u559a',
  companionShort: '\u96a8\u884c',
  noMatchedTarget: '\u6c92\u6709\u7b26\u5408\u76ee\u524d\u76ee\u6a19\u5370',
  clearNotice: '\u5df2\u6e05\u7a7a\u76ee\u524d\u914d\u7f6e',
  copiedNotice: '\u5df2\u8907\u88fd\u914d\u7f6e JSON',
  exportFallbackNotice: '\u5df2\u653e\u5165\u532f\u5165\u6b04\u4f4d\uff0c\u53ef\u624b\u52d5\u8907\u88fd',
  importedNotice: '\u5df2\u532f\u5165\u914d\u7f6e',
  invalidJsonNotice: 'JSON \u683c\u5f0f\u7121\u6cd5\u8b80\u53d6',
  appKicker: '\u672c\u5730\u4e2d\u6587\u7248\u5de5\u5177',
  appTitle: '\u7121\u96d9\u6df1\u6df5 Build Simulator \u4e2d\u6587\u7248',
  selected: '\u5df2\u9078',
  targetSeals: '\u76ee\u6a19\u5370',
  achieved: '\u5df2\u9054\u6210',
  cancelAllLimitBreak: '\u53d6\u6d88\u5168\u54e1\u7a81\u7834',
  allLimitBreak: '\u5168\u54e1\u9650\u754c\u7a81\u7834',
  export: '\u532f\u51fa',
  clear: '\u6e05\u7a7a',
  uniqueSkill: '\u56fa\u6709\u6230\u6cd5',
  selectUniqueHint: '\u5f9e\u5019\u9078\u6b66\u5c07\u9078\u64c7\u56fa\u6709\u6230\u6cd5',
  summonSkill: '\u53ec\u559a\u6280',
  selectSummonHint: '\u5f9e\u5019\u9078\u6b66\u5c07\u9078\u64c7\u53ec\u559a\u6280',
  sealFilter: '\u6536\u96c6\u5370\u7be9\u9078',
  clearTarget: '\u6e05\u9664\u76ee\u6a19',
  searchPlaceholder: '\u641c\u5c0b\u6b66\u5c07\u3001\u52e2\u529b\u6216\u6a19\u7c64',
  filterMode: '\u7be9\u9078\u6a21\u5f0f',
  faction: '\u52e2\u529b',
  all: '\u5168\u90e8',
  sealCategory: '\u5370\u5206\u985e',
  targetStatus: '\u76ee\u6a19\u9054\u6210\u72c0\u614b',
  noAchievedTarget: '\u5c1a\u672a\u9054\u6210\u4efb\u4f55\u76ee\u6a19\u5370',
  missing: '\u5c1a\u7f3a',
  noMissingTarget: '\u6c92\u6709\u5c1a\u7f3a\u76ee\u6a19\u5370',
  candidates: '\u5019\u9078\u6b66\u5c07',
  stats: '\u5370\u7d71\u8a08',
  uniqueSeals: '\u56fa\u6709\u6230\u6cd5\u5370',
  companionSeals: '\u96a8\u884c\u6b66\u5c07\u5370',
  summonSeals: '\u53ec\u559a\u6280\u5370',
  uniqueAndCompanion: '\u56fa\u6709 + \u96a8\u884c\u5408\u8a08',
  allSeals: '\u6536\u96c6\u5370\u5217\u8868 / \u5168\u5370\u5408\u8a08',
  importJson: '\u532f\u5165 JSON \u914d\u7f6e',
  importPlaceholder: '\u8cbc\u4e0a\u532f\u51fa\u7684\u914d\u7f6e JSON',
  import: '\u532f\u5165',
};

function loadSavedBuild() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeBuild(JSON.parse(saved), officers, seals) : emptyBuild;
  } catch {
    return emptyBuild;
  }
}

function SealPill({ seal, active, count, onClick, muted }) {
  return (
    <button
      type="button"
      className={[
        'seal-pill',
        active ? 'is-active' : '',
        muted ? 'is-muted' : '',
        `seal-pill--${seal.type}`,
      ].join(' ')}
      onClick={onClick}
    >
      <span>{seal.name}</span>
      {count ? <strong>{count}</strong> : null}
    </button>
  );
}

function SealList({ seals: sealItems, emptyText = T.noSeals }) {
  if (sealItems.length === 0) return <div className="empty-state">{emptyText}</div>;

  return (
    <div className="seal-list">
      {sealItems.map((seal) => (
        <SealPill key={seal.id} seal={seal} count={seal.count} muted />
      ))}
    </div>
  );
}

function SlotCard({ title, icon: Icon, officer, emptyText, build, onToggleLimitBreak, onRemove, seals: slotSeals }) {
  return (
    <section className="slot-card">
      <div className="slot-card__head">
        <div>
          <Icon size={18} aria-hidden="true" />
          <h2>{title}</h2>
        </div>
        {officer ? (
          <button type="button" className="icon-button" onClick={onRemove} title={T.remove}>
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {officer ? (
        <>
          <button
            type="button"
            className={isOfficerLimitBroken(build, officer.id) ? 'selected-officer is-limit-broken' : 'selected-officer'}
            onClick={() => onToggleLimitBreak(officer.id)}
          >
            <span>{officer.name}</span>
            <small>{isOfficerLimitBroken(build, officer.id) ? T.limitBreak : T.noLimitBreak}</small>
          </button>
          <SealList seals={slotSeals} />
        </>
      ) : (
        <div className="empty-state">{emptyText}</div>
      )}
    </section>
  );
}

function CompanionSlot({ companions, build, onToggleLimitBreak, onRemove, sealMap }) {
  return (
    <section className="slot-card slot-card--wide">
      <div className="slot-card__head">
        <div>
          <ShieldPlus size={18} aria-hidden="true" />
          <h2>{T.companions}</h2>
        </div>
        <span>{companions.length} {T.people}</span>
      </div>

      {companions.length === 0 ? (
        <div className="empty-state">{T.noCompanions}</div>
      ) : (
        <div className="companion-list">
          {companions.map((officer) => (
            <article key={officer.id} className="companion-item">
              <button
                type="button"
                className={isOfficerLimitBroken(build, officer.id) ? 'selected-officer is-limit-broken' : 'selected-officer'}
                onClick={() => onToggleLimitBreak(officer.id)}
              >
                <span>{officer.name}</span>
                <small>{isOfficerLimitBroken(build, officer.id) ? T.limitBreak : T.noLimitBreak}</small>
              </button>
              <SealList seals={hydrateSeals(officer.companionSeals, sealMap)} />
              <button type="button" className="text-danger" onClick={() => onRemove(officer.id)}>
                {T.remove}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function OfficerCandidate({ officer, match, build, sealMap, onSelectUnique, onSelectSummon, onToggleCompanion }) {
  const matchedSeals = match.matchedSealIds.map((id) => sealMap.get(id)).filter(Boolean);
  const allSeals = hydrateSeals(
    [...officer.companionSeals, ...officer.uniqueSkill.seals, ...officer.summonSkill.seals],
    sealMap,
  );

  return (
    <article className="candidate-card">
      <div className="candidate-card__main">
        <div>
          <div className="eyebrow">{officer.factionName}</div>
          <h3>{officer.name}</h3>
          <div className="tag-row">
            {officer.roles.map((role) => (
              <span key={role}>{role}</span>
            ))}
          </div>
        </div>
        <div className="candidate-card__match">
          <strong>{matchedSeals.length}</strong>
          <span>{T.matchedSeals}</span>
        </div>
      </div>

      <div className="candidate-skills">
        <div>
          <span>{T.uniqueShort}</span>
          <strong>{officer.uniqueSkill.name}</strong>
        </div>
        <div>
          <span>{T.summonShort}</span>
          <strong>{officer.summonSkill.name}</strong>
        </div>
      </div>

      <SealList seals={matchedSeals.length > 0 ? matchedSeals : allSeals} emptyText={T.noMatchedTarget} />

      <div className="candidate-card__actions">
        <button type="button" className={build.uniqueOfficerId === officer.id ? 'is-active' : ''} onClick={() => onSelectUnique(officer.id)}>
          <Sword size={16} aria-hidden="true" />
          {T.uniqueShort}
        </button>
        <button type="button" className={build.summonOfficerId === officer.id ? 'is-active' : ''} onClick={() => onSelectSummon(officer.id)}>
          <Sparkles size={16} aria-hidden="true" />
          {T.summonShort}
        </button>
        <button type="button" className={build.companionIds.includes(officer.id) ? 'is-active' : ''} onClick={() => onToggleCompanion(officer.id)}>
          {build.companionIds.includes(officer.id) ? <Check size={16} aria-hidden="true" /> : <ShieldPlus size={16} aria-hidden="true" />}
          {T.companionShort}
        </button>
      </div>
    </article>
  );
}

function StatBlock({ title, seals: sealItems }) {
  const total = sealItems.reduce((sum, seal) => sum + seal.count, 0);

  return (
    <section className="stat-block">
      <div className="stat-block__head">
        <h3>{title}</h3>
        <strong>{total}</strong>
      </div>
      <SealList seals={sealItems} />
    </section>
  );
}

export default function App() {
  const [build, setBuild] = useState(loadSavedBuild);
  const [search, setSearch] = useState('');
  const [activeSealTypes, setActiveSealTypes] = useState([]);
  const [activeFaction, setActiveFaction] = useState('');
  const [importText, setImportText] = useState('');
  const [notice, setNotice] = useState('');

  const sealMap = useMemo(() => createSealMap(seals), []);
  const stats = useMemo(() => calculateBuildStats(officers, seals, build), [build]);
  const filteredOfficers = useMemo(
    () =>
      filterOfficers(officers, seals, {
        search,
        targetSealIds: build.targetSealIds,
        mode: build.filterMode,
        activeSealTypes,
        faction: activeFaction,
      }),
    [search, build.targetSealIds, build.filterMode, activeSealTypes, activeFaction],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(build));
  }, [build]);

  function setNoticeBriefly(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  }

  function updateBuild(updater) {
    setBuild((current) => normalizeBuild(updater(current), officers, seals));
  }

  function selectUnique(officerId) {
    updateBuild((current) => ({ ...current, uniqueOfficerId: current.uniqueOfficerId === officerId ? '' : officerId }));
  }

  function selectSummon(officerId) {
    updateBuild((current) => ({ ...current, summonOfficerId: current.summonOfficerId === officerId ? '' : officerId }));
  }

  function toggleCompanion(officerId) {
    updateBuild((current) => {
      const exists = current.companionIds.includes(officerId);
      return {
        ...current,
        companionIds: exists ? current.companionIds.filter((id) => id !== officerId) : [...current.companionIds, officerId],
      };
    });
  }

  function toggleLimitBreak(officerId) {
    updateBuild((current) => ({
      ...current,
      limitBreaks: { ...current.limitBreaks, [officerId]: !current.limitBreaks[officerId] },
    }));
  }

  function toggleAllLimitBreaks(nextValue) {
    updateBuild((current) => {
      const nextLimitBreaks = { ...current.limitBreaks };
      getSelectedOfficerIds(current).forEach((id) => {
        nextLimitBreaks[id] = nextValue;
      });
      return { ...current, limitBreaks: nextLimitBreaks };
    });
  }

  function toggleTargetSeal(sealId) {
    updateBuild((current) => ({
      ...current,
      targetSealIds: current.targetSealIds.includes(sealId)
        ? current.targetSealIds.filter((id) => id !== sealId)
        : [...current.targetSealIds, sealId],
    }));
  }

  function toggleSealType(type) {
    setActiveSealTypes((current) => (current.includes(type) ? current.filter((item) => item !== type) : [...current, type]));
  }

  function clearBuild() {
    setBuild(emptyBuild);
    setSearch('');
    setActiveSealTypes([]);
    setActiveFaction('');
    setImportText('');
    setNoticeBriefly(T.clearNotice);
  }

  async function exportBuild() {
    const text = JSON.stringify(build, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setNoticeBriefly(T.copiedNotice);
    } catch {
      setImportText(text);
      setNoticeBriefly(T.exportFallbackNotice);
    }
  }

  function importBuild() {
    try {
      setBuild(normalizeBuild(JSON.parse(importText), officers, seals));
      setNoticeBriefly(T.importedNotice);
    } catch {
      setNoticeBriefly(T.invalidJsonNotice);
    }
  }

  const selectedIds = getSelectedOfficerIds(build);
  const allLimitBroken = selectedIds.length > 0 && selectedIds.every((id) => isOfficerLimitBroken(build, id));

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
            <span>{T.selected} {selectedIds.length} {T.people}</span>
            <span>{T.targetSeals} {build.targetSealIds.length} {String.fromCharCode(0x500b)}</span>
            <span>{T.achieved} {stats.target.achieved.length} / {stats.target.selected.length}</span>
          </div>
          <div className="toolbar__actions">
            <button type="button" onClick={() => toggleAllLimitBreaks(!allLimitBroken)}>
              <RotateCcw size={16} aria-hidden="true" />
              {allLimitBroken ? T.cancelAllLimitBreak : T.allLimitBreak}
            </button>
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

        <section className="selection-grid">
          <SlotCard title={T.uniqueSkill} icon={Sword} officer={stats.uniqueOfficer} emptyText={T.selectUniqueHint} build={build} onToggleLimitBreak={toggleLimitBreak} onRemove={() => selectUnique(build.uniqueOfficerId)} seals={stats.groups.unique} />
          <SlotCard title={T.summonSkill} icon={Sparkles} officer={stats.summonOfficer} emptyText={T.selectSummonHint} build={build} onToggleLimitBreak={toggleLimitBreak} onRemove={() => selectSummon(build.summonOfficerId)} seals={stats.groups.summon} />
          <CompanionSlot companions={stats.companions} build={build} onToggleLimitBreak={toggleLimitBreak} onRemove={toggleCompanion} sealMap={sealMap} />
        </section>

        <section className="planner-grid">
          <aside className="panel filter-console">
            <div className="section-heading">
              <h2>{T.sealFilter}</h2>
              <button type="button" className="text-button" onClick={() => updateBuild((current) => ({ ...current, targetSealIds: [] }))}>
                {T.clearTarget}
              </button>
            </div>

            <label className="search-box">
              <Search size={18} aria-hidden="true" />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={T.searchPlaceholder} />
            </label>

            <div className="control-group">
              <div className="control-label">{T.filterMode}</div>
              <div className="segmented-control">
                {['AND', 'OR'].map((mode) => (
                  <button key={mode} type="button" className={build.filterMode === mode ? 'is-active' : ''} onClick={() => updateBuild((current) => ({ ...current, filterMode: mode }))}>
                    {mode}
                  </button>
                ))}
              </div>
            </div>

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
              <div className="control-label">{T.sealCategory}</div>
              <div className="segmented-wrap">
                {SEAL_TYPES.map((type) => (
                  <button key={type.id} type="button" className={activeSealTypes.includes(type.id) ? 'is-active' : ''} onClick={() => toggleSealType(type.id)}>
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="seal-picker">
              {SEAL_TYPES.map((type) => {
                const typedSeals = seals.filter((seal) => seal.type === type.id).sort((a, b) => a.sort - b.sort);
                return (
                  <div key={type.id} className="seal-picker__group">
                    <h3>{type.name}</h3>
                    <div className="seal-list">
                      {typedSeals.map((seal) => (
                        <SealPill key={seal.id} seal={seal} active={build.targetSealIds.includes(seal.id)} onClick={() => toggleTargetSeal(seal.id)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="target-status">
              <h3>{T.targetStatus}</h3>
              <div>
                <span>{T.achieved}</span>
                <SealList seals={stats.target.achieved} emptyText={T.noAchievedTarget} />
              </div>
              <div>
                <span>{T.missing}</span>
                <SealList seals={stats.target.missing} emptyText={T.noMissingTarget} />
              </div>
            </div>
          </aside>

          <section className="panel candidate-panel">
            <div className="section-heading">
              <h2>{T.candidates}</h2>
              <span>{filteredOfficers.length} {T.people}</span>
            </div>
            <div className="candidate-list">
              {filteredOfficers.map(({ officer, match }) => (
                <OfficerCandidate key={officer.id} officer={officer} match={match} build={build} sealMap={sealMap} onSelectUnique={selectUnique} onSelectSummon={selectSummon} onToggleCompanion={toggleCompanion} />
              ))}
            </div>
          </section>

          <aside className="panel stat-panel">
            <div className="section-heading">
              <h2>{T.stats}</h2>
            </div>
            <div className="stats-stack">
              <StatBlock title={T.uniqueSeals} seals={stats.groups.unique} />
              <StatBlock title={T.companionSeals} seals={stats.groups.companions} />
              <StatBlock title={T.summonSeals} seals={stats.groups.summon} />
              <StatBlock title={T.uniqueAndCompanion} seals={stats.groups.uniqueAndCompanions} />
              <StatBlock title={T.allSeals} seals={stats.groups.all} />
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
