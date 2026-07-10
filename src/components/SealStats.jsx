import { UI } from '../uiText.js';

function SealTable({ title, seals }) {
  const total = seals.reduce((sum, seal) => sum + seal.count, 0);

  return (
    <div className="seal-table">
      <div className="seal-table__title">
        <h3>{title}</h3>
        <span>{total}</span>
      </div>
      {seals.length > 0 ? (
        <ul>
          {seals.map((seal) => (
            <li key={`${title}-${seal.type}-${seal.name}`}>
              <span>
                <small>{seal.type}</small>
                {seal.name}
              </span>
              <strong>{seal.count}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">{UI.noSeals}</div>
      )}
    </div>
  );
}

export default function SealStats({ stats }) {
  return (
    <section className="panel stats-panel" aria-labelledby="stats-title">
      <div className="section-heading">
        <h2 id="stats-title">{UI.statsTitle}</h2>
      </div>

      <div className="stats-stack">
        <SealTable title={UI.uniqueSeals} seals={stats.groups.unique} />
        <SealTable title={UI.companionSeals} seals={stats.groups.companions} />
        <SealTable title={UI.summonSeals} seals={stats.groups.summon} />
        <SealTable title={UI.uniqueAndCompanion} seals={stats.groups.uniqueAndCompanions} />
        <SealTable title={UI.allSeals} seals={stats.groups.all} />
      </div>
    </section>
  );
}
