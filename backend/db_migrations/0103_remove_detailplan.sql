-- Remove all remaining detailplan/asemakaava DB data and objects, but keep audit logs.

DO $$
BEGIN
  IF to_regclass('app.project_detailplan') IS NOT NULL THEN
    IF to_regclass('app.mail_event') IS NOT NULL THEN
      DELETE FROM app.mail_event
      WHERE template_name IN ('new-detailplan-project', 'update-detailplan-project');
    END IF;

    -- Delete detailplan projects (cascades to project_detailplan, project_relation, etc.).
    DELETE FROM app.project
    WHERE id IN (SELECT id FROM app.project_detailplan);

    DROP TABLE IF EXISTS app.project_detailplan;
    DROP SEQUENCE IF EXISTS app.detailplan_id_seq;
  END IF;
END $$;

-- Remove detailplan-specific code list values.
DELETE FROM app.code
WHERE (id).code_list_id IN ('AsemakaavaHanketyyppi', 'AsemakaavaSuunnittelualue');
