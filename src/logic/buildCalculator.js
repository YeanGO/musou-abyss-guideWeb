export const SEAL_TYPES = [
  { id: 'ability', name: '\u80fd\u529b\u7cfb' },
  { id: 'element', name: '\u5c6c\u6027\u7cfb' },
  { id: 'special', name: '\u7279\u6b8a\u7cfb' },
];

export const emptyBuild = {
  version: 2,
  uniqueOfficerId: '',
  summonOfficerId: '',
  companionIds: [],
  limitBreaks: {},
  targetSealIds: [],
  filterMode: 'OR',
};

export function createSealMap(seals) {
  return new Map(seals.map((seal) => [seal.id, seal]));
}

export function getOfficerById(officers, id) {
  return officers.find((officer) => officer.id === id) ?? null;
}

export function normalizeBuild(build, officers, seals) {
  const officerIds = new Set(officers.map((officer) => officer.id));
  const sealIds = new Set(seals.map((seal) => seal.id));
  const companionIds = Array.isArray(build?.companionIds)
    ? build.companionIds.filter((id, index, ids) => officerIds.has(id) && ids.indexOf(id) === index)
    : [];
  const targetSealIds = Array.isArray(build?.targetSealIds)
    ? build.targetSealIds.filter((id, index, ids) => sealIds.has(id) && ids.indexOf(id) === index)
    : [];

  const limitBreaks = Object.fromEntries(
    Object.entries(build?.limitBreaks ?? {}).filter(([id]) => officerIds.has(id)),
  );

  return {
    version: 2,
    uniqueOfficerId: officerIds.has(build?.uniqueOfficerId) ? build.uniqueOfficerId : '',
    summonOfficerId: officerIds.has(build?.summonOfficerId) ? build.summonOfficerId : '',
    companionIds,
    limitBreaks,
    targetSealIds,
    filterMode: build?.filterMode === 'AND' ? 'AND' : 'OR',
  };
}

export function getSelectedOfficerIds(build) {
  return [
    build.uniqueOfficerId,
    build.summonOfficerId,
    ...build.companionIds,
  ].filter(Boolean);
}

export function isOfficerLimitBroken(build, officerId) {
  return Boolean(build.limitBreaks[officerId]);
}

export function getSealMultiplier(build, officerId) {
  return isOfficerLimitBroken(build, officerId) ? 2 : 1;
}

export function hydrateSeals(entries, sealMap, multiplier = 1) {
  return entries
    .map((entry) => {
      const seal = sealMap.get(entry.sealId);
      if (!seal) return null;
      return {
        ...seal,
        count: Number(entry.count ?? 0) * multiplier,
      };
    })
    .filter(Boolean);
}

export function getOfficerSealIds(officer) {
  return new Set([
    ...officer.companionSeals.map((entry) => entry.sealId),
    ...officer.uniqueSkill.seals.map((entry) => entry.sealId),
    ...officer.summonSkill.seals.map((entry) => entry.sealId),
  ]);
}

export function getOfficerMatch(officer, targetSealIds) {
  const officerSealIds = getOfficerSealIds(officer);
  const matchedSealIds = targetSealIds.filter((id) => officerSealIds.has(id));
  const missingSealIds = targetSealIds.filter((id) => !officerSealIds.has(id));
  return {
    matchedSealIds,
    missingSealIds,
    matchesAny: matchedSealIds.length > 0,
    matchesAll: targetSealIds.length > 0 && missingSealIds.length === 0,
  };
}

export function mergeSealCounts(seals) {
  return seals.reduce((result, seal) => {
    const current = result.get(seal.id) ?? {
      id: seal.id,
      name: seal.name,
      type: seal.type,
      typeName: seal.typeName,
      sort: seal.sort,
      count: 0,
    };

    current.count += Number(seal.count ?? 0);
    result.set(seal.id, current);
    return result;
  }, new Map());
}

export function sealMapToList(map) {
  return [...map.values()].sort((a, b) => {
    if (a.sort !== b.sort) return a.sort - b.sort;
    return a.name.localeCompare(b.name, 'zh-Hant');
  });
}

export function calculateBuildStats(officers, seals, build) {
  const sealMap = createSealMap(seals);
  const uniqueOfficer = getOfficerById(officers, build.uniqueOfficerId);
  const summonOfficer = getOfficerById(officers, build.summonOfficerId);
  const companions = build.companionIds
    .map((id) => getOfficerById(officers, id))
    .filter(Boolean);

  const uniqueSeals = uniqueOfficer
    ? hydrateSeals(uniqueOfficer.uniqueSkill.seals, sealMap, getSealMultiplier(build, uniqueOfficer.id))
    : [];
  const summonSeals = summonOfficer
    ? hydrateSeals(summonOfficer.summonSkill.seals, sealMap, getSealMultiplier(build, summonOfficer.id))
    : [];
  const companionSeals = companions.flatMap((officer) =>
    hydrateSeals(officer.companionSeals, sealMap, getSealMultiplier(build, officer.id)),
  );

  const uniqueAndCompanionSeals = [...uniqueSeals, ...companionSeals];
  const allSeals = [...uniqueAndCompanionSeals, ...summonSeals];
  const allSealIds = new Set(allSeals.map((seal) => seal.id));
  const achievedTargetSealIds = build.targetSealIds.filter((id) => allSealIds.has(id));
  const missingTargetSealIds = build.targetSealIds.filter((id) => !allSealIds.has(id));

  return {
    uniqueOfficer,
    summonOfficer,
    companions,
    target: {
      selected: build.targetSealIds.map((id) => sealMap.get(id)).filter(Boolean),
      achieved: achievedTargetSealIds.map((id) => sealMap.get(id)).filter(Boolean),
      missing: missingTargetSealIds.map((id) => sealMap.get(id)).filter(Boolean),
    },
    groups: {
      unique: sealMapToList(mergeSealCounts(uniqueSeals)),
      companions: sealMapToList(mergeSealCounts(companionSeals)),
      summon: sealMapToList(mergeSealCounts(summonSeals)),
      uniqueAndCompanions: sealMapToList(mergeSealCounts(uniqueAndCompanionSeals)),
      all: sealMapToList(mergeSealCounts(allSeals)),
    },
  };
}

export function filterOfficers(officers, seals, { search, targetSealIds, mode, activeSealTypes, faction }) {
  const keyword = search.trim().toLocaleLowerCase('zh-Hant');
  const sealMap = createSealMap(seals);

  return officers
    .map((officer) => ({
      officer,
      match: getOfficerMatch(officer, targetSealIds),
    }))
    .filter(({ officer, match }) => {
      const matchesSearch =
        !keyword ||
        officer.name.toLocaleLowerCase('zh-Hant').includes(keyword) ||
        officer.factionName.toLocaleLowerCase('zh-Hant').includes(keyword) ||
        officer.roles.some((role) => role.toLocaleLowerCase('zh-Hant').includes(keyword));

      if (!matchesSearch) return false;
      if (faction && officer.faction !== faction) return false;

      if (activeSealTypes.length > 0) {
        const officerTypes = new Set(
          [...getOfficerSealIds(officer)]
            .map((sealId) => sealMap.get(sealId)?.type)
            .filter(Boolean),
        );
        if (!activeSealTypes.some((type) => officerTypes.has(type))) return false;
      }

      if (targetSealIds.length === 0) return true;
      return mode === 'AND' ? match.matchesAll : match.matchesAny;
    });
}
