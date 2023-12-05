import { CompoundEntityRef, Entity } from '@backstage/catalog-model';
import { ArtifactInfo } from './components/LibArtifactCard/api';

export const ENTITY_GROUP = 'jfrog.com/artifactory-group';
export const ENTITY_ARTIFACT = 'jfrog.com/artifactory-artifact';
export const ENTITY_PACKAGING = 'jfrog.com/artifactory-packaging';
export const ENTITY_SCOPE = 'jfrog.com/artifactory-scope';
export const ENTITY_REPO = 'jfrog.com/artifactory-repo';

export const isJfrogArtifactAvailable = (entity: Entity) =>
  Boolean(entity.metadata.annotations?.[ENTITY_ARTIFACT]);

export const isJfrogRepoAvailable = (entity: Entity) =>
  Boolean(entity.metadata.annotations?.[ENTITY_REPO]);

export type LibArtifactCardProps = {
  title: string;
  showGradle: boolean;
  showMaven: boolean;
  showSbt: boolean;
  showPip: boolean;
  showDockerfile: boolean;
  autohideTabs: boolean;
  showBrowseRepositoryLink: boolean;
  browseRepositoryLinkTitle: string;
  browseLink: (
    artifactoryLink: string,
    artifactInfos: ArtifactInfo[] | undefined,
  ) => string;
};

export interface LibverTableRow {
  entity: Entity;
  resolved: {
    name: string;
    partOfSystemRelationTitle?: string;
    partOfSystemRelations: CompoundEntityRef[];
    ownedByRelationsTitle?: string;
    ownedByRelations: CompoundEntityRef[];
    artifactInfo?: ArtifactInfo;
  };
}

export type LibraryArtifact = {
  group?: string;
  artifact: string;
  artifactFullName?: string;
  repo: string;
  version?: string;
  classifiers?: string[];
  scope?: string;
  transitive?: boolean;
  packaging?: string;
  packageType?: string;
  size?: number;
  stats?: number;
  lastModified?: Date;
};

export interface MetadataResponse {
  data: Data;
}

export interface Data {
  versions: Versions;
}

export interface Versions {
  edges: Edge[];
}

export interface Edge {
  node: Node;
}

export interface Node {
  name: string;
  created: Date;
  modified: Date;
  package: Package;
  repos: Repo[];
  licenses: any[];
  size: string;
  stats: Stats;
  vulnerabilities: Vulnerabilities | null;
  files: File[];
}

export interface File {
  name: string;
  lead: boolean;
  size: string;
  md5: string;
  sha1: string;
  sha256: string;
  mimeType: null | string;
}

export interface Package {
  id: string;
}

export interface Repo {
  name: string;
  type: string;
  leadFilePath: string;
}

export interface Stats {
  downloadCount: number;
}

export interface Vulnerabilities {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  unknown: number;
  skipped: number;
}
