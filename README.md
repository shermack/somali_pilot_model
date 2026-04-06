<<<<<<< HEAD
# Somali Pilot 1

Production-ready split frontend and backend structure for the Garissa University Somali Culture Model chatbot.

## Structure

```text
frontend/
  index.html
  style.css
  script.js
  assets/
backend/
  server.js
  package.json
  .env
  .env.example
```

## Run Locally

1. Open a terminal in `backend/`
2. Install dependencies:

```bash
npm install
```

3. Create `backend/.env` from `backend/.env.example` and add your Groq API key
4. Start the backend:

```bash
node server.js
```

The backend runs on `http://localhost:3000`.

## Open the Frontend

Open `frontend/index.html` in your browser.

The frontend is configured to call `http://localhost:3000/chat` for local development, so the backend must be running first.

## Deployment

- Frontend: deploy the `frontend/` folder to Vercel
- Backend: deploy the `backend/` folder to Render
- In production, update `frontend/script.js` to replace the localhost API URL with your deployed backend URL
- Set `GROQ_API_KEY` and `PORT` as environment variables on the backend host
=======
# somali_pilot_model
>>>>>>> cf83d4bfd9d6e445d8bc4350e5660adfa55f885c
