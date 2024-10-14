function convertToNumberOrString(value: string): number | string {
  const parsedNumber = parseInt(value, 10);
  return isNaN(parsedNumber) ? value : parsedNumber;
}

function compareVersions(versionA: string, versionB: string): number {
  const partsA = versionA.split('.').map(item => convertToNumberOrString(item));
  const partsB = versionB.split('.').map(item => convertToNumberOrString(item));

  const maxLength = Math.max(partsA.length, partsB.length);
  for (let i = 0; i < maxLength; i++) {
    const partA = partsA[i] || 0;
    const partB = partsB[i] || 0;

    if (partA < partB) {
      return -1;
    } else if (partA > partB) {
      return 1;
    }
  }

  return 0;
}

export function findLatestVersion(versions: string[]): string | undefined {
  if (versions.length === 0) {
    return undefined;
  }

  let latestVersion = versions[0];
  for (let i = 1; i < versions.length; i++) {
    if (compareVersions(versions[i], latestVersion) === 1) {
      latestVersion = versions[i];
    }
  }

  return latestVersion;
}
