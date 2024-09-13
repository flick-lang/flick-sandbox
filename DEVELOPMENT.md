### To start the backend:

```
cd backend
poetry shell
fastapi dev
```

### To start the frontend:

```
cd frontend
npm run dev
```

### Git hooks

In order to make sure you never accidentally commit code that doesn't
compile, install the git hooks:

```shell
git config core.hooksPath hooks  # run from repo root
```
