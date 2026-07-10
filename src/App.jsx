import { useEffect, useMemo, useState } from 'react';
import officers from './data/officers.json';
import FilterPanel from './components/FilterPanel.jsx';
import OfficerList from './components/OfficerList.jsx';
import SelectedBuild from './components/SelectedBuild.jsx';
import SealStats from './components/SealStats.jsx';
import { UI } from './uiText.js';
import {
  SEAL_TYPES,
  calculateBuildStats,
  emptyBuild,
  filterOfficers,
  getSelectedOfficerIds,
  normalizeBuild,
} from './logic/buildCalculator.js';

const STORAGE_KEY = 'muso-abyss-build-simulator-zh';

function loadSavedBuild() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? normalizeBuild(JSON.parse(saved), officers) : emptyBuild;
  } catch {
    return emptyBuild;
  }
}

export default function App() {
  const [build, setBuild] = useState(loadSavedBuild);
  const [search, setSearch] = useState('');
  const [activeSealTypes, setActiveSealTypes] = useState([]);
  const [filterMode, setFilterMode] = useState('OR');
  const [importText, setImportText] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(build));
  }, [build]);

  const filteredOfficers = useMemo(
    () =>
      filterOfficers(officers, {
        search,
        activeSealTypes,
        mode: filterMode,
      }),
    [search, activeSealTypes, filterMode],
  );

  const stats = useMemo(() => calculateBuildStats(officers, build), [build]);

  function setNoticeBriefly(message) {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2400);
  }

  function selectUnique(officerId) {
    setBuild((current) => ({
      ...current,
      uniqueOfficerId: current.uniqueOfficerId === officerId ? '' : officerId,
    }));
  }

  function selectSummon(officerId) {
    setBuild((current) => ({
      ...current,
      summonOfficerId: current.summonOfficerId === officerId ? '' : officerId,
    }));
  }

  function toggleCompanion(officerId) {
    setBuild((current) => {
      const exists = current.companionIds.includes(officerId);
      return {
        ...current,
        companionIds: exists
          ? current.companionIds.filter((id) => id !== officerId)
          : [...current.companionIds, officerId],
      };
    });
  }

  function toggleLimitBreak(officerId) {
    setBuild((current) => ({
      ...current,
      limitBreaks: {
        ...current.limitBreaks,
        [officerId]: !current.limitBreaks[officerId],
      },
    }));
  }

  function toggleAllLimitBreaks(nextValue) {
    setBuild((current) => {
      const nextLimitBreaks = { ...current.limitBreaks };
      getSelectedOfficerIds(current).forEach((id) => {
        nextLimitBreaks[id] = nextValue;
      });
      return { ...current, limitBreaks: nextLimitBreaks };
    });
  }

  function toggleSealType(type) {
    setActiveSealTypes((current) =>
      current.includes(type)
        ? current.filter((item) => item !== type)
        : [...current, type].filter((item) => SEAL_TYPES.includes(item)),
    );
  }

  function clearBuild() {
    setBuild(emptyBuild);
    setImportText('');
    setNoticeBriefly(UI.clearNotice);
  }

  async function exportBuild() {
    const text = JSON.stringify(build, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setNoticeBriefly(UI.copiedNotice);
    } catch {
      setImportText(text);
      setNoticeBriefly(UI.exportFallbackNotice);
    }
  }

  function importBuild() {
    try {
      const parsed = JSON.parse(importText);
      setBuild(normalizeBuild(parsed, officers));
      setNoticeBriefly(UI.importedNotice);
    } catch {
      setNoticeBriefly(UI.invalidJsonNotice);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p>{UI.appKicker}</p>
          <h1>{UI.appTitle}</h1>
        </div>
        {notice ? <div className="notice" role="status">{notice}</div> : null}
      </header>

      <main className="layout-grid">
        <aside className="left-column">
          <FilterPanel
            search={search}
            onSearchChange={setSearch}
            activeSealTypes={activeSealTypes}
            onToggleSealType={toggleSealType}
            mode={filterMode}
            onModeChange={setFilterMode}
          />
          <OfficerList
            officers={filteredOfficers}
            build={build}
            onSelectUnique={selectUnique}
            onSelectSummon={selectSummon}
            onToggleCompanion={toggleCompanion}
          />
        </aside>

        <SelectedBuild
          build={build}
          stats={stats}
          importText={importText}
          onImportTextChange={setImportText}
          onImport={importBuild}
          onExport={exportBuild}
          onClear={clearBuild}
          onToggleLimitBreak={toggleLimitBreak}
          onToggleAllLimitBreaks={toggleAllLimitBreaks}
          onRemoveUnique={() => selectUnique(build.uniqueOfficerId)}
          onRemoveSummon={() => selectSummon(build.summonOfficerId)}
          onRemoveCompanion={toggleCompanion}
        />

        <SealStats stats={stats} />
      </main>
    </div>
  );
}
