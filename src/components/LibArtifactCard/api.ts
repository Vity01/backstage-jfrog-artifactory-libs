// import { on } from 'events';
import { LibraryArtifact, MetadataResponse } from '../../types';
import { findLatestVersion } from './versionUtils';
import { IdentityApi } from '@backstage/core-plugin-api';

export type GeneratedCode = {
  gradle: string;
  maven: string;
  sbt: string;
  pip: string;
};

export type ArtifactInfo = {
  lib: LibraryArtifact;
  code: () => GeneratedCode;
};

export interface JFrogArtifactoryError {
  status: number;
  message: string;
}

export interface Errors {
  errors: JFrogArtifactoryError[];
}

export interface RepositoryDetails {
  key: string;
  packageType: string;
  rclass: string;
}

export interface PropertiesInfo {
  'pypi.version': string[];
}

export interface PropsResponse {
  properties: PropertiesInfo;
}

export interface VersionsPropsListResponse {
  results: PropsResponse[];
}

export async function getErrorMessage(response: Response) {
  return ((await response.json()) as Errors).errors[0].message;
}

export async function getRepositoryType(
  fetch: {
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  },
  url: string,
  { repo }: LibraryArtifact,
  identityApi: IdentityApi
) {
  // Obtain the token

  const { token: idToken } = await identityApi.getCredentials();

  const response = await fetch(`${url}artifactory/api/repositories/${repo}`, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
  if (response.status === 404) {
    throw new Error(`Repository ${repo} was not found`);
  } else {
    if (response.status !== 200) {
      throw new Error(
        `Cannot get repository ${repo} detail info ${await getErrorMessage(
          response,
        )}`,
      );
    } else {
      return (await response.json()) as RepositoryDetails;
    }
  }
}

export async function getMavenLatestVersion(
  fetch: {
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  },
  url: string,
  { group, artifact, repo }: LibraryArtifact,
  identityApi: IdentityApi,
) {

  const { token: idToken } = await identityApi.getCredentials();

  const response = await fetch(
    `${url}artifactory/api/search/latestVersion?g=${group}&a=${artifact}&repos=${repo}`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },}
  );
  if (response.status === 404) {
    return undefined;
  }
  if (response.status !== 200) {
    throw new Error(
      `Error getting latest version ${await getErrorMessage(response)}`,
    );
  } else {
    return await response.text();
  }
}

export function getMetadataVersionQuery(artifact: string) {
  const query = {
    query:
      'query ($filter: VersionFilter!, $first: Int, $orderBy: VersionOrder) { versions (filter: $filter, first: $first, orderBy: $orderBy) { edges { node { name, created, modified, package { id }, repos { name, type, leadFilePath }, licenses { name, source }, size, stats { downloadCount }, vulnerabilities { critical, high, medium, low, info, unknown, skipped }, files { name, lead, size, md5, sha1, sha256, mimeType } } } } }',
    variables: {
      filter: {
        packageId: `docker://${artifact}`,
        name: '*',
        ignorePreRelease: false,
      },
      first: 1,
      orderBy: {
        field: 'CREATED',
        direction: 'DESC',
      },
    },
  };
  return JSON.stringify(query);
}

export function removeDockerVersion(artifact: string): string {
  const versionSeparator = artifact.indexOf(':');
  if (versionSeparator > 0) {
    return artifact.substring(0, versionSeparator);
  }
  return artifact;
}

export function extractArtifactFromFullDockerName(artifact: string): string {
  // remove domain path
  const artifactWithoutVersion = removeDockerVersion(artifact);
  const dotPosition = artifactWithoutVersion.lastIndexOf('.');
  const slashPosition = artifactWithoutVersion.indexOf('/');
  if (dotPosition >= 0 && dotPosition < slashPosition) {
    return artifactWithoutVersion.substring(slashPosition + 1);
  }
  return artifactWithoutVersion;
}

export async function getDockerLatestVersion(
  fetch: {
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  },
  url: string,
  { artifact }: LibraryArtifact,
  identityApi: IdentityApi,
) {
  const { token: idToken } = await identityApi.getCredentials();

  const response = await fetch(`${url}/metadata/api/v1/query`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    method: 'POST',
    body: getMetadataVersionQuery(extractArtifactFromFullDockerName(artifact)),
  });
  if (response.status === 404) {
    return undefined;
  }
  if (!response.ok) {
    throw new Error(`Error getting latest version ${await response.text()}`);
  } else {
    const metadataResponse = (await response.json()) as MetadataResponse;
    const node = metadataResponse.data.versions.edges
      .map(items => items.node)
      .pop();
    if (node?.name) {
      return {
        version: node.name,
        size: Number(node.size),
        statsDownload: node.stats.downloadCount,
        lastModified: node.modified ? new Date(node.modified) : undefined,
      };
    }
    return undefined;
  }
}

export async function getPypiLatestVersion(
  fetch: {
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
  },
  url: string,
  { artifact, repo }: LibraryArtifact,
  identityApi: IdentityApi,
) {
  const { token: idToken } = await identityApi.getCredentials();

  const response = await fetch(
    `${url}/artifactory/api/search/prop?pypi.name=${artifact}&repos=${repo}`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },}
  );
  if (response.status === 404) {
    return undefined;
  }
  if (response.status !== 200) {
    throw new Error(
      `Error getting latest version ${await getErrorMessage(response)}`,
    );
  } else {
    const versionPropsListResponse =
      (await response.json()) as VersionsPropsListResponse;
    const versions = versionPropsListResponse.results
      .map(items => items.properties)
      .map(propertiesInfo => propertiesInfo['pypi.version'][0])
      .filter(item => item !== undefined);
    return findLatestVersion(versions);
  }
}
