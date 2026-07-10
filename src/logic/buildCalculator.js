export const TRAIT_CATEGORIES = [
  { id: 'ability', name: '\u80fd\u529b\u7cfb' },
  { id: 'element', name: '\u5c6c\u6027\u7cfb' },
  { id: 'special', name: '\u7279\u6b8a\u7cfb' },
];

export const emptyBuild = {
  version: 3,
  playerOfficerId: '',
  teamOfficerIds: [],
};

export function createTraitMap(traits) {
  return new Map(traits.map((trait) => [trait.id, trait]));
}

export function createOfficerMap(officers) {
  return new Map(officers.map((officer) => [officer.id, officer]));
}

export function normalizeBuild(build, officers) {
  const officerIds = new Set(officers.map((officer) => officer.id));
  const playerOfficerId = officerIds.has(build?.playerOfficerId) ? build.playerOfficerId : '';
  const teamOfficerIds = Array.isArray(build?.teamOfficerIds)
    ? build.teamOfficerIds.filter(
        (id, index, ids) => officerIds.has(id) && id !== playerOfficerId && ids.indexOf(id) === index,
      )
    : [];

  return {
    version: 3,
    playerOfficerId,
    teamOfficerIds,
  };
}

export function getSelectedOfficerIds(build) {
  return [build.playerOfficerId, ...build.teamOfficerIds].filter(Boolean);
}

export function hydrateTraitEntries(entries, traitMap) {
  return entries
    .map((entry) => {
      const trait = traitMap.get(entry.traitId);
      if (!trait) return null;
      return {
        ...trait,
        count: Number(entry.count ?? 0),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sort - b.sort);
}

function addTraitEntriesToTotals(traitTotals, entries = []) {
  entries.forEach((entry) => {
    traitTotals[entry.traitId] = (traitTotals[entry.traitId] ?? 0) + Number(entry.count ?? 0);
  });
}

export function calculateBuildTraitTotals(officers, build) {
  const officerMap = createOfficerMap(officers);
  const traitTotals = {};
  const playerOfficer = officerMap.get(build.playerOfficerId);

  if (playerOfficer) {
    addTraitEntriesToTotals(traitTotals, playerOfficer.playerData?.traits);
  }

  build.teamOfficerIds.forEach((officerId) => {
    const officer = officerMap.get(officerId);
    if (!officer) return;

    addTraitEntriesToTotals(traitTotals, officer.supportData?.traits);
  });

  return traitTotals;
}

export function evaluateCondition(condition, context) {
  if (!condition) return { passed: true, missing: [] };

  if (Array.isArray(condition.all)) {
    const results = condition.all.map((item) => evaluateCondition(item, context));
    return {
      passed: results.every((result) => result.passed),
      missing: results.flatMap((result) => result.missing),
    };
  }

  if (Array.isArray(condition.any)) {
    const results = condition.any.map((item) => evaluateCondition(item, context));
    if (results.some((result) => result.passed)) return { passed: true, missing: [] };
    return {
      passed: false,
      missing: results.flatMap((result) => result.missing),
    };
  }

  if (condition.type === 'trait') {
    const current = context.traitTotals[condition.traitId] ?? 0;
    const required = Number(condition.required ?? 0);
    if (current >= required) return { passed: true, missing: [] };

    const trait = context.traitMap.get(condition.traitId);
    return {
      passed: false,
      missing: [
        {
          type: 'trait',
          traitId: condition.traitId,
          traitName: trait?.name ?? condition.traitId,
          required,
          current,
          missing: Math.max(required - current, 0),
        },
      ],
    };
  }

  if (condition.type === 'officer') {
    const selected = context.selectedOfficerIds.includes(condition.officerId);
    if (selected) return { passed: true, missing: [] };

    const officer = context.officerMap.get(condition.officerId);
    return {
      passed: false,
      missing: [
        {
          type: 'officer',
          officerId: condition.officerId,
          officerName: officer?.name ?? condition.officerId,
        },
      ],
    };
  }

  return { passed: false, missing: [] };
}

export function evaluateOfficerStatus(officer, context) {
  const summonSkillData = officer.supportData?.summonSkill;
  const uniqueTacticData = officer.supportData?.uniqueTactic;
  const summonSkill = evaluateCondition(summonSkillData?.upgradeConditions, context);
  const uniqueTactic = evaluateCondition(uniqueTacticData?.activationConditions, context);

  return {
    officerId: officer.id,
    officerName: officer.name,
    factionName: officer.factionName,
    level: officer.level,
    summonSkill: {
      name: summonSkillData?.name ?? '',
      description: summonSkillData?.description ?? '',
      passed: summonSkill.passed,
      missing: summonSkill.missing,
    },
    uniqueTactic: {
      name: uniqueTacticData?.name ?? '',
      description: uniqueTacticData?.description ?? '',
      passed: uniqueTactic.passed,
      missing: uniqueTactic.missing,
    },
  };
}

export function groupTraitTotals(traits, traitTotals) {
  const groups = Object.fromEntries(TRAIT_CATEGORIES.map((category) => [category.id, []]));

  traits
    .filter((trait) => traitTotals[trait.id] > 0)
    .sort((a, b) => a.sort - b.sort)
    .forEach((trait) => {
      groups[trait.category]?.push({
        ...trait,
        count: traitTotals[trait.id],
      });
    });

  return groups;
}

export function calculateBuildResult(officers, traits, build) {
  const normalizedBuild = normalizeBuild(build, officers);
  const traitMap = createTraitMap(traits);
  const officerMap = createOfficerMap(officers);
  const playerOfficer = officerMap.get(normalizedBuild.playerOfficerId) ?? null;
  const teamOfficers = normalizedBuild.teamOfficerIds.map((id) => officerMap.get(id)).filter(Boolean);
  const traitTotals = calculateBuildTraitTotals(officers, normalizedBuild);
  const selectedOfficerIds = getSelectedOfficerIds(normalizedBuild);
  const context = {
    traitTotals,
    selectedOfficerIds,
    playerOfficerId: normalizedBuild.playerOfficerId,
    officerMap,
    traitMap,
  };
  const officerStatuses = teamOfficers.map((officer) => evaluateOfficerStatus(officer, context));
  const allOfficerStatuses = officers.map((officer) => evaluateOfficerStatus(officer, context));
  const playerStatus = playerOfficer
    ? {
        operationTrait: playerOfficer.playerData?.operationTrait ?? null,
        weaponBreakthrough: {
          specialWeapon: playerOfficer.playerData?.weaponBreakthrough?.specialWeapon ?? null,
          limitBreak: playerOfficer.playerData?.weaponBreakthrough?.limitBreak ?? null,
        },
      }
    : {
        operationTrait: null,
        weaponBreakthrough: {
          specialWeapon: null,
          limitBreak: null,
        },
      };

  return {
    build: normalizedBuild,
    playerOfficer,
    teamOfficers,
    traitTotals,
    traitGroups: groupTraitTotals(traits, traitTotals),
    playerStatus,
    officerStatuses,
    allOfficerStatuses,
    activatedUniqueTactics: officerStatuses.filter((status) => status.uniqueTactic.passed),
    inactiveUniqueTactics: officerStatuses.filter((status) => !status.uniqueTactic.passed),
    upgradedSummonSkills: officerStatuses.filter((status) => status.summonSkill.passed),
    notUpgradedSummonSkills: officerStatuses.filter((status) => !status.summonSkill.passed),
  };
}

export function filterOfficers(officers, traits, { search, faction, activeTraitCategories, statusFilter, result }) {
  const keyword = search.trim().toLocaleLowerCase('zh-Hant');
  const traitMap = createTraitMap(traits);
  const statusMap = new Map(result.officerStatuses.map((status) => [status.officerId, status]));

  return officers.filter((officer) => {
    const searchableTraitNames = [
      ...(officer.playerData?.traits ?? []),
      ...(officer.supportData?.traits ?? []),
    ]
      .map((entry) => traitMap.get(entry.traitId)?.name ?? '')
      .join(' ')
      .toLocaleLowerCase('zh-Hant');

    const matchesSearch =
      !keyword ||
      officer.name.toLocaleLowerCase('zh-Hant').includes(keyword) ||
      officer.factionName.toLocaleLowerCase('zh-Hant').includes(keyword) ||
      searchableTraitNames.includes(keyword) ||
      (officer.playerData?.operationTrait?.name ?? '').toLocaleLowerCase('zh-Hant').includes(keyword) ||
      (officer.supportData?.summonSkill?.name ?? '').toLocaleLowerCase('zh-Hant').includes(keyword) ||
      (officer.supportData?.uniqueTactic?.name ?? '').toLocaleLowerCase('zh-Hant').includes(keyword);

    if (!matchesSearch) return false;
    if (faction && officer.faction !== faction) return false;

    if (activeTraitCategories.length > 0) {
      const officerCategories = new Set(
        [...(officer.playerData?.traits ?? []), ...(officer.supportData?.traits ?? [])]
          .map((entry) => traitMap.get(entry.traitId)?.category)
          .filter(Boolean),
      );
      if (!activeTraitCategories.some((category) => officerCategories.has(category))) return false;
    }

    const status = statusMap.get(officer.id);
    if (statusFilter === 'unique-active') return Boolean(status?.uniqueTactic.passed);
    if (statusFilter === 'summon-upgraded') return Boolean(status?.summonSkill.passed);
    if (statusFilter === 'team') return result.build.teamOfficerIds.includes(officer.id);
    if (statusFilter === 'player') return result.build.playerOfficerId === officer.id;

    return true;
  });
}
