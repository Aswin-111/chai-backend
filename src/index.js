// require("dotenv").config({ path: "./env" });

import dotenv from "dotenv";

import connectDb from "./db/index.js";
import app from "./app.js";
dotenv.config({
  path: "./env",
});
// (async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("Error : ", error);
//     });

//     app.listen(process.env.PORT, () => {
//       console.log(`App is listening on port : ${process.env.PORT}`);
//     });
//   } catch (err) {
//     console.log("Error : ", err);
//     throw err;
//   }

// })();

connectDb()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server is listening on port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection failed", err);
  });
