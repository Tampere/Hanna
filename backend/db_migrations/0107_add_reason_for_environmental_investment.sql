ALTER TABLE app.project_object
  ADD COLUMN reason_for_environmental_investment app.code_id
  CHECK ((reason_for_environmental_investment).code_list_id = 'YmpäristönsuojelunSyy')
  REFERENCES app.code (id);
