export const SEAL_TYPES = ['\u80fd\u529b\u7cfb', '\u5c6c\u6027\u7cfb', '\u7279\u6b8a\u7cfb'];

export const emptyBuild = {
  uniqueOfficerId: '',
  summonOfficerId: '',
  companionIds: [],
  limitBreaks: {},
};

export function getOfficerById(officers, id) {
  return officers.find((officer) => officer.id === id) ?? null;
}

export function normalizeBuild(build, officers) {
  const officerIds = new Set(officers.map((officer) => officer.id));
  const companionIds = Array.isArray(build?.companionIds)
    ? build.companionIds.filter((id, index, ids) => officerIds.has(id) && ids.indexOf(id) === index)
    : [];

  const limitBreaks = Object.fromEntries(
    Object.entries(build?.limitBreaks ?? {}).filter(([id]) => officerIds.has(id)),
  );

  return {
    uniqueOfficerId: officerIds.has(build?.uniqueOfficerId) ? build.uniqueOfficerId : '',
    summonOfficerId: officerIds.has(build?.summonOfficerId) ? build.summonOfficerId : '',
    companionIds,
    limitBreaks,
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

export function multiplySeals(seals, multiplier) {
  return seals.map((seal) => ({
    ...seal,
    count: Number(seal.count ?? 0) * multiplier,
  }));
}

export function mergeSealCounts(seals) {
  return seals.reduce((result, seal) => {
    const key = `${seal.type}::${seal.name}`;
    const current = result.get(key) ?? {
      name: seal.name,
      type: seal.type,
      count: 0,
    };

    current.count += Number(seal.count ?? 0);
    result.set(key, current);
    return result;
  }, new Map());
}

export function sealMapToList(map) {
  return [...map.values()].sort((a, b) => {
    if (a.type !== b.type) return SEAL_TYPES.indexOf(a.type) - SEAL_TYPES.indexOf(b.type);
    return a.name.localeCompare(b.name, 'zh-Hant');
  });
}

export function calculateBuildStats(officers, build) {
  const uniqueOfficer = getOfficerById(officers, build.uniqueOfficerId);
  const summonOfficer = getOfficerById(officers, build.summonOfficerId);
  const companions = build.companionIds
    .map((id) => getOfficerById(officers, id))
    .filter(Boolean);

  const uniqueSeals = uniqueOfficer
    ? multiplySeals(uniqueOfficer.uniqueSkill.seals, getSealMultiplier(build, uniqueOfficer.id))
    : [];
  const summonSeals = summonOfficer
    ? multiplySeals(summonOfficer.summonSkill.seals, getSealMultiplier(build, summonOfficer.id))
    : [];
  const companionSeals = companions.flatMap((officer) =>
    multiplySeals(officer.seals, getSealMultiplier(build, officer.id)),
  );

  const uniqueAndCompanionSeals = [...uniqueSeals, ...companionSeals];
  const allSeals = [...uniqueAndCompanionSeals, ...summonSeals];

  return {
    uniqueOfficer,
    summonOfficer,
    companions,
    groups: {
      unique: sealMapToList(mergeSealCounts(uniqueSeals)),
      companions: sealMapToList(mergeSealCounts(companionSeals)),
      summon: sealMapToList(mergeSealCounts(summonSeals)),
      uniqueAndCompanions: sealMapToList(mergeSealCounts(uniqueAndCompanionSeals)),
      all: sealMapToList(mergeSealCounts(allSeals)),
    },
  };
}

export function filterOfficers(officers, { search, activeSealTypes, mode }) {
  const keyword = search.trim().toLocaleLowerCase('zh-Hant');

  return officers.filter((officer) => {
    const matchesSearch =
      !keyword ||
      officer.name.toLocaleLowerCase('zh-Hant').includes(keyword) ||
      officer.category.toLocaleLowerCase('zh-Hant').includes(keyword);

    if (!matchesSearch) return false;
    if (activeSealTypes.length === 0) return true;

    const officerSealTypes = new Set([
      ...officer.seals.map((seal) => seal.type),
      ...officer.uniqueSkill.seals.map((seal) => seal.type),
      ...officer.summonSkill.seals.map((seal) => seal.type),
    ]);

    if (mode === 'AND') {
      return activeSealTypes.every((type) => officerSealTypes.has(type));
    }

    return activeSealTypes.some((type) => officerSealTypes.has(type));
  });
}
