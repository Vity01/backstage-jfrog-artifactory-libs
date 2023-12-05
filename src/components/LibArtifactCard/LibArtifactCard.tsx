import React from 'react';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { ResponseErrorPanel } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import { LibArtifactCardProps } from '../../types';
import { LibVerTabbedContent } from '../LibVerTabbedContent';
import { Entity } from '@backstage/catalog-model';
import useAsync from 'react-use/lib/useAsync';
import { checkAnnotationsPresent, libraryInfo } from './libraryInfo';
import { getBrowserVersionUrl } from '../LibVerView/LibVerView';
import { ArtifactInfo } from './api';

export const DEFAULT_PROXY_PATH = '/artifactory-proxy/';
export const LibArtifactCard = (props: LibArtifactCardProps) => {
  const config = useApi(configApiRef);
  const { entity } = useEntity<Entity>();

  const artifactoryUrl = config.getString('jfrog.artifactory.url');

  checkAnnotationsPresent(entity);

  const { value, loading, error } = useAsync(async () => {
    try {
      return await libraryInfo(entity, config);
    } catch (e) {
      if (!(e instanceof Error)) {
        throw new Error(e as string);
      } else {
        throw e;
      }
    }
  }, [config]);

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  return (
    <LibVerTabbedContent
      props={props}
      loading={loading}
      artifactoryUrl={artifactoryUrl}
      artifactInfo={value ? [value] : undefined}
    />
  );
};

export const browseLinkDefault = (
  artifactoryUrl: string,
  artifactInfos: ArtifactInfo[] | undefined,
) => {
  if (artifactInfos) {
    if (artifactInfos.length === 1) {
      return getBrowserVersionUrl(artifactoryUrl, artifactInfos[0].lib);
    }
  }
  return artifactoryUrl;
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
  // which link to open
  browseLink: browseLinkDefault,
};
