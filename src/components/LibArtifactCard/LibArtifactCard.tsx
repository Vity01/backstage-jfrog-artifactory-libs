import React, {useEffect, useState} from 'react';
import {configApiRef, fetchApiRef, useApi} from '@backstage/core-plugin-api';
import {
    ResponseErrorPanel,

} from '@backstage/core-components';
import {useEntity} from '@backstage/plugin-catalog-react';
import {
    ENTITY_ARTIFACT,
    ENTITY_GROUP,
    ENTITY_PACKAGING,
    ENTITY_REPO, ENTITY_SCOPE, isJfrogArtifactAvailable, isJfrogRepoAvailable,
    LibArtifactCardProps,
    LibraryArtifact
} from '../../types';
import {generatePackageManagersCode} from './codeSnippets';
import {LibVerTabbedContent} from "../LibVerTabbedContent";
import {findLatestVersion} from "./versionUtils";
import {Entity} from "@backstage/catalog-model";

export type GeneratedCode = {
    gradle: string;
    maven: string;
    sbt: string;
    pip: string;
};

export type ArtifactInfo = {
    lib: LibraryArtifact;
    code: GeneratedCode;
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
    "pypi.version": string[];
}

export interface PropsResponse {
    properties: PropertiesInfo
}

export interface VersionsPropsListResponse {
    results: PropsResponse[];
}


export async function getErrorMessage(response: Response) {
    return ((await response.json()) as Errors).errors[0].message;
}

async function getRepositoryType(
    fetch: {
        (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
        (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    },
    url: string,
    {repo}: LibraryArtifact,
) {
    const response = await fetch(
        `${url}artifactory/api/repositories/${repo}`,
    );
    if (response.status === 404) {
        throw new Error(`Repository ${repo} was not found`);
    } else {
        if (response.status !== 200) {
            throw new Error(`Cannot get repository ${repo} detail info ` + await getErrorMessage(response));
        } else {
            return await response.json() as RepositoryDetails;
        }
    }
}


async function getMavenLatestVersion(
    fetch: {
        (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
        (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    },
    url: string,
    {group, artifact, repo}: LibraryArtifact,
) {
    const response = await fetch(
        `${url}artifactory/api/search/latestVersion?g=${group}&a=${artifact}&repos=${repo}`,
    );
    if (response.status === 404) {
        return undefined;
    } else {
        if (response.status !== 200) {
            throw new Error(`Error getting latest version ` + await getErrorMessage(response));
        } else {
            return await response.text();
        }
    }
}

async function getPypiLatestVersion(
    fetch: {
        (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
        (input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
    },
    url: string,
    {artifact, repo}: LibraryArtifact,
) {
    const response = await fetch(
        `${url}/artifactory/api/search/prop?pypi.name=${artifact}&repos=${repo}`,
    );
    if (response.status === 404) {
        return undefined;
    } else {
        if (response.status !== 200) {
            throw new Error(`Error getting latest version ` + await getErrorMessage(response));
        } else {
            const versionPropsListResponse = await response.json() as VersionsPropsListResponse;
            const versions = versionPropsListResponse.results
                .map(items => items.properties)
                .map(propertiesInfo => propertiesInfo["pypi.version"][0])
                .filter(item => item !== undefined)
            return findLatestVersion(versions);
        }
    }
}

export const DEFAULT_PROXY_PATH = '/artifactory-proxy/';
export const LibArtifactCard = (props: LibArtifactCardProps) => {
    const {fetch} = useApi(fetchApiRef);
    const config = useApi(configApiRef);
    const {entity} = useEntity<Entity>();

    const artifactoryUrl = config.getString('jfrog.artifactory.url');
    const artifactoryBackendProxy = config.getOptionalString('jfrog.artifactory.proxyPath') || DEFAULT_PROXY_PATH;

    const annotations = entity.metadata?.annotations;

    const entityArtifact: LibraryArtifact = {
        repo: annotations?.[ENTITY_REPO] || '',
        group: annotations?.[ENTITY_GROUP],
        artifact: annotations?.[ENTITY_ARTIFACT] || '',
        packaging: annotations?.[ENTITY_PACKAGING],
        scope: annotations?.[ENTITY_SCOPE],
    };

    if (isJfrogArtifactAvailable(entity) && !isJfrogRepoAvailable(entity)) {
        throw new Error(`Repository definition is required for JFrog artifact ${entityArtifact.artifact}`);
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

                const {packageType} = await getRepositoryType(fetch, url, entityArtifact);
                let result;
                switch (packageType) {
                    case 'pypi':
                        result = await getPypiLatestVersion(fetch, url, entityArtifact);
                        break;
                    default:
                        result = await getMavenLatestVersion(fetch, url, entityArtifact);
                }

                const artInfo = {...entityArtifact};
                artInfo.version = result;
                artInfo.packageType = packageType;

                setArtifactInfo({
                    lib: artInfo,
                    code: generatePackageManagersCode(artInfo, false, false),
                });
                setLoading(false);
                return result;
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
        return <ResponseErrorPanel error={error}/>;
    }

    return <LibVerTabbedContent props={props} loading={loading} artifactoryUrl={artifactoryUrl} artifactInfo={artifactInfo} />;
};

LibArtifactCard.defaultProps = {
    title: 'Artifact', // title of the card
    browseRepositoryLinkTitle: 'Browse Repository', // Card deep link title
    showGradle: true, // whether to show Gradle package manager tab
    showMaven: true, // whether to  show Maven package manager tab
    showSbt: true, // whether to  show Sbt package manager tab
    showPip: true, // whether to  show Pip package manager tab
    // it hides Maven and Gradle tabs if the current repository package type is `PyPi`
    autohideTabs: true,
    showBrowseRepositoryLink: true // whether to show Browse to URL deep link under bottom of the Card
};
