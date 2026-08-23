// =========================================================================
// FixIt Hub: Client SDK Integration Example
// =========================================================================
// This script demonstrates how to configure the FixIt client-side SDK inside 
// your other applications to capture exceptions and stream them to your live 
// ingestion worker on Render.

// import FixIt from 'fixit-sdk'; // Hypothetical client-side SDK package

FixIt.init({
  // Configure the ingestion endpoint of your deployed Node.js API worker on Render
  dsn: "https://fixit-node-worker.onrender.com/api/v1/store"
});

console.log("FixIt SDK successfully initialized. Errors will be sent to the ingestion worker.");
