"""Export a closed, isolated Miniflare SQLite database without converting Int64 to JS Number."""
# codeguard:components:start
# codeguard:defines: test cases or fixtures below
import pathlib as file_paths
import sqlite3 as sqlite_store
import sys as command_line
# codeguard:components:end

source = file_paths.Path(command_line.argv[1]).resolve()
target = file_paths.Path(command_line.argv[2]).resolve()
with sqlite_store.connect(source.as_uri() + '?mode=ro', uri=True) as connection:
    schema = connection.execute("SELECT type,name,tbl_name,sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END,name").fetchall()
    schema = [row for row in schema if not row[2].startswith(('_cf_', 'sqlite_'))]
    tables = {name for kind, name, _, _ in schema if kind == 'table'}
    dependencies = {name: {row[2] for row in connection.execute('PRAGMA foreign_key_list("' + name.replace('"', '""') + '")') if row[2] in tables} for name in tables}
    with target.open('w', encoding='utf-8', newline='\n') as output:
        # D1 executes statements separately: create every table, then restore parents before children.
        for _, _, _, sql in schema:
            output.write(sql.rstrip(';') + ';\n')
        while dependencies:
            ready = sorted(name for name, parents in dependencies.items() if not parents)
            if not ready:
                raise ValueError('Cyclic foreign keys need a separately reviewed restoration strategy.')
            for name in ready:
                prefix = 'INSERT INTO "' + name.replace('"', '""') + '"'
                for statement in connection.iterdump(filter=name):
                    if statement.startswith(prefix):
                        output.write(statement + '\n')
                del dependencies[name]
            for parents in dependencies.values():
                parents.difference_update(ready)
