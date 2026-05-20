import re
import sys

with open('attached_assets/enrollment_1779253370730.sql', 'r', encoding='utf-8') as f:
    sql = f.read()

lines = sql.split('\n')
output = []
skip_until_delimiter = False
in_alter_table = None
table_sequences = {}

# Sequences to create at end, based on AUTO_INCREMENT values
sequence_setvals = []

i = 0
while i < len(lines):
    line = lines[i]

    # Skip MySQL conditional comments
    if re.match(r'\s*/\*!', line) or re.match(r'\s*\*/', line):
        i += 1
        continue

    # Skip SET statements
    if re.match(r'\s*SET (SQL_MODE|time_zone|@OLD_)', line):
        i += 1
        continue

    # Skip START TRANSACTION / COMMIT
    if re.match(r'\s*(START TRANSACTION|COMMIT)', line):
        i += 1
        continue

    # Skip DELIMITER blocks (MySQL triggers)
    if re.match(r'\s*DELIMITER\s+\$\$', line):
        skip_until_delimiter = True
        i += 1
        continue
    if skip_until_delimiter:
        if re.match(r'\s*DELIMITER\s+;', line):
            skip_until_delimiter = False
        i += 1
        continue

    # Skip stand-in CREATE TABLE for views (they get re-created as actual views)
    # Detect them: CREATE TABLE `view_*`
    if re.match(r'\s*CREATE TABLE `view_', line):
        # skip until closing );
        while i < len(lines):
            if re.match(r'\s*\);', lines[i]):
                i += 1
                break
            i += 1
        continue

    # Convert MySQL views to PostgreSQL views
    # DROP TABLE IF EXISTS `view_*`
    if re.match(r'\s*DROP TABLE IF EXISTS `view_', line):
        tbl = re.search(r'`(view_\w+)`', line)
        if tbl:
            output.append(f"DROP VIEW IF EXISTS {tbl.group(1)};")
        i += 1
        continue

    # CREATE ALGORITHM=... VIEW
    m = re.match(r'\s*CREATE ALGORITHM=\S+ DEFINER=\S+ SQL SECURITY \S+ VIEW `(\w+)`\s+AS\s+(.*)', line, re.IGNORECASE)
    if m:
        view_name = m.group(1)
        view_body = m.group(2)
        # Remove backticks from view body
        view_body = view_body.replace('`', '')
        output.append(f"CREATE OR REPLACE VIEW {view_name} AS {view_body}")
        i += 1
        continue

    # Handle ALTER TABLE ... MODIFY ... AUTO_INCREMENT=N
    m = re.match(r'\s*ALTER TABLE `(\w+)`\s*$', line)
    if m:
        in_alter_table = m.group(1)
        i += 1
        continue

    if in_alter_table:
        # MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=N;
        m = re.match(r'\s*MODIFY `id`.*AUTO_INCREMENT,\s*AUTO_INCREMENT=(\d+);?', line)
        if m:
            n = int(m.group(1))
            tbl = in_alter_table
            seq_name = f"{tbl}_id_seq"
            table_sequences[tbl] = n
            sequence_setvals.append(
                f"CREATE SEQUENCE IF NOT EXISTS {seq_name} START WITH {n} INCREMENT BY 1;\n"
                f"ALTER TABLE {tbl} ALTER COLUMN id SET DEFAULT nextval('{seq_name}');\n"
                f"SELECT setval('{seq_name}', {n});"
            )
            in_alter_table = None
            i += 1
            continue
        # ADD CONSTRAINT ... FOREIGN KEY - keep these, but handle syntax
        if re.match(r'\s*ADD CONSTRAINT', line):
            cleaned = line.replace('`', '')
            output.append(cleaned)
            in_alter_table = None
            i += 1
            continue
        # Empty or semicolon ends it
        if re.match(r'\s*;?\s*$', line):
            in_alter_table = None
            i += 1
            continue
        in_alter_table = None

    # Handle ALTER TABLE with constraints/indexes on same statement block
    # Multi-line ALTER TABLE `table` ADD PRIMARY KEY ...
    # We'll process them inline below

    # Remove backticks
    line = line.replace('`', '')

    # Type conversions
    line = re.sub(r'\bint\(\d+\)\b', 'integer', line)
    line = re.sub(r'\btinyint\(\d+\)\b', 'smallint', line)
    line = re.sub(r'\bmediumtext\b', 'text', line)
    line = re.sub(r'\bmediumblob\b', 'bytea', line)
    line = re.sub(r'\blongtext\b', 'text', line)
    line = re.sub(r'\bdouble\b', 'double precision', line)
    line = re.sub(r'\bfloat\b', 'real', line)

    # Convert enum(...) to varchar(100)
    line = re.sub(r"\benum\([^)]+\)", "varchar(100)", line)

    # Remove ENGINE=InnoDB, DEFAULT CHARSET, COLLATE lines
    line = re.sub(r'\s*ENGINE=InnoDB[^;]*', '', line)
    line = re.sub(r'\s*DEFAULT CHARSET=\w+[^,;)]*', '', line)
    line = re.sub(r'\s*COLLATE\s+\w+', '', line)

    # current_timestamp() -> CURRENT_TIMESTAMP
    line = re.sub(r'current_timestamp\(\)', 'CURRENT_TIMESTAMP', line, flags=re.IGNORECASE)

    # Remove ON UPDATE CURRENT_TIMESTAMP (not supported inline in PG)
    line = re.sub(r'\s*ON UPDATE CURRENT_TIMESTAMP', '', line, flags=re.IGNORECASE)

    # Fix NOT NULL AUTO_INCREMENT -> NOT NULL
    line = re.sub(r'\bAUTO_INCREMENT\b', '', line, flags=re.IGNORECASE)

    # Fix ALTER TABLE ... ADD PRIMARY KEY
    if re.match(r'\s*ALTER TABLE \w+', line):
        # ADD KEY name (cols) -> CREATE INDEX
        m_pk = re.match(r'\s*ALTER TABLE (\w+)\s+ADD PRIMARY KEY \(([^)]+)\);?', line)
        if m_pk:
            output.append(f"ALTER TABLE {m_pk.group(1)} ADD PRIMARY KEY ({m_pk.group(2)});")
            i += 1
            continue

        m_uk = re.match(r'\s*ALTER TABLE (\w+)\s+ADD UNIQUE KEY (\w+) \(([^)]+)\);?', line)
        if m_uk:
            output.append(f"CREATE UNIQUE INDEX IF NOT EXISTS {m_uk.group(2)} ON {m_uk.group(1)} ({m_uk.group(3)});")
            i += 1
            continue

        m_k = re.match(r'\s*ALTER TABLE (\w+)\s+ADD KEY (\w+) \(([^)]+)\);?', line)
        if m_k:
            output.append(f"CREATE INDEX IF NOT EXISTS {m_k.group(2)} ON {m_k.group(1)} ({m_k.group(3)});")
            i += 1
            continue

    # Inside a multi-line ALTER TABLE indexes block
    # ADD PRIMARY KEY (`id`) -> ADD PRIMARY KEY (id)
    line = re.sub(r'ADD PRIMARY KEY', 'ADD PRIMARY KEY', line)

    # ADD UNIQUE KEY name (cols) -> ADD CONSTRAINT name UNIQUE (cols)
    line = re.sub(
        r'ADD UNIQUE KEY (\w+) \(([^)]+)\)',
        r'ADD CONSTRAINT \1 UNIQUE (\2)',
        line
    )

    # ADD KEY name (cols) -> skip (will handle via CREATE INDEX below)
    # Actually for multi-line ALTER TABLE, we need to track the table name
    if re.match(r'\s*ADD KEY \w+', line):
        i += 1
        continue

    # Fix MODIFY lines that weren't caught (already handled above mostly)
    if re.match(r'\s*MODIFY \w+', line):
        i += 1
        continue

    # Skip empty AUTO_INCREMENT standalone lines
    if re.match(r'\s*AUTO_INCREMENT=\d+', line):
        i += 1
        continue

    # Fix trailing commas before ); in CREATE TABLE when a line was removed
    # (handled by removing the line itself)

    # Remove double semicolons
    line = re.sub(r';;', ';', line)

    # Remove lines that are just whitespace after substitution
    if re.match(r'^\s*,?\s*$', line) and line.strip() in ('', ','):
        i += 1
        continue

    output.append(line)
    i += 1

# Append sequence setup at end
if sequence_setvals:
    output.append('\n-- Sequences for auto-increment columns')
    for s in sequence_setvals:
        output.append(s)

result = '\n'.join(output)

# Fix trailing commas before ); in CREATE TABLE statements
# e.g. if a line was completely removed and the previous line ends with comma
result = re.sub(r',(\s*\n\s*\))', r'\1', result)

# Clean up multiple blank lines
result = re.sub(r'\n{3,}', '\n\n', result)

with open('enrollment_pg.sql', 'w', encoding='utf-8') as f:
    f.write(result)

print("Conversion complete: enrollment_pg.sql")
