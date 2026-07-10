import { Check, ShieldPlus, Sparkles, Sword } from 'lucide-react';
import { UI } from '../uiText.js';

function SelectionBadge({ active, label, icon: Icon }) {
  if (!active) return null;

  return (
    <span className="selection-badge">
      <Icon size={14} aria-hidden="true" />
      {label}
    </span>
  );
}

export default function OfficerCard({ officer, selection, onSelectUnique, onSelectSummon, onToggleCompanion }) {
  return (
    <article className="officer-card">
      <div className="officer-card__main">
        <div>
          <div className="officer-card__category">{officer.category}</div>
          <h3>{officer.name}</h3>
        </div>
        <div className="officer-card__badges" aria-label={UI.currentSelectionState}>
          <SelectionBadge active={selection.isUnique} label={UI.uniqueShort} icon={Sword} />
          <SelectionBadge active={selection.isSummon} label={UI.summonShort} icon={Sparkles} />
          <SelectionBadge active={selection.isCompanion} label={UI.companionShort} icon={ShieldPlus} />
        </div>
      </div>

      <div className="tag-row">
        {officer.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <dl className="skill-list">
        <div>
          <dt>{UI.uniqueSkill}</dt>
          <dd>{officer.uniqueSkill.name}</dd>
        </div>
        <div>
          <dt>{UI.summonSkill}</dt>
          <dd>{officer.summonSkill.name}</dd>
        </div>
      </dl>

      <div className="officer-card__actions">
        <button
          type="button"
          className={selection.isUnique ? 'is-active' : ''}
          onClick={() => onSelectUnique(officer.id)}
          title={UI.setUnique}
        >
          <Sword size={16} aria-hidden="true" />
          {UI.uniqueShort}
        </button>
        <button
          type="button"
          className={selection.isSummon ? 'is-active' : ''}
          onClick={() => onSelectSummon(officer.id)}
          title={UI.setSummon}
        >
          <Sparkles size={16} aria-hidden="true" />
          {UI.summonShort}
        </button>
        <button
          type="button"
          className={selection.isCompanion ? 'is-active' : ''}
          onClick={() => onToggleCompanion(officer.id)}
          title={UI.toggleCompanion}
        >
          {selection.isCompanion ? <Check size={16} aria-hidden="true" /> : <ShieldPlus size={16} aria-hidden="true" />}
          {UI.companionShort}
        </button>
      </div>
    </article>
  );
}
