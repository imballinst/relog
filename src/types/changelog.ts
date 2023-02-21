export enum SemverBump {
  MAJOR = 'major',
  MINOR = 'minor',
  PATCH = 'patch',
  PRERELEASE = 'prerelease'
}

export interface ChangelogContent {
  datetime: string;
  message: string;
  semver: string;
}
