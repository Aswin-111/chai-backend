// require("dotenv").config({ path: "./env" });

import dotenv from "dotenv";
import express from "express";
import connectDb from "./db/index.js";
dotenv.config({
  path: "./env",
});
const app = express();
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
connectDb();
