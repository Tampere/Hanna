DELETE FROM
    app.budget
WHERE
    task_id IS NOT NULL;

ALTER TABLE
    app.budget DROP COLUMN task_id;

DROP table _deprecated_task_history;

DROP table app.task;

DELETE from
    app.code
WHERE
    (id).code_list_id = 'TehtäväTyyppi';