import { RotateCcw, ShieldPlus, Sparkles, Sword, Trash2, Upload, Download } from 'lucide-react';
import { getSelectedOfficerIds, isOfficerLimitBroken } from '../logic/buildCalculator.js';
import { UI } from '../uiText.js';

function SelectedOfficer({ title, icon: Icon, officer, emptyText, build, onToggleLimitBreak, onRemove }) {
  return (
    <div className="selected-block">
      <div className="selected-block__title">
        <Icon size={18} aria-hidden="true" />
        <h3>{title}</h3>
      </div>

      {officer ? (
        <button
          type="button"
          className={isOfficerLimitBroken(build, officer.id) ? 'selected-chip is-limit-broken' : 'selected-chip'}
          onClick={() => onToggleLimitBreak(officer.id)}
          title={UI.limitBreak}
        >
          <span>{officer.name}</span>
          <small>{isOfficerLimitBroken(build, officer.id) ? UI.limitBreak : UI.noLimitBreak}</small>
        </button>
      ) : (
        <div className="empty-state">{emptyText}</div>
      )}

      {officer ? (
        <button type="button" className="text-button" onClick={onRemove}>
          {UI.remove}
        </button>
      ) : null}
    </div>
  );
}

export default function SelectedBuild({
  build,
  stats,
  importText,
  onImportTextChange,
  onImport,
  onExport,
  onClear,
  onToggleLimitBreak,
  onToggleAllLimitBreaks,
  onRemoveUnique,
  onRemoveSummon,
  onRemoveCompanion,
}) {
  const selectedIds = getSelectedOfficerIds(build);
  const allLimitBroken =
    selectedIds.length > 0 && selectedIds.every((id) => isOfficerLimitBroken(build, id));

  return (
    <section className="panel selected-panel" aria-labelledby="selected-title">
      <div className="section-heading">
        <h2 id="selected-title">{UI.selectedTitle}</h2>
      </div>

      <div className="action-grid">
        <button type="button" onClick={() => onToggleAllLimitBreaks(!allLimitBroken)}>
          <RotateCcw size={16} aria-hidden="true" />
          {allLimitBroken ? UI.cancelAllLimitBreak : UI.allLimitBreak}
        </button>
        <button type="button" onClick={onExport}>
          <Download size={16} aria-hidden="true" />
          {UI.export}
        </button>
        <button type="button" className="danger-button" onClick={onClear}>
          <Trash2 size={16} aria-hidden="true" />
          {UI.clear}
        </button>
      </div>

      <SelectedOfficer
        title={UI.uniqueOfficer}
        icon={Sword}
        officer={stats.uniqueOfficer}
        emptyText={UI.noUnique}
        build={build}
        onToggleLimitBreak={onToggleLimitBreak}
        onRemove={onRemoveUnique}
      />

      <SelectedOfficer
        title={UI.summon}
        icon={Sparkles}
        officer={stats.summonOfficer}
        emptyText={UI.noSummon}
        build={build}
        onToggleLimitBreak={onToggleLimitBreak}
        onRemove={onRemoveSummon}
      />

      <div className="selected-block">
        <div className="selected-block__title">
          <ShieldPlus size={18} aria-hidden="true" />
          <h3>{UI.companions}</h3>
        </div>

        {stats.companions.length > 0 ? (
          <div className="selected-chip-list">
            {stats.companions.map((officer) => (
              <div key={officer.id} className="selected-chip-row">
                <button
                  type="button"
                  className={isOfficerLimitBroken(build, officer.id) ? 'selected-chip is-limit-broken' : 'selected-chip'}
                  onClick={() => onToggleLimitBreak(officer.id)}
                  title={UI.limitBreak}
                >
                  <span>{officer.name}</span>
                  <small>{isOfficerLimitBroken(build, officer.id) ? UI.limitBreak : UI.noLimitBreak}</small>
                </button>
                <button type="button" className="icon-button" onClick={() => onRemoveCompanion(officer.id)} title={UI.removeCompanion}>
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">{UI.noCompanion}</div>
        )}
      </div>

      <div className="import-box">
        <label htmlFor="import-json">{UI.importJson}</label>
        <textarea
          id="import-json"
          value={importText}
          onChange={(event) => onImportTextChange(event.target.value)}
          placeholder={UI.importPlaceholder}
          rows={5}
        />
        <button type="button" onClick={onImport}>
          <Upload size={16} aria-hidden="true" />
          {UI.import}
        </button>
      </div>
    </section>
  );
}
