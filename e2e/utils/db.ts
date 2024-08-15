import pg from 'pg';

const { Pool } = pg;

class DatabaseConnection {
  private pool: any;

  constructor() {
    this.pool = new Pool({
      user: 'app_user_dev',
      host: '127.0.0.1',
      database: 'app_dev_db',
      password: 'DevPassword',
      port: 5432,
    });
  }

  private async disconnect() {
    await this.pool.end();
  }

  async query(query: string) {
    try {
      const res = await this.pool.query(query);
      return res.rows;
    } catch (err) {
      console.log(err);
    }
  }
}

const connection = new DatabaseConnection();
export async function clearObjects() {
  return connection.query(`
    TRUNCATE TABLE app.project_object CASCADE;`);
}

export async function clearProjects() {
  return connection.query(`
    TRUNCATE TABLE app.project CASCADE;`);
}

export async function clearGeneralNotifications() {
  return connection.query(`
    TRUNCATE TABLE app.general_notification CASCADE;`);
}

export async function clearProjectPermissions() {
  return connection.query(`
    DELETE FROM app.project_permission;`);
}
