/**
 * Creates the `users` table.
 * - `gender` uses a Postgres enum so the database also rejects invalid values.
 * - `email` is unique at the database level, so two parallel requests cannot
 *   create the same account.
 */
exports.up = (pgm) => {
  pgm.createType('gender_enum', ['male', 'female']);

  pgm.createTable('users', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(100)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    gender: { type: 'gender_enum', notNull: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('users');
  pgm.dropType('gender_enum');
};
