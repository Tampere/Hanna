CREATE TABLE app.user_search_filters (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT REFERENCES app.user(id) ON DELETE CASCADE,
    filter_name TEXT,
    project_search_filters jsonb,
    project_object_search_filters jsonb,
    worktable_filters jsonb
);