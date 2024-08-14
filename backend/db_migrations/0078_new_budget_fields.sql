ALTER TABLE
    app.budget
ADD
    CONSTRAINT id_null_constraint CHECK (
        project_object_id IS NOT NULL
        OR project_id IS NOT NULL
        OR task_id IS NOT NULL
    );

ALTER TABLE
    app.budget
ADD
    COLUMN estimate BIGINT;

ALTER TABLE
    app.budget
ADD
    COLUMN contract_price BIGINT;