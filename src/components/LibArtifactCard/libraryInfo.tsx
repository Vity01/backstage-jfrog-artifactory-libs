import { Entity } from '@backstage/catalog-model';

import { Config } from '@backstage/config';
import {
  ENTITY_ARTIFACT,
  ENTITY_GROUP,
  ENTITY_PACKAGING,
  ENTITY_REPO,
  ENTITY_SCOPE,
  isJfrogArtifactAvailable,
  isJfrogRepoAvailable,
  LibraryArtifact,
} from '../../types';
import {
  ArtifactInfo,
  extractArtifactFromFullDockerName,
  getLatestCreatedVersion,
  getMavenLatestVersion,
  getPypiLatestVersion,
  getRepositoryType,
  removeDockerVersion,
} from './api';
import { generatePackageManagersCode } from './codeSnippets';
import { FetchApi } from '@backstage/core-plugin-api';

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
  fetchApi: FetchApi,
): Promise<ArtifactInfo> {
  const artifactoryBackendProxy =
    config.getOptionalString('jfrog.artifactory.proxyPath') ||
    DEFAULT_PROXY_PATH;
  const entityArtifact = checkAnnotationsPresent(entity);

  const backendUrl = config.getString('backend.baseUrl');
  const proxyUrl = `/proxy${artifactoryBackendProxy}`;
  //    try {
  const url = `${backendUrl}/api${proxyUrl}`;

  const { packageType } = await getRepositoryType(
    url,
    entityArtifact,
    fetchApi,
  );
  let version;
  const artInfo = { ...entityArtifact };
  switch (packageType) {
    case 'maven':
      version = await getMavenLatestVersion(url, entityArtifact, fetchApi);
      break;
    case 'docker':
      // eslint-disable-next-line no-case-declarations -- this just should be rewritten properly
      const info = await getLatestCreatedVersion(
        url,
        entityArtifact,
        packageType,
        fetchApi,
        libArt => extractArtifactFromFullDockerName(libArt.artifact),
      );
      artInfo.stats = info?.statsDownload;
      artInfo.size = info?.size;
      artInfo.artifactFullName = removeDockerVersion(artInfo.artifact);
      artInfo.lastModified = info?.lastModified
        ? new Date(info?.lastModified)
        : undefined;
      artInfo.artifact = extractArtifactFromFullDockerName(artInfo.artifact);
      version = info?.version;
      break;
    case 'pypi':
      version = await getPypiLatestVersion(url, entityArtifact, fetchApi);
      break;
    default: {
      const info = await getLatestCreatedVersion(
        url,
        entityArtifact,
        packageType,
        fetchApi,
        libArt => libArt.artifact,
      );
      artInfo.stats = info?.statsDownload;
      artInfo.size = info?.size;
      artInfo.artifactFullName = artInfo.artifact;
      artInfo.filePath = info?.filePath;
      artInfo.lastModified = info?.lastModified
        ? new Date(info?.lastModified)
        : undefined;
      version = info?.version;
      break;
    }
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
