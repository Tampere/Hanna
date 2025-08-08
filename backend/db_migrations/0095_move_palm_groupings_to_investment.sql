-- Move palm_grouping to only investment projects/project objects
ALTER TABLE
    app.project
DROP
    COLUMN palm_grouping;
ALTER TABLE
    app.project_object
DROP
    COLUMN palm_grouping;

ALTER TABLE
    app.project_investment
ADD
    COLUMN palm_grouping app.code_id DEFAULT ('PalmKoritus', '00');
ALTER TABLE
    app.project_object_investment
ADD
    COLUMN palm_grouping app.code_id DEFAULT ('PalmKoritus', '00');
