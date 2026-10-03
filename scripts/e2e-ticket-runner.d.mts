export declare function hasExecutedTests(output: string): boolean;

export declare function planTicketE2ERun(repositoryRoot: string, ticketId: string, startedAt?: Date): {
  ticketId: string;
  ticketFile: string;
  specFile: string;
  specRelativePath: string;
  runDirectory: string;
  videoDirectory: string;
  logFile: string;
  cypressExecutable: string;
  cypressArgs: string[];
};
