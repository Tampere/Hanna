# Hanna

Hanna is a project management application. It is designed and built initially for the needs of KAPA and KITIA, but with capabilities of expanding to other departments' needs in the future.

Minimum implementation is planned to be finished by 2023 and the software with full functionality and integration list by July 2023.

## Development

- Steps required when running for the first time
  - `cp backend/.template.env backend/.env`
  - See the `.template.env` file to check if you need to replace or fill some initial values

When `backend/.env` is properly set, start the development by running:

```sh
$ docker compose up -d
```

Project contains workspace settings and `.devcontainer` configurations to VSCode users which has some extensions preconfigured such as:

- sqlfluff for SQL file formatting and linting
- ESLint for linting TypeScript
- Prettier for code formatting and import organization
- SonarLint for additional linting rules for TypeScript, HTML etc.
- SQLLit for inline SQL highlighting
- EditorConfig

```sh
$ code frontend && code backend

# Running the DB migrations:

# Using the docker compose exec:
$ docker compose exec backend npm run db-migrate

# Or within the container (e.g. in VSCode backend terminal)
$ npm run db-migrate

```

### Cleaning the dev database

```sh
$ docker compose down -t 0 db && docker volume rm hanna_db-volume && docker compose up db -d
```

Web application is served at: https://localhost

NOTE! Due to using https on development at localhost, Caddy Root Certificate need to be configured and trusted (only once)

- After starting the Caddy proxy (via docker compose) for the first time, root certificate can be found from `PROJECT_ROOT/docker/proxy/data/caddy/pki/authorities/local/root.crt`
- MacOS users: `open ./docker/proxy/data/caddy/pki/authorities/local/root.crt`
  - Open the root file in Keychain Access
  - Find the Caddy Root CA using the search and right-clicking it, then select _Get Info_ and expand the _Trust_ section. Finally set SSL setting to _Always Trust_

## Hotfix releases

### Releasing fixes existing on `main`

1. Create a new branch off the latest release tag
   > hotfix/_\<description\>_
2. Cherry pick the hotfix commits onto the new branch

   ```sh
   # Single commit
   $ git cherry-pick <sha>

   # Merge commit
   $ git cherry-pick -m 1 <sha>
   ```

3. Create a release manually
   - Target: the hotfix branch
   - Tag: new patch version number (create on publish)
   - Description: write manually or copy from the current release draft

### Committing and deploying new fixes

1. Create a new branch off the latest release tag
   > hotfix/_\<description\>_
2. Commit new fixes onto the branch
3. Create a release manually
   - Target: the hotfix branch
   - Tag: new patch version number (create on publish)
   - Description: write manually or copy from the current release draft
4. Merge the hotfix branch back to `main`
