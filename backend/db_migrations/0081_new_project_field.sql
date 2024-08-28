ALTER TABLE
    app.project
ADD
    COLUMN covers_entire_municipality boolean NOT NULL DEFAULT FALSE;

ALTER TABLE
    app.project
ADD
    CONSTRAINT no_geometry_if_covers_entire_municipality CHECK (
        (
            CASE
                WHEN covers_entire_municipality = true THEN geom IS NULL
            END
        )
    );