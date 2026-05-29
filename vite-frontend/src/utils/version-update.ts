export type UpdateReleaseChannel = "stable" | "dev";

export const UPDATE_CHANNEL_STORAGE_KEY = "update-release-channel";
export const UPDATE_CHANNEL_CHANGED_EVENT = "updateReleaseChannelChanged";

const CHANNEL_STABLE: UpdateReleaseChannel = "stable";
const CHANNEL_DEV: UpdateReleaseChannel = "dev";

const stableVersionPattern = /^\d+(?:\.\d+)+$/;

const normalizeChannel = (
  value: string | null | undefined,
): UpdateReleaseChannel => {
  return value === CHANNEL_DEV ? CHANNEL_DEV : CHANNEL_STABLE;
};

export const getUpdateReleaseChannel = (): UpdateReleaseChannel => {
  if (typeof window === "undefined") {
    return CHANNEL_STABLE;
  }

  return normalizeChannel(localStorage.getItem(UPDATE_CHANNEL_STORAGE_KEY));
};

export const setUpdateReleaseChannel = (
  channel: UpdateReleaseChannel,
): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(UPDATE_CHANNEL_STORAGE_KEY, normalizeChannel(channel));
  window.dispatchEvent(new Event(UPDATE_CHANNEL_CHANGED_EVENT));
};

const normalizeTag = (tag: string): string => {
  return tag.trim().replace(/^v/i, "");
};

type VersionParts = {
  numbers: number[];
  stageRank: number;
  stageNumber: number;
};

const parseVersionParts = (version: string): VersionParts => {
  const normalized = normalizeTag(version).toLowerCase();
  const numberMatches = normalized.match(/\d+/g) || [];
  const numbers = numberMatches.map((item) => Number.parseInt(item, 10));

  let stageRank = 0;

  if (normalized.includes("rc")) {
    stageRank = 3;
  } else if (normalized.includes("beta")) {
    stageRank = 2;
  } else if (normalized.includes("alpha")) {
    stageRank = 1;
  } else if (stableVersionPattern.test(normalized)) {
    stageRank = 4;
  }

  const stageNumberMatch = normalized.match(/(?:alpha|beta|rc)[.-]?(\d+)/);
  const stageNumber = stageNumberMatch
    ? Number.parseInt(stageNumberMatch[1], 10)
    : 0;

  return {
    numbers,
    stageRank,
    stageNumber,
  };
};

export const compareVersions = (left: string, right: string): number => {
  const a = parseVersionParts(left);
  const b = parseVersionParts(right);
  const maxLength = Math.max(a.numbers.length, b.numbers.length);

  for (let i = 0; i < maxLength; i += 1) {
    const aValue = a.numbers[i] || 0;
    const bValue = b.numbers[i] || 0;

    if (aValue !== bValue) {
      return aValue - bValue;
    }
  }

  if (a.stageRank !== b.stageRank) {
    return a.stageRank - b.stageRank;
  }

  if (a.stageNumber !== b.stageNumber) {
    return a.stageNumber - b.stageNumber;
  }

  return 0;
};

export const getLatestVersionByChannel = async (
  _channel: UpdateReleaseChannel,
  _repoUrl: string,
): Promise<string | null> => {
  return null;
};

export const hasVersionUpdate = (
  currentVersion: string,
  latestVersion: string,
): boolean => {
  return (
    compareVersions(normalizeTag(currentVersion), normalizeTag(latestVersion)) <
    0
  );
};
