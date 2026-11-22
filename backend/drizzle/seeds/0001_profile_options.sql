INSERT INTO "state" ("code", "name") VALUES ('GO', 'Goiás') ON CONFLICT DO NOTHING;
INSERT INTO "city" ("id", "name", "state_code") VALUES
  ('00000000-0000-4000-8000-000000000001', 'Ceres', 'GO'),
  ('00000000-0000-4000-8000-000000000002', 'Rialma', 'GO')
ON CONFLICT DO NOTHING;
INSERT INTO "sex_option" ("code", "label") VALUES
  ('feminino', 'Feminino'),
  ('masculino', 'Masculino'),
  ('intersexo', 'Intersexo'),
  ('outro', 'Outro'),
  ('nao-informar', 'Prefiro não informar')
ON CONFLICT DO NOTHING;
