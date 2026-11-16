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

export async function clearData() {
  await clearObjects();
  await clearProjects();
}

export async function clearUserSavedSearchFilters() {
  return connection.query(`
    TRUNCATE TABLE app.user_search_filters CASCADE;`);
}

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

export async function getAuditEvents(eventType: string) {
  return (await connection.query(`
    SELECT event_type AS "eventType", event_data AS "eventData", event_user AS "eventUser"
    FROM app.audit_event
    WHERE event_type = '${eventType.replace(/'/g, "''")}'
    ORDER BY event_timestamp`)) as {
    eventType: string;
    eventData: Record<string, unknown>;
    eventUser: string;
  }[];
}

export async function getMailEvents(projectId: string) {
  return (await connection.query(`
    SELECT template_name AS "templateName", "to", subject, html
    FROM app.mail_event
    WHERE project_id = '${projectId.replace(/'/g, "''")}'`)) as {
    templateName: string;
    to: string[];
    subject: string;
    html: string;
  }[];
}
