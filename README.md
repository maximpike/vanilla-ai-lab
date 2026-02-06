# vanilla-ai-lab
AI lab to build and visualise AI systems 


## Configuring project 

`npm init - y` - explain

package.json add `"type": "module"` - Tells Node.js to treat all .js files as modern ES modules so you can you `import` / `export`

### Backend (Node.js)
create services directory
setup server.js

### Frontend (Vanilla JS) 
create public directory     

- index.html
- api-client.js (Decoupled Data Fetching)
- ui-orchestrator.js (The Frontend Manager)
- style.css

## Installing dependencies

Install Express: `npm install express cors`

## Running program
`node server.js`

Open http://localhost:3000 in your browser.