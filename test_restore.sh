#!/bin/bash

DB_USER="app_user_dev"
DB_NAME="app_dev_db"
DB_HOST="localhost"
BACKUP_DIR="temp"

SAP_TABLES=(
    "sap_project"
    "sap_wbs"
    "sap_network"
    "sap_activity"
    "sap_actuals_item"
)

# For each SAP_TABLES table, import the data from a binary file
echo "Restoring binary backups for the following tables: ${SAP_TABLES[@]}..."

for TABLE_NAME in "${SAP_TABLES[@]}"; do
    echo "Restoring backup for table: $TABLE_NAME..."
    INPUT_FILE="${BACKUP_DIR}/${TABLE_NAME}.bin"
    CMD="COPY app.${TABLE_NAME} FROM STDIN WITH BINARY"
    docker exec -i hanna-db-1 psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "$CMD" < $INPUT_FILE
done

echo "Restoring backup of the rest of the data..."
docker exec -i hanna-db-1 pg_restore -U $DB_USER -h $DB_HOST -d $DB_NAME -Fc < "${BACKUP_DIR}/backup.sql"

echo "Restore process completed."
