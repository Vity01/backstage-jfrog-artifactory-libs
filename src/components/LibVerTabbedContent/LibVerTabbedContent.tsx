import { LibArtifactCardProps } from '../../types';
import {
  CardTab,
  CodeSnippet,
  Progress,
  TabbedCard,
} from '@backstage/core-components';
import { LibVerView } from '../LibVerView';
import React from 'react';
import { ArtifactInfo, GeneratedCode } from '../LibArtifactCard/api';
import { Divider, makeStyles } from '@material-ui/core';
import { ClassNameMap } from '@material-ui/core/styles/withStyles';
import { capitalize } from 'lodash';

const useStyles = makeStyles({
  dividerMargin: {
    margin: '0.75em 0 1em 0',
  },
});

export type LibVerTabbedContentProps = {
  props: LibArtifactCardProps;
  loading: boolean;
  artifactoryUrl: string;
  artifactInfo: ArtifactInfo[] | undefined;
};

function isPackageType(
  props: LibArtifactCardProps,
  artifactInfo: ArtifactInfo[] | undefined,
  packageType: string,
) {
  return (
    !props.autohideTabs ||
    (props.autohideTabs &&
      artifactInfo?.some(
        value =>
          value.lib.packageType?.toLowerCase() === packageType.toLowerCase(),
      ))
  );
}

function getTab(
  type: keyof GeneratedCode,
  language: string = 'plainText',
  artifactInfo: ArtifactInfo[] | undefined,
  tabTitle?: string,
) {
  return (
    <CardTab label={tabTitle || capitalize(type)} key="`artifactInfo${type}`">
      <CodeSnippet
        language={language}
        text={artifactInfo?.map(item => item.code()[type]).join('\n') || ''}
        showCopyCodeButton
      />
    </CardTab>
  );
}

function getDockerfileTab(artifactInfo: ArtifactInfo[] | undefined) {
  return (
    <CardTab label="Dockerfile" key="artifactInfoDockerfile">
      <CodeSnippet
        customStyle={{ flexGrow: 1, minHeight: '50vh' }}
        language="dockerfile"
        text={
          artifactInfo
            ?.map(
              item =>
                `FROM ${item?.lib.artifactFullName || item?.lib.artifact}:${
                  item?.lib.version || 'latest'
                }`,
            )
            .join('\n') || ''
        }
        showCopyCodeButton
      />
    </CardTab>
  );
}

export function infoTab(
  loading: boolean,
  artifactInfo: ArtifactInfo[],
  artifactoryUrl: string,
  classes: ClassNameMap,
): React.JSX.Element {
  return (
    <CardTab label="Info" key="artifactInfo">
      {loading && <Progress />}
      {!loading &&
        artifactInfo.map(item => {
          return (
            <>
              <LibVerView
                key={`LibVerView${item.lib.artifact}`}
                artifactoryUrl={artifactoryUrl}
                lib={item.lib}
              />
              {item !== artifactInfo[artifactInfo.length - 1] && (
                <Divider
                  classes={{ root: classes.dividerMargin }}
                  key={`Divider${item.lib.artifact}`}
                />
              )}
            </>
          );
        })}
    </CardTab>
  );
}

export const LibVerTabbedContent = ({
  props,
  loading,
  artifactoryUrl,
  artifactInfo,
}: LibVerTabbedContentProps) => {
  const tabs: React.JSX.Element[] = [];
  const classes = useStyles();
  if (artifactInfo && artifactInfo.length > 0) {
    tabs.push(infoTab(loading, artifactInfo, artifactoryUrl, classes));
  }
  if (!loading) {
    if (props.showGradle && isPackageType(props, artifactInfo, 'maven')) {
      tabs.push(getTab('gradle', 'groovy', artifactInfo));
    }
    if (props.showMaven && isPackageType(props, artifactInfo, 'maven')) {
      tabs.push(getTab('maven', 'xml', artifactInfo));
    }
    if (props.showSbt && isPackageType(props, artifactInfo, 'maven')) {
      tabs.push(getTab('sbt', 'plainText', artifactInfo));
    }
    if (props.showPip && isPackageType(props, artifactInfo, 'pypi')) {
      tabs.push(getTab('pip', 'plainText', artifactInfo));
    }
    if (props.showNuget && isPackageType(props, artifactInfo, 'nuget')) {
      tabs.push(getTab('nuget', 'xml', artifactInfo));
    }
    if (props.showNpm && isPackageType(props, artifactInfo, 'npm')) {
      tabs.push(getTab('npm', 'json', artifactInfo));
    }
    if (props.showYarn && isPackageType(props, artifactInfo, 'npm')) {
      tabs.push(getTab('yarn', 'plainText', artifactInfo));
    }
    if (props.showDockerfile && isPackageType(props, artifactInfo, 'docker')) {
      tabs.push(getDockerfileTab(artifactInfo));
    }
  }

  const deepLink = props.showBrowseRepositoryLink
    ? {
        link: loading ? '' : props.browseLink(artifactoryUrl, artifactInfo),
        title: props.browseRepositoryLinkTitle,
      }
    : undefined;

  return (
    <TabbedCard
      title={props.title}
      deepLink={deepLink}
      // Has to be an array, otherwise typescript doesn't like that this has only a single child
      children={tabs}
    />
  );
};
