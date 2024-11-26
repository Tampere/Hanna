ALTER TABLE
    app.project_object_committee DROP CONSTRAINT project_object_committee_project_id_committee_type_fkey;

ALTER TABLE
    app.project_object_committee
ADD
    FOREIGN KEY (project_id, committee_type) REFERENCES app.project_committee(project_id, committee_type) ON DELETE CASCADE;