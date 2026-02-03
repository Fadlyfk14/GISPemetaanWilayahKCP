GIS App (with Node.js backend storing JSON)

How to run (simple):
1. Install Node.js (v16+)
2. Open terminal:
   cd backend
   npm install
   npm start
3. Open browser: http://localhost:5000

Notes:
- Backend stores titik in backend/data/titik.json
- Frontend is served from /frontend and uses API endpoints:
  GET /titik
  POST /titik
  DELETE /titik/:id
- To run frontend separately (if desired), you can still use python http.server in frontend folder,
  but it's simpler to run the backend which serves static files.

