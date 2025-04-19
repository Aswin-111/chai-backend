import asyncHandler from "../utils/asyncHandler.js";

import { HttpError } from "../utils/httpError.js";
import { User } from "../models/user.model.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { HttpResponse } from "../utils/httpResponse.js";
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateAccessToken();

    user.refreshToken = refreshToken;

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new HttpError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if the user already exists, username , email
  // check for images , check for profile image
  // upload them to cloudinary, check profile image (multer)
  // create user object and create an entry in db
  // remove password and refresh token from the response
  // check for user creation
  // return res

  const { fullname, email, username, password } = req.body;

  if (
    [fullname, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new HttpError(400, "All fields are required");
  }
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  console.log(existedUser);
  if (existedUser) {
    throw new HttpError(409, "User with email or username already exists");
  }
  const profileImageLocalPath = req.files?.profileImage[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!profileImageLocalPath) {
    throw new HttpError(400, "Profile image is required");
  }

  const profileImage = await uploadOnCloudinary(profileImageLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  const user = await User.create({
    fullname,
    profileImage: profileImage.url,

    coverImage: coverImage?.url || "",

    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log();
  if (!createdUser) {
    throw new HttpError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new HttpResponse(200, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!(username || email)) {
    throw new HttpError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (!user) {
    throw new HttpError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new HttpError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user.id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new HttpResponse(
        200,
        {
          user: loggedInUser,

          refreshToken,

          accessToken,
        },
        "User logged in Success fully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  try {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshToken: undefined,
        },
      },
      { new: true }
    );
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new HttpResponse(200, {}, "User logged out"));
  } catch (error) {}
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new HttpError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = User.findById(decodedToken._id);
    if (!user) {
      throw new HttpError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new HttpError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,

      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new HttpResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {}
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?.id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new HttpError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new HttpResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new HttpResponse(200, req.user, "Current user fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new HttpError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new HttpResponse(200, user, "Account details updated successfully"));
});

const updateUserProfileImage = asyncHandler(async (req, res) => {
  const profileImageLocalPath = req.file?.path;

  if (!profileImageLocalPath) {
    throw new HttpError(400, "Profile image file is missing");
  }

  const profileImage = await uploadOnCloudinary(profileImageLocalPath);

  
  
  
  if(!profileImage.url){
    throw new HttpError(400,"Error uploading profile image")
  }

  const user = await User.findByIdAndUpdate(req.user._id, {
    $set : {
      profileImage:profileImage.url
    }
  }, {new : true}).select("-password")

  return res.status(200).json(new HttpResponse(200, user, "Profile image uploaded successfully" ))
});

const updateCoverImage = asyncHandler(async (req,res)=>{
  const coverImageLocalFilePath = req.file?.path

  if(!coverImageLocalFilePath){
    
    throw new HttpError(400, "Cover image file required")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalFilePath);

  if(!coverImage.url){
    
    throw new HttpError(500, "Error uploading cover image")
  }

  const user = await User.findByIdAndUpdate(req.user._id, {
    
    $set : {
      coverImage : coverImage.url
    }
  },{new : true}).select("-password")

  

  return res.status(200)
  .json(new HttpResponse(200, user, "Cover image uploaded successfully"))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserProfileImage
};
