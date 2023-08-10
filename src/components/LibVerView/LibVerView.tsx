import { Grid } from '@material-ui/core';
import { AboutField } from '@backstage/plugin-catalog';
import React from 'react';
import { LibraryArtifact } from '../../types';
import { Link } from '@backstage/core-components';

export const ARTIFACTORY_BROWSE_URL = 'artifactory/list';

export type LibVerViewProps = {
  lib: LibraryArtifact;
  artifactoryUrl: string;
};

function getBrowseRepoUrl(artifactoryUrl: string, lib: LibraryArtifact) {
  return `${artifactoryUrl}/${ARTIFACTORY_BROWSE_URL}/${lib.repo}`;
}

function getBrowsePackageUrl(artifactoryUrl: string, lib: LibraryArtifact) {
  return (
    getBrowseRepoUrl(artifactoryUrl, lib) +
    '/' +
    lib.group?.replaceAll('.', '/')
  );
}

function getBrowseArtifactUrl(artifactoryUrl: string, lib: LibraryArtifact) {
  return getBrowseRepoUrl(artifactoryUrl, lib) + '/' + lib.artifact;
}

export function getBrowserVersionUrl(
  artUrl: string,
  lib: LibraryArtifact,
): string {
  return (
    getBrowseArtifactUrl(artUrl, lib) +
    '/' +
    (lib.version !== undefined ? lib.version : '')
  );
}

export const LibVerView = ({ lib, artifactoryUrl }: LibVerViewProps) => {
  return (
    <Grid container>
      {lib.group && (
        <AboutField
          label={'Group'}
          children={
            <Link to={getBrowsePackageUrl(artifactoryUrl, lib)} target="_blank">
              {lib.group}
            </Link>
          }
        />
      )}
      <AboutField
        label={'Artifact'}
        children={
          <Link to={getBrowseArtifactUrl(artifactoryUrl, lib)} target="_blank">
            {lib.artifact}
          </Link>
        }
      />
      <AboutField
        label={'Version'}
        children={
          <Link to={getBrowserVersionUrl(artifactoryUrl, lib)} target="_blank">
            {lib.version || '?'}
          </Link>
        }
      />
      <AboutField
        label={'Repo'}
        children={
          <Link to={getBrowseRepoUrl(artifactoryUrl, lib)} target="_blank">
            {lib.repo}
          </Link>
        }
      />
      {lib.scope && <AboutField label={'Scope'} value={lib.scope} />}
      {lib.packaging && (
        <AboutField label={'Packaging'} value={lib.packaging} />
      )}
    </Grid>
  );
};
