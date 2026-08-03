import { arch, cpus, freemem, hostname, loadavg, platform, release, totalmem, userInfo } from "node:os";

export type SystemInfo = {
  platform: NodeJS.Platform;
  arch: string;
  release: string;
  hostname: string;
  user: string;
  cpuCount: number;
  cpuModel: string;
  totalMemBytes: number;
  freeMemBytes: number;
  usedMemPercent: number;
  uptimeSec: number;
  load: { one: number; five: number; fifteen: number };
  nodeVersion: string;
};

export function getSystemInfo(): SystemInfo {
  const total = totalmem();
  const free = freemem();
  const cpusList = cpus();
  const first = cpusList[0];
  const load = loadavg();

  return {
    platform: platform(),
    arch: arch(),
    release: release(),
    hostname: hostname(),
    user: userInfo().username,
    cpuCount: cpusList.length,
    cpuModel: first ? first.model : "unknown",
    totalMemBytes: total,
    freeMemBytes: free,
    usedMemPercent: total > 0 ? Math.round(((total - free) / total) * 100) : 0,
    uptimeSec: Math.floor(process.uptime()),
    load: { one: load[0] ?? 0, five: load[1] ?? 0, fifteen: load[2] ?? 0 },
    nodeVersion: process.version,
  };
}