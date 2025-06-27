import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export class SqlLogger {

  logSqlStatement(sqlStatement: string, resultMessage: string): void {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `/* ${timestamp} */ ${sqlStatement}; -- ${resultMessage}\n`;

      const logsDirectory = join(process.cwd(), 'logs');
      if (!existsSync(logsDirectory)) {
        mkdirSync(logsDirectory, { recursive: true });
      }

      const today = new Date().toISOString().split('T')[0];
      const logFilePath = join(logsDirectory, `ifs-sync-${today}.sql`);

      writeFileSync(logFilePath, logEntry, { flag: 'a' });
    } catch (logError) {
      // Logging soll nie die Anwendung zum Absturz bringen
      console.error('Failed to log SQL operation:', logError);
    }
  }
}
