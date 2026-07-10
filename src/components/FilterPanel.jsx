import { Search } from 'lucide-react';
import { SEAL_TYPES } from '../logic/buildCalculator.js';
import { UI } from '../uiText.js';

export default function FilterPanel({
  search,
  onSearchChange,
  activeSealTypes,
  onToggleSealType,
  mode,
  onModeChange,
}) {
  return (
    <section className="panel filter-panel" aria-labelledby="filters-title">
      <div className="section-heading">
        <h2 id="filters-title">{UI.filtersTitle}</h2>
      </div>

      <label className="search-box">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={UI.searchPlaceholder}
        />
      </label>

      <div className="control-group">
        <div className="control-label">{UI.sealCategory}</div>
        <div className="segmented-wrap">
          {SEAL_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className={activeSealTypes.includes(type) ? 'is-active' : ''}
              onClick={() => onToggleSealType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <div className="control-label">{UI.filterMode}</div>
        <div className="segmented-control">
          {['AND', 'OR'].map((item) => (
            <button
              key={item}
              type="button"
              className={mode === item ? 'is-active' : ''}
              onClick={() => onModeChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
