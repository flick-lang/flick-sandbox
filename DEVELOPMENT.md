### To start the backend:

1. Build the Docker image:

```
docker build -t flick-compiler compiler
```

2. Start serving the backend:

```
cd backend
poetry shell
fastapi dev
```

### To start the frontend:

```
cd frontend
npm start
```