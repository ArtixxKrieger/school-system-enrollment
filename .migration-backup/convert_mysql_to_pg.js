const fs = require('fs');

let sql = fs.readFileSync('attached_assets/enrollment_1779253370730.sql', 'utf8');

// ── Phase 1: Remove MySQL-only sections as whole blocks ────────────────────

// Remove /*!....*/ conditional comments (possibly multi-line)
sql = sql.replace(/\/\*![\s\S]*?\*\//g, '');

// Remove SET statements
sql = sql.replace(/^SET [^\n]+\n/gm, '');

// Remove START TRANSACTION / COMMIT
sql = sql.replace(/^(START TRANSACTION|COMMIT)[^\n]*\n/gim, '');

// Remove DELIMITER $$ ... DELIMITER ; blocks (MySQL triggers/procs)
sql = sql.replace(/DELIMITER\s+\$\$[\s\S]*?DELIMITER\s+;/g, '');

// Remove stand-in CREATE TABLE for views (multi-line)
sql = sql.replace(/CREATE TABLE `view_\w+`[\s\S]*?\);/g, '');

// ── Phase 2: Convert MySQL views to PostgreSQL ─────────────────────────────

// DROP TABLE IF EXISTS `view_*` -> drop both table and view (in case either exists)
sql = sql.replace(/DROP TABLE IF EXISTS `(view_\w+)`/g, 'DROP TABLE IF EXISTS $1 CASCADE;\nDROP VIEW IF EXISTS $1;');

// CREATE ALGORITHM=... VIEW
sql = sql.replace(
  /CREATE ALGORITHM=\S+ DEFINER=\S+ SQL SECURITY \S+ VIEW `(\w+)`\s+AS\s+/gi,
  'CREATE OR REPLACE VIEW $1 AS '
);

// ── Phase 3: Remove backticks ──────────────────────────────────────────────
sql = sql.replace(/`/g, '');

// ── Phase 4: Fix escaped quotes (MySQL \' -> PostgreSQL '') ───────────────
sql = sql.replace(/\\'/g, "''");

// ── Phase 5: Type conversions ──────────────────────────────────────────────
sql = sql.replace(/\bint\(\d+\)/g, 'integer');
sql = sql.replace(/\btinyint\(\d+\)/g, 'smallint');
sql = sql.replace(/\bmediumtext\b/gi, 'text');
sql = sql.replace(/\bmediumblob\b/gi, 'bytea');
sql = sql.replace(/\blongtext\b/gi, 'text');
sql = sql.replace(/\bdatetime\b/gi, 'timestamp');
sql = sql.replace(/\bdouble\b/g, 'double precision');

// Convert enum(...) to varchar(100)
sql = sql.replace(/\benum\([^)]+\)/g, 'varchar(100)');

// ── Phase 6: Remove MySQL-specific table options ───────────────────────────
sql = sql.replace(/\s*ENGINE=InnoDB[^;]*/g, '');
sql = sql.replace(/\s*DEFAULT CHARSET=\w+[^,;)]*/g, '');
sql = sql.replace(/\s*COLLATE\s+\w+/g, '');
sql = sql.replace(/\bAUTO_INCREMENT\b/gi, '');

// Fix current_timestamp()
sql = sql.replace(/current_timestamp\(\)/gi, 'CURRENT_TIMESTAMP');

// Remove ON UPDATE CURRENT_TIMESTAMP
sql = sql.replace(/\s*ON UPDATE CURRENT_TIMESTAMP/gi, '');

// ── Phase 7: Add DROP TABLE IF EXISTS before each CREATE TABLE ─────────────
sql = sql.replace(/^(CREATE TABLE (\w+))/gm, 'DROP TABLE IF EXISTS $2 CASCADE;\n$1');

// ── Phase 8: Handle multi-line ALTER TABLE index blocks ────────────────────
// These look like:
//   ALTER TABLE tablename
//     ADD PRIMARY KEY (cols),
//     ADD UNIQUE KEY name (cols),
//     ADD KEY name (cols);
//
// Strategy: capture each full ALTER TABLE block and rewrite it

sql = sql.replace(
  /ALTER TABLE (\w+)\s*\n((?:\s*(?:ADD|MODIFY)[^\n]+\n)*\s*(?:ADD|MODIFY)[^\n]+;)/g,
  (match, tableName, body) => {
    const lines = body.split('\n').map(l => l.trim()).filter(Boolean);
    const output = [];
    
    for (let line of lines) {
      // Strip trailing comma/semicolon for parsing
      const clean = line.replace(/[,;]+$/, '').trim();

      // ADD PRIMARY KEY
      const pk = clean.match(/^ADD PRIMARY KEY \(([^)]+)\)/i);
      if (pk) {
        output.push(`ALTER TABLE ${tableName} ADD PRIMARY KEY (${pk[1]});`);
        continue;
      }

      // ADD UNIQUE KEY name (cols)
      const uk = clean.match(/^ADD UNIQUE KEY (\w+) \(([^)]+)\)/i);
      if (uk) {
        output.push(`CREATE UNIQUE INDEX IF NOT EXISTS ${uk[1]} ON ${tableName} (${uk[2]});`);
        continue;
      }

      // ADD KEY name (cols)  
      const k = clean.match(/^ADD KEY (\w+) \(([^)]+)\)/i);
      if (k) {
        output.push(`CREATE INDEX IF NOT EXISTS ${k[1]} ON ${tableName} (${k[2]});`);
        continue;
      }

      // ADD CONSTRAINT ... FOREIGN KEY
      if (/^ADD CONSTRAINT/i.test(clean)) {
        output.push(`ALTER TABLE ${tableName} ${clean};`);
        continue;
      }

      // MODIFY col ... AUTO_INCREMENT, AUTO_INCREMENT=N
      const mod = clean.match(/MODIFY \w+.*AUTO_INCREMENT[^,]*(?:,\s*AUTO_INCREMENT=(\d+))?/i);
      if (mod) {
        // handled by sequence block below
        continue;
      }
    }
    return output.join('\n');
  }
);

// ── Phase 9: Handle single-line ALTER TABLE AUTO_INCREMENT ─────────────────
// ALTER TABLE name MODIFY id integer NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=N;
const seqLines = [];
sql = sql.replace(
  /ALTER TABLE (\w+)\s+MODIFY \w+[^\n]*AUTO_INCREMENT[^\n]*AUTO_INCREMENT=(\d+);?/gi,
  (match, table, n) => {
    seqLines.push(
      `CREATE SEQUENCE IF NOT EXISTS ${table}_id_seq START WITH ${n} INCREMENT BY 1;`,
      `ALTER TABLE ${table} ALTER COLUMN id SET DEFAULT nextval('${table}_id_seq');`,
      `SELECT setval('${table}_id_seq', ${n});`
    );
    return '';
  }
);

// ── Phase 10: Handle standalone AUTO_INCREMENT=N lines ────────────────────
sql = sql.replace(/^\s*AUTO_INCREMENT=\d+[^\n]*\n/gm, '');

// ── Phase 11: Append sequences ────────────────────────────────────────────
if (seqLines.length > 0) {
  sql += '\n-- Auto-increment sequences\n' + seqLines.join('\n') + '\n';
}

// ── Phase 12: Cleanup ─────────────────────────────────────────────────────
// Fix trailing commas before ) in CREATE TABLE (from removed lines)
sql = sql.replace(/,(\s*\n\s*\))/g, '$1');
// Remove double semicolons
sql = sql.replace(/;;/g, ';');
// Clean up 3+ blank lines
sql = sql.replace(/\n{4,}/g, '\n\n');

fs.writeFileSync('enrollment_pg.sql', sql, 'utf8');
console.log('Done: enrollment_pg.sql written (' + sql.length + ' chars)');
