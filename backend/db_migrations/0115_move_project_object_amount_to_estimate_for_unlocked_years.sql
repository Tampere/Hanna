WITH currently_locked_years AS (
    SELECT
        year
    FROM
        app.locked_years
),
updated_rows AS (
    UPDATE
        app.budget b
    SET
        estimate = CASE
            WHEN (
                b.amount IS NULL
                OR b.amount = 0
            )
            AND b.estimate IS NOT NULL
            AND b.estimate <> 0 THEN b.estimate
            ELSE b.amount
        END,
        amount = NULL
    WHERE
        b.project_object_id IS NOT NULL
        AND NOT EXISTS (
            SELECT
                1
            FROM
                currently_locked_years cly
            WHERE
                cly.year = b.year
        )
    RETURNING
        b.project_object_id,
        b.year
),
migration_user AS (
    SELECT
        id
    FROM
        app.user
    WHERE
        role = 'Hanna.Admin'
        AND deleted = false
    ORDER BY
        created_at,
        id
    LIMIT
        1
)
INSERT INTO app.audit_event (
    event_type,
    event_data,
    event_user,
    event_timestamp
)
SELECT
    'migration.projectObjectBudget.amountToEstimate',
    jsonb_build_object(
        'migration',
        '0115_move_project_object_amount_to_estimate_for_unlocked_years',
        'rowsUpdated',
        (
            SELECT
                COUNT(*)
            FROM
                updated_rows
        )
    ),
    mu.id,
    NOW()
FROM
    migration_user mu;
