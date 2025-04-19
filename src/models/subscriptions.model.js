import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    //one who is subscribing
    subscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // one to whom subscriber subscribes to
    channel: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscritpion", subscriptionSchema);
