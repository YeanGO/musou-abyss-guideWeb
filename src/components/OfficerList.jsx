import OfficerCard from './OfficerCard.jsx';
import { UI } from '../uiText.js';

export default function OfficerList({ officers, build, onSelectUnique, onSelectSummon, onToggleCompanion }) {
  return (
    <section className="panel officer-list-panel" aria-labelledby="officer-list-title">
      <div className="section-heading">
        <h2 id="officer-list-title">{UI.officerList}</h2>
        <span>{officers.length} {UI.people}</span>
      </div>

      <div className="officer-list">
        {officers.map((officer) => (
          <OfficerCard
            key={officer.id}
            officer={officer}
            selection={{
              isUnique: build.uniqueOfficerId === officer.id,
              isSummon: build.summonOfficerId === officer.id,
              isCompanion: build.companionIds.includes(officer.id),
            }}
            onSelectUnique={onSelectUnique}
            onSelectSummon={onSelectSummon}
            onToggleCompanion={onToggleCompanion}
          />
        ))}
      </div>
    </section>
  );
}
