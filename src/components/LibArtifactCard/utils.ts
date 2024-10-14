export function formatDate(date: Date): string {
  if (!date) {
    return 'N/A';
  }
  // eslint-disable-next-line new-cap
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const options: Intl.DateTimeFormatOptions = {
    timeZone,
    year: 'numeric',
    month: 'short', // Month as 3-letter string
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false, // Use 24-hour format
  };

  const isoString = date.toLocaleString('en-US', options);

  const parts = isoString.replace(',', '').split(' ');
  const year = parts[2];
  const month = parts[0];
  const day = parts[1];
  const time = parts[3];

  return `${day}-${month}-${year} ${time}`;
}

export function formatSize(sizeInBytes: number) {
  if (!sizeInBytes) {
    // null or undefined
    return 'N/A';
  }

  const i = Math.floor(Math.log(sizeInBytes) / Math.log(1024));
  return `${Number((sizeInBytes / Math.pow(1024, i)).toFixed(2))} ${
    ['B', 'kB', 'MB', 'GB', 'TB'][i]
  }`;
}
