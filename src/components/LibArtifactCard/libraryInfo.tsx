import { Entity } from '@backstage/catalog-model';

import { Config } from '@backstage/config';

import { IdentityApi } from '@backstage/core-plugin-api';

import {
  ENTITY_ARTIFACT,
  ENTITY_GROUP,
  ENTITY_PACKAGING,
  ENTITY_REPO,
  ENTITY_SCOPE,
  isJfrogArtifactAvailable, isJfrogRepoAvailable,
  LibraryArtifact
} from "../../types";
import {
  ArtifactInfo,
  extractArtifactFromFullDockerName,
  getDockerLatestVersion, getMavenLatestVersion, getPypiLatestVersion,
  getRepositoryType,
  removeDockerVersion
} from "./api";
import {generatePackageManagersCode} from "./codeSnippets";

export const DEFAULT_PROXY_PATH = '/artifactory-proxy/';

export function checkAnnotationsPresent(entity: Entity) {
  const annotations = entity.metadata?.annotations;

  const entityArtifact: LibraryArtifact = {
    repo: annotations?.[ENTITY_REPO] || '',
    group: annotations?.[ENTITY_GROUP],
    artifact: annotations?.[ENTITY_ARTIFACT] || '',
    packaging: annotations?.[ENTITY_PACKAGING],
    scope: annotations?.[ENTITY_SCOPE],
  };

  if (isJfrogArtifactAvailable(entity) && !isJfrogRepoAvailable(entity)) {
    throw new Error(
      `Repository definition is required for JFrog artifact ${entityArtifact.artifact}`,
    );
  }
  return entityArtifact;
}

export async function libraryInfo(
  entity: Entity,
  config: Config,
  identity: IdentityApi,
): Promise<ArtifactInfo> {
  const artifactoryBackendProxy =
    config.getOptionalString('jfrog.artifactory.proxyPath') ||
    DEFAULT_PROXY_PATH;
  const entityArtifact = checkAnnotationsPresent(entity);

  const backendUrl = config.getString('backend.baseUrl');
  const proxyUrl = `/proxy${artifactoryBackendProxy}`;
  //    try {
  const url = `${backendUrl}/api${proxyUrl}`;
  const { packageType } = await getRepositoryType(fetch, url, entityArtifact,identity);
  let version;
  const artInfo = { ...entityArtifact };
  switch (packageType) {
    case 'docker':
      const dockerInfo = await getDockerLatestVersion(
        fetch,
        url,
        entityArtifact,
        identity,
      );
      artInfo.stats = dockerInfo?.statsDownload;
      artInfo.size = dockerInfo?.size;
      artInfo.artifactFullName = removeDockerVersion(artInfo.artifact);
      artInfo.lastModified = dockerInfo?.lastModified
        ? new Date(dockerInfo?.lastModified)
        : undefined;
      artInfo.artifact = extractArtifactFromFullDockerName(artInfo.artifact);
      version = dockerInfo?.version;
      break;
    case 'pypi':
      version = await getPypiLatestVersion(fetch, url, entityArtifact,identity);
      break;
    default:
      version = await getMavenLatestVersion(fetch, url, entityArtifact,identity);
  }

  artInfo.version = version;
  artInfo.packageType = packageType;

  return {
    lib: artInfo,
    code: () => generatePackageManagersCode(artInfo, false, false),
  };
  // } catch (e) {
  //     if (e instanceof Error) {
  //         setError(e);
  //     } else {
  //         setError(new Error(e as string));
  //     }
  //     return '';
  // }
}