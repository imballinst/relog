import semver from 'semver';

export type SemverReleaseType = semver.ReleaseType;
export const SEMVER_RELEASE_ORDER: SemverReleaseType[] = [
  'patch',
  'minor',
  'major',
  'prerelease',
  'prepatch',
  'preminor',
  'premajor'
];

export interface ChangelogContent {
  datetime: string;
  message: string;
  semver: SemverReleaseType;
}
