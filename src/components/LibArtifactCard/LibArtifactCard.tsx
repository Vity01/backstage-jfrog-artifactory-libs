import React, { useEffect, useState } from 'react';
import { configApiRef, fetchApiRef, useApi } from '@backstage/core-plugin-api';
import { ResponseErrorPanel } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import {
  ENTITY_ARTIFACT,
  ENTITY_GROUP,
  ENTITY_PACKAGING,
  ENTITY_REPO,
  ENTITY_SCOPE,
  isJfrogArtifactAvailable,
  isJfrogRepoAvailable,
  LibArtifactCardProps,
  LibraryArtifact,
} from '../../types';
import { generatePackageManagersCode } from './codeSnippets';
import { LibVerTabbedContent } from '../LibVerTabbedContent';
import { Entity } from '@backstage/catalog-model';
import {
  ArtifactInfo,
  extractArtifactFromFullDockerName,
  getDockerLatestVersion, getMavenLatestVersion, getPypiLatestVersion,
  getRepositoryType,
  removeDockerVersion
} from "./api";

export const DEFAULT_PROXY_PATH = '/artifactory-proxy/';
export const LibArtifactCard = (props: LibArtifactCardProps) => {
  const { fetch } = useApi(fetchApiRef);
  const config = useApi(configApiRef);
  const { entity } = useEntity<Entity>();

  const artifactoryUrl = config.getString('jfrog.artifactory.url');
  const artifactoryBackendProxy =
    config.getOptionalString('jfrog.artifactory.proxyPath') ||
    DEFAULT_PROXY_PATH;

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

  const [artifactInfo, setArtifactInfo] = useState<ArtifactInfo>();

  const [loading, setLoading] = useState<boolean>(true);

  const [error, setError] = useState<Error>();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const backendUrl = config.getString('backend.baseUrl');
      const proxyUrl = `/proxy${artifactoryBackendProxy}`;
      try {
        const url = `${backendUrl}/api${proxyUrl}`;

        const { packageType } = await getRepositoryType(
          fetch,
          url,
          entityArtifact,
        );
        let version;
        const artInfo = { ...entityArtifact };
        switch (packageType) {
          case 'docker':
            const dockerInfo = await getDockerLatestVersion(fetch, url, entityArtifact);
            artInfo.stats = dockerInfo?.statsDownload;
            artInfo.size = dockerInfo?.size;
            artInfo.artifactFullName = removeDockerVersion(artInfo.artifact);
            artInfo.lastModified = dockerInfo?.lastModified ? new Date(dockerInfo?.lastModified) : undefined;
            artInfo.artifact = extractArtifactFromFullDockerName(artInfo.artifact);
            version = dockerInfo?.version;
            break;
          case 'pypi':
            version = await getPypiLatestVersion(fetch, url, entityArtifact);
            break;
          default:
            version = await getMavenLatestVersion(fetch, url, entityArtifact);
        }

        artInfo.version = version;
        artInfo.packageType = packageType;

        setArtifactInfo({
          lib: artInfo,
          code: generatePackageManagersCode(artInfo, false, false),
        });
        setLoading(false);
        return version;
      } catch (e) {
        if (e instanceof Error) {
          setError(e);
        } else {
          setError(new Error(e as string));
        }
        setLoading(false);
        return '';
      }
    };
    fetchData().then();
  }, []);

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <LibVerTabbedContent
      props={props}
      loading={loading}
      artifactoryUrl={artifactoryUrl}
      artifactInfo={artifactInfo}
    />
  );
};

LibArtifactCard.defaultProps = {
  title: 'Artifact', // title of the card
  browseRepositoryLinkTitle: 'Browse Repository', // Card deep link title
  showGradle: true, // whether to show Gradle package manager tab
  showMaven: true, // whether to  show Maven package manager tab
  showSbt: true, // whether to  show Sbt package manager tab
  showPip: true, // whether to  show Pip package manager tab
  showDockerfile: true, // whether to  show Dockerfile tab
  // it hides Maven and Gradle tabs if the current repository package type is `PyPi`
  autohideTabs: true,
  showBrowseRepositoryLink: true, // whether to show Browse to URL deep link under bottom of the Card
};
