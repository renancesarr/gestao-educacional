export interface TicketE2ERun {
  ticketId: string;
  ticketFile: string;
  specFile: string;
  specRelativePath: string;
  runDirectory: string;
  videoDirectory: string;
  logFile: string;
  cypressExecutable: string;
  cypressArgs: string[];
}

export function hasExecutedTests(output: string): boolean;

export function commandForHiddenDisplay(
  command: string,
  args: string[],
  platform?: string,
): { command: string; args: string[] };

export function planTicketE2ERun(
  repositoryRoot: string,
  ticketId: string,
  startedAt?: Date,
): TicketE2ERun;
