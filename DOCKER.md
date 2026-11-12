# Run the app with Docker

This project uses two containers. The backend container runs FastAPI. The frontend container serves the built React app with Nginx, and Nginx forwards `/api` requests to FastAPI. The browser therefore talks to one origin at `http://localhost:5173`.

## 1. Configure backend secrets

Docker Compose reads the backend environment from `backend/.env`. If you do not have that file yet, copy the example:

```powershell
Copy-Item backend/.env.example backend/.env
```

Fill in `OPENAI_API_KEY` and the ImageKit settings. Keep `backend/.env` private; it is excluded from the Docker build context and should not be committed.

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

The database lives in the named `thumbnail_data` volume, so rebuilding or removing containers does not erase it. `docker compose down --volumes` deletes that volume and its database.

## What Docker is doing

- `backend/Dockerfile` installs Python packages and starts Uvicorn on port 8080.
- `frontend/Dockerfile` installs npm packages, builds the React app, then copies only the static build into a small Nginx image.
- `frontend/nginx.conf` serves the app and proxies `/api` traffic, including the generation event stream, to the backend container.
- `compose.yaml` builds and runs both images, waits for the backend health check, and mounts persistent database storage.

After changing source code, run `docker compose up --build` again to rebuild the images.
