#!/bin/bash

if [ -f .env.test-db ]; then
    source .env.test-db
else
    echo "No .env.test-db file found. Please create one and try again."
    exit 1
fi

# Variables
BACKUP_DIR="temp"

if [ ! -d "$BACKUP_DIR" ]; then
    mkdir $BACKUP_DIR
fi

SAP_TABLES=(
    "sap_activity"
    "sap_actuals_item"
#    "sap_actuals_raw"
    "sap_network"
    "sap_project"
#    "sap_projectinfo_raw"
    "sap_wbs"
)


# For each SAP_TABLES table, export the data to a binary file
echo "Creating binary backups for the following tables: ${SAP_TABLES[@]}..."

for TABLE_NAME in "${SAP_TABLES[@]}"; do
    echo "Creating backup for table: $TABLE_NAME..."
    OUTPUT_FILE="${BACKUP_DIR}/${TABLE_NAME}.bin"
    CMD="COPY (SELECT * FROM app.${TABLE_NAME}) TO STDOUT WITH BINARY"
    docker exec -e PGPASSWORD="$PGPASSWORD" -i hanna-db-1 psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "$CMD" > $OUTPUT_FILE
done

SAP_EXCLUDE=(
    "sap_activity"
    "sap_actuals_item"
    "sap_actuals_raw"
    "sap_network"
    "sap_project"
    "sap_projectinfo_raw"
    "sap_wbs"
)

# Create a string to be used in the pg_dump command
EXCLUDE_TABLES=''
for TABLE_NAME in "${SAP_EXCLUDE[@]}"; do
    EXCLUDE_TABLES+=" --exclude-table=app.${TABLE_NAME}"
done


echo "Creating backup of the rest of the data excluding: ${SAP_TABLES[@]}..."
docker exec \
    -e PGPASSWORD="$PGPASSWORD" \
    -i hanna-db-1 \
    pg_dump \
    -a \
    -Fc \
    -Z0 \
    -U $DB_USER \
    -h $DB_HOST \
    -d $DB_NAME \
    $EXCLUDE_TABLES \
    > "${BACKUP_DIR}/backup.sql"

echo "Backup process completed."
