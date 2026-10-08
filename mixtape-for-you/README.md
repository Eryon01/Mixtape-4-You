# Mixtape For You — reconstructed prototype

This ZIP contains the reconstructed React + FastAPI prototype from the Emergent code copied into this conversation.

## Frontend

```bash
cd frontend
npm install
npm start
```

Runs at http://localhost:3000.

## Backend

Create a `.env` file in `backend/` with your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_service_role_key
```

Then start the API:

```bash
cd backend
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

The frontend is configured for `http://localhost:8000`.

## Important

This is a reconstructed prototype, not a verified build. Some original Emergent files were recovered from the pasted project dump, while the Mixtape application files were reconstructed from the code copied in the conversation. Run `npm start` and fix any remaining dependency/runtime issues before treating it as production-ready.
