import { LibArtifactCardProps } from '../../types';
import {
  CardTab,
  CodeSnippet,
  Progress,
  TabbedCard,
} from '@backstage/core-components';
import { LibVerView } from '../LibVerView';
import React from 'react';
import {
  ArtifactInfo,
} from '../LibArtifactCard/LibArtifactCard';
import {getBrowserVersionUrl} from "../LibVerView/LibVerView";

export type LibVerTabbedContentProps = {
  props: LibArtifactCardProps;
  loading: boolean;
  artifactoryUrl: string;
  artifactInfo: ArtifactInfo | undefined;
};

function isMavenPackageType(
  props: LibArtifactCardProps,
  artifactInfo: ArtifactInfo | undefined,
) {
  const b = props.autohideTabs && artifactInfo?.lib?.packageType === 'maven';
  console.log(
    'Check autohide with result ' + ' ' + props.autohideTabs + ' ' + b,
  );
  return b;
}

function getPipTab(artifactInfo: ArtifactInfo | undefined) {
  return (
    <CardTab label="Pip" key="artifactInfoPyPi">
      <CodeSnippet
        language={'plainText'}
        text={artifactInfo?.code.pip || ''}
        showCopyCodeButton={true}
      />
    </CardTab>
  );
}

function getSbtTab(artifactInfo: ArtifactInfo | undefined) {
  return (
    <CardTab label="Sbt" key="artifactInfoSbt">
      <CodeSnippet
        language={'plainText'}
        text={artifactInfo?.code.sbt || ''}
        showCopyCodeButton={true}
      />
    </CardTab>
  );
}

function getMavenTab(artifactInfo: ArtifactInfo | undefined) {
  return (
    <CardTab label={'Maven'} key="artifactInfoMaven" hidden={true}>
      <CodeSnippet
        language={'xml'}
        text={artifactInfo?.code.maven || ''}
        showCopyCodeButton={true}
      />
    </CardTab>
  );
}

function getGradleTab(artifactInfo: ArtifactInfo | undefined) {
  return (
    <CardTab label="Gradle" key="artifactInfoGradle" hidden={true}>
      <CodeSnippet
        language={'groovy'}
        text={artifactInfo?.code.gradle || ''}
        showCopyCodeButton={true}
      />
    </CardTab>
  );
}

function getInfoTab(
  loading: boolean,
  artifactInfo: ArtifactInfo | undefined,
  artifactoryUrl: string,
) {
  return (
    <CardTab label="Info" key="artifactInfo">
      {loading && <Progress />}
      {!loading && <LibVerView artifactoryUrl={artifactoryUrl} lib={artifactInfo!!.lib} />}
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
  tabs.push(getInfoTab(loading, artifactInfo, artifactoryUrl));
  if (props.showGradle && isMavenPackageType(props, artifactInfo)) {
    tabs.push(getGradleTab(artifactInfo));
  }
  if (props.showMaven && isMavenPackageType(props, artifactInfo)) {
    tabs.push(getMavenTab(artifactInfo));
  }
  if (props.showSbt && isMavenPackageType(props, artifactInfo)) {
    tabs.push(getSbtTab(artifactInfo));
  }
  if (props.showPip && !isMavenPackageType(props, artifactInfo)) {
    tabs.push(getPipTab(artifactInfo));
  }

  const deepLink = props.showBrowseRepositoryLink? {
    link: loading ? '' : getBrowserVersionUrl(artifactoryUrl, artifactInfo!!.lib),
    title: props.browseRepositoryLinkTitle,
  } : undefined;

  return (
    <TabbedCard
      title={props.title}
      deepLink={deepLink}
      // Has to be an array, otherwise typescript doesn't like that this has only a single child
      children={tabs}
    />
  );
};
