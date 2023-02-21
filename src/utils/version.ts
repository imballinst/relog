import semver from 'semver';
import { SemverBump } from '../types/changelog';

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
  const result = semver.prerelease(version) || []
  return result.length > 0
}

const VALID_VERSION_BUMPS = Object.values(SemverBump) as string[];

export function validateVersion(version: string) {
  if (VALID_VERSION_BUMPS.includes(version)) return true;

  const isValid = semver.valid(version);
  if (isValid) return true;

  return `${version} is an invalid version.`;
}
