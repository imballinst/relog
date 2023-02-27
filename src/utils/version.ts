import semver from 'semver';

export function getNextPatchVersion(
  currentVersion: string,
  _prereleaseId?: string
) {
  const nextPatchVersion = semver.patch(currentVersion) + 1;
  return `${semver.major(currentVersion)}.${semver.minor(
    currentVersion
  )}.${nextPatchVersion}`;
}

export function isPrerelease(version: string) {
  const result = semver.prerelease(version) || [];
  return result.length > 0;
}
