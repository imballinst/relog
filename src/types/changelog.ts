export enum SemverBump {
  MAJOR,
  MINOR,
  BUMP
}

export interface ChangelogContent {
  datetime: string;
  message: string;
}
