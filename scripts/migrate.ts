import { databasePool } from '../src/database/connection.ts';
import { migrate } from '../src/database/migrate.ts';

const pool = databasePool();
try { await migrate(pool); console.log('Migrações aplicadas.'); }
catch { console.error('Falha ao aplicar migrações. Confira a conexão, as permissões e a integridade dos arquivos.'); process.exitCode = 1; }
finally { await pool.end(); }
