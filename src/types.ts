import { Entity } from '@backstage/catalog-model';

export const ENTITY_GROUP = 'jfrog.com/artifactory-group';
export const ENTITY_ARTIFACT = 'jfrog.com/artifactory-artifact';
export const ENTITY_PACKAGING = 'jfrog.com/artifactory-packaging';
export const ENTITY_SCOPE = 'jfrog.com/artifactory-scope';
export const ENTITY_REPO = 'jfrog.com/artifactory-repo';

export const isJfrogArtifactAvailable = (entity: Entity) =>
  Boolean(entity.metadata.annotations?.[ENTITY_ARTIFACT]);

export const isJfrogRepoAvailable = (entity: Entity) =>
  Boolean(entity.metadata.annotations?.[ENTITY_REPO]);

export interface LibArtifactCardProps {
  title: string;
  showGradle: boolean;
  showMaven: boolean;
  showSbt: boolean;
  showPip: boolean;
  autohideTabs: boolean;
  showBrowseRepositoryLink: boolean;
  browseRepositoryLinkTitle: string;
}

export type LibraryArtifact = {
  group?: string;
  artifact: string;
  repo: string;
  version?: string;
  classifiers?: string[];
  scope?: string;
  transitive?: boolean;
  packaging?: string;
  packageType?: string;
};
