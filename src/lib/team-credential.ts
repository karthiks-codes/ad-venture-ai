export function parseTeamCredential(value: string): { teamCode: string; password: string } | null {
  for (const line of value.split(/\r?\n/)) {
    const credential = line.trim();
    const separatorIndex = credential.indexOf("=");
    if (separatorIndex <= 0) continue;

    const teamCode = credential.slice(0, separatorIndex).trim();
    const password = credential.slice(separatorIndex + 1).trim();
    if (/^[A-Za-z0-9-]{2,32}$/.test(teamCode) && password) return { teamCode, password };
  }
  return null;
}
