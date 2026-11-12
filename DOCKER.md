# Run the app with Docker

This project uses two containers. The backend container runs FastAPI. The frontend container serves the built React app with Nginx, and Nginx forwards `/api` requests to FastAPI. The browser therefore talks to one origin at `http://localhost:5173`.

## 1. Configure environment variables

The root `.env.example` contains backend API keys and the local PostgreSQL password. Copy it to `.env` if you do not already have a root `.env`:

```powershell
Copy-Item .env.example .env
```

Fill in `OPENAI_API_KEY` and the ImageKit settings. `.env` is used for Compose interpolation and passed to the backend container. It is excluded from Git and Docker build contexts. The example PostgreSQL password is only for local development. If you already have credentials in `backend/.env`, copy those values into the root `.env`; the old file is left in place, but Compose now reads the root file.

## 2. Build and start both containers

From the project root:

```powershell
docker compose up --build
```

Open the frontend at <http://localhost:5173>. The API health check is at <http://localhost:8080/health>.

## 3. Useful commands

```powershell
# Show running containers
docker compose ps

# Follow logs
docker compose logs -f

# Stop and remove containers (keeps the database volume)
docker compose down

# Stop containers and delete the local database volume
docker compose down --volumes
```

PostgreSQL lives in the named `postgres_data` volume, so rebuilding or removing containers does not erase it. `docker compose down --volumes` deletes that volume and its database. PostgreSQL is also published on localhost port 5432 so you can connect with a local database client.

## What Docker is doing

- `backend/Dockerfile` installs Python packages and starts Uvicorn on port 8080. Its build context is the project root, so its `COPY` paths begin with `backend/`.
- `frontend/Dockerfile` installs npm packages, builds the React app, then copies only the static build into a small Nginx image. Its build context is also the project root, so its `COPY` paths begin with `frontend/`.
- The single root `.dockerignore` filters local secrets, dependencies, caches, and build output from both image builds.
- `frontend/nginx.conf` serves the app and proxies `/api` traffic, including the generation event stream, to the backend container.
- `compose.yaml` builds and runs the frontend and backend, starts PostgreSQL, waits for each service's health check, and mounts persistent database storage.

The first startup creates empty PostgreSQL tables. It does not copy records from the old SQLite database; the SQLite file or volume is left untouched. We will migrate existing records as a separate step.

To open a PostgreSQL shell:

```powershell
docker compose exec db psql -U thumbnail_user -d thumbnail_db
```

After changing source code, run `docker compose up --build` again to rebuild the images.
