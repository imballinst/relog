import semver from 'semver';

export type SemverReleaseType = semver.ReleaseType;

export interface ChangelogContent {
  datetime: string;
  message: string;
  semver: SemverReleaseType;
}
