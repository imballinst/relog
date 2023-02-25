import semver from 'semver';

export type SemverReleaseType = semver.ReleaseType;
export const SEMVER_RELEASE_ORDER: SemverReleaseType[] = [
  'major',
  'premajor',
  'minor',
  'preminor',
  'patch',
  'prepatch',
  'prerelease'
];

export interface ChangelogContent {
  datetime: string;
  message: string;
  semver: SemverReleaseType;
}
