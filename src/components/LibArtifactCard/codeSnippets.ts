import { LibraryArtifact } from '../../types';
import { GeneratedCode } from './api';

function removeScalaVersion(artifactName: string) {
  const underscorePos = artifactName.lastIndexOf('_');
  const hasScalaVersion =
    underscorePos > 0 &&
    artifactName.substring(underscorePos + 1).match(/^[0-9]|\?/gi);
  return hasScalaVersion
    ? artifactName.substring(0, underscorePos)
    : artifactName;
}

function generateGradleMavenCode(
  gradleScope: string,
  func1: string,
  lib: LibraryArtifact,
  artifactWithoutScalaVersion: string,
  gradleScalaVersion: string,
  packaging: string,
  func2: string,
  transitive: string,
  mavenScope: string,
  classifier: string,
  sbtScope: string,
  sbtScalaVersion: string,
) {
  let mavenClassifier = '';
  let gradleClassifier = '';
  let sbtClassifier = '';

  if (classifier !== '') {
    mavenClassifier = `\n\t<classifier>${classifier}</classifier>`;
    gradleClassifier = `:${classifier}`;
    sbtClassifier = ` classifier ` + `"${classifier}"`;
  }

  const version = lib.version !== undefined ? lib.version : '';

  const gradle = `${
    gradleScope + func1 + lib.group
  }:${artifactWithoutScalaVersion}${gradleScalaVersion}:${version}${gradleClassifier}${packaging}${func2}${transitive}\n`;

  const maven = `<dependency>\n\t<groupId>${lib.group}</groupId>\n\t<artifactId>${lib.artifact}</artifactId>\n\t<version>${version}</version>${mavenClassifier}\n\t<scope>${mavenScope}</scope>\n</dependency>\n`;

  const sbt =
    `"${lib.group}" ${sbtScalaVersion}% "${artifactWithoutScalaVersion}" % "${version}"${sbtClassifier}${sbtScope}` +
    ',\n';
  const npm = `"${lib.artifact}": "^${version}"`;
  // command to add the package to the project using yarn
  const yarn = `yarn add ${lib.artifact}`;
  const nuget = `<PackageReference Include="${lib.artifact}" Version="${version}" />`;
  return {
    gradle: gradle,
    maven: maven,
    sbt: sbt,
    npm: npm,
    nuget: nuget,
    yarn: yarn,
  };
}

function getScalaVersion(artifactName: string) {
  const underscorePos = artifactName.lastIndexOf('_');
  if (underscorePos > 0) {
    const classifier = artifactName.substring(underscorePos + 1);
    if (classifier.match(/^[0-9]|\?/gi)) {
      return classifier;
    }
  }
  return null;
}

export function generatePackageManagersCode(
  lib: LibraryArtifact,
  generateClassifierVariants: boolean,
  replaceScalaVersion: boolean,
): GeneratedCode {
  let gradle = '';
  let maven = '';
  let sbt = '';
  let pip = '';
  let nuget = '';
  let npm = '';
  let yarn = '';

  const version = lib.version !== undefined ? lib.version : '';

  pip += `${lib.artifact}==${version}\n`;

  let scalaVersion = getScalaVersion(lib.artifact);
  //            var mavenClassifier = scalaVersion ? "\n\t<scalaVersion>{0}</scalaVersion>".formatX(scalaVersion) : "";
  if (replaceScalaVersion && scalaVersion) {
    scalaVersion = '?';
  }
  const gradleScalaVersion = scalaVersion ? `_${scalaVersion}` : '';
  const sbtScalaVersion = scalaVersion ? '%' : '';
  const artifactWithoutScalaVersion = removeScalaVersion(lib.artifact);

  let gradleScope = 'implementation';
  let mavenScope = 'compile';
  let sbtScope = '';
  if (lib.scope) {
    mavenScope = lib.scope;
    if (lib.scope.toLowerCase().includes('test')) {
      gradleScope = 'testImplementation';
      sbtScope = ' % "test"';
    }
    if (lib.scope.toLowerCase().includes('provided')) {
      gradleScope = 'compileOnly';
      sbtScope = ' % "provided"';
    }
    if (lib.scope.toLowerCase().includes('runtime')) {
      gradleScope = 'implementation';
      sbtScope = ' % "runtime"';
    }
    if (lib.scope.toLowerCase().includes('classpath')) {
      gradleScope = 'classpath';
      mavenScope = 'compile';
    }
    if (lib.scope.toLowerCase().includes('optional')) {
      sbtScope = ' % "optional"';
    }
  }
  let transitive = '';
  let func1 = ' "';
  let func2 = '"';
  if (lib.transitive) {
    transitive = ` {\n\t transitive = ${lib.transitive}\n}'`;
    func1 = ' ("';
    func2 = '")';
  }
  let packaging = '';
  if (lib.packaging) {
    packaging = `@${lib.packaging}`;
  }
  if (
    lib.classifiers &&
    Object.keys(lib.classifiers).length > 0 &&
    generateClassifierVariants
  ) {
    lib.classifiers.forEach(classifier => {
      const __ret = generateGradleMavenCode(
        gradleScope,
        func1,
        lib,
        artifactWithoutScalaVersion,
        gradleScalaVersion,
        packaging,
        func2,
        transitive,
        mavenScope,
        classifier,
        sbtScope,
        sbtScalaVersion,
      );
      gradle += __ret.gradle;
      maven += __ret.maven;
      sbt += __ret.sbt;
      nuget += __ret.nuget;
      npm += __ret.npm;
    });
  } else {
    const __ret = generateGradleMavenCode(
      gradleScope,
      func1,
      lib,
      artifactWithoutScalaVersion,
      gradleScalaVersion,
      packaging,
      func2,
      transitive,
      mavenScope,
      '',
      sbtScope,
      sbtScalaVersion,
    );
    gradle += __ret.gradle;
    maven += __ret.maven;
    sbt += __ret.sbt;
    nuget += __ret.nuget;
    npm += __ret.npm;
    yarn += __ret.yarn;
  }
  return {
    gradle,
    maven,
    sbt,
    pip,
    nuget,
    npm,
    yarn,
  };
}
