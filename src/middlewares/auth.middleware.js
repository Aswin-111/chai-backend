import { User } from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

import jwt from "jsonwebtoken";
const verifyJwt = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer", "");

    if (!token) {
      throw new HttpError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log(decodedToken);
    const user = await User.findById(decodedToken.id).select(
      "-password -refreshToken"
    );

    console.log(user);
    if (!user) {
      throw new HttpError(401, "Invalid access token");
    }
    req.user = user;

    next();
  } catch (error) {
    console.log(error, "error");
    throw new HttpError(401, error?.message || "Invalid access token");
  }
});




export { verifyJwt };
