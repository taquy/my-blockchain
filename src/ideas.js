const { MongoClient } = require("mongodb");
const ProvenDB = require("@southbanksoftware/provendb-node-driver").Database;

// Replace this with the URI from the ProvenDB UI.
const provenDB_URI = "YOUR_PROVENDB_URI_HERE";
let dbObject;
let collection;
let pdb;

// First we establish a connection to ProvenDB.
MongoClient.connect(provenDB_URI, {
  useNewUrlParser: true,
})
  .then((client) => {
    // Replace this with the database name from the ProvenDB UI.
    dbObject = client.db("YOUR_PROVENDB_SERVICE_HERE");
    pdb = new ProvenDB(dbObject); // Mongo Database with helper functions.
    collection = pdb.collection("provenIdeas"); // With ProvenDB Driver.
    // collection = dbObject.collection('provenIdeas'); // Without ProvenDB Driver.
  })
  .catch((err) => {
    console.error("Error connecting to ProvenDB:");
    console.error(err);
    process.exit();
  });

module.exports = {
  // Returns a list of all ideas we've added to our database.
  getAllIdeas: (idea) =>
    new Promise((resolve, reject) => {
      if (collection) {
        collection.find(idea).toArray((queryError, result) => {
          if (queryError) {
            reject(new Error("Error fetching ideas."));
          } else {
            resolve(result);
          }
        });
      }
    }),
  // Adds a new idea to the database AND submits a proof of it to the blockchain.
  proveNewIdea: (idea) =>
    new Promise((resolve, reject) => {
      const newDocument = {
        idea,
        uploadDate: Date.now(),
      };
      if (collection) {
        collection.insertOne(newDocument, (insertError) => {
          if (insertError) {
            reject(new Error("Error inserting document"));
          } else {
            /**
             * With the ProvenDB Driver.
             */
            pdb
              .submitProof()
              .then((result) => {
                console.log(result);
                resolve("New Proof Created");
              })
              .catch((error) => {
                console.error(error);
                reject(new Error("ERROR: Could not prove new version."));
              });
          }
        });
      } else {
        reject(new Error("Could not acquire collection"));
      }
    }),
  getIdeaProof: (idea) =>
    new Promise((resolve, reject) => {
      if (collection) {
        /**
         * With the ProvenDB Driver.
         */
        pdb
          .getVersion()
          .then((result) => {
            pdb
              .getDocumentProof("provenIdeas", { idea }, result.version)
              .then((result) => {
                resolve(result);
              })
              .catch((err) => {
                console.error(err);
                reject(err);
              });
          })
          .catch((err) => {
            console.error(err);
            reject(err);
          });
      } else {
        reject();
      }
    }),
};
