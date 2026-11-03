import { dateInTimezone, MAX_MEAL_NAME_LENGTH, MAX_MEAL_PROTEIN } from "@iron-coach/core";
import { Router } from "express";
import { isValidObjectId } from "mongoose";
import { z } from "zod";
import { currentUser, requireAuth } from "../auth.js";
import { HTTP_CONFLICT, HTTP_CREATED, HTTP_NO_CONTENT, HTTP_NOT_FOUND, HttpError } from "../http.js";
import { Meal, toPublicMeal } from "../models/meal.js";
import { monthSchema } from "./checkins.js";

// Keeps an anonymous demo visitor from filling the database, far above any real day of eating.
const MAX_MEALS_PER_DAY = 30;
const MAX_SAVED_FOODS = 12;
const MEAL_NOT_FOUND = "Meal not found.";

const createSchema = z.strictObject({
  name: z.string().trim().min(1).max(MAX_MEAL_NAME_LENGTH),
  protein: z.number().int().min(0).max(MAX_MEAL_PROTEIN),
});

export const mealsRouter = Router();

mealsRouter.use(requireAuth);

mealsRouter.get("/", async (req, res) => {
  const { month } = monthSchema.parse(req.query);
  const user = await currentUser(req);
  const meals = await Meal.find({
    userId: user._id,
    date: { $gte: `${month}-01`, $lte: `${month}-31` },
  }).sort({ createdAt: 1 });
  res.json({ meals: meals.map(toPublicMeal) });
});

/** Everything logged before becomes a saved food, newest first, with its most recent protein. */
mealsRouter.get("/foods", async (req, res) => {
  const user = await currentUser(req);
  const foods = await Meal.aggregate<{ name: string; protein: number }>([
    { $match: { userId: user._id } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $toLower: "$name" },
        name: { $first: "$name" },
        protein: { $first: "$protein" },
        loggedAt: { $first: "$createdAt" },
      },
    },
    { $sort: { loggedAt: -1 } },
    { $limit: MAX_SAVED_FOODS },
    { $project: { _id: 0, name: 1, protein: 1 } },
  ]);
  res.json({ foods });
});

mealsRouter.post("/", async (req, res) => {
  const { name, protein } = createSchema.parse(req.body);
  const user = await currentUser(req);
  const date = dateInTimezone(new Date(), user.timezone);
  if ((await Meal.countDocuments({ userId: user._id, date })) >= MAX_MEALS_PER_DAY) {
    throw new HttpError(HTTP_CONFLICT, `That's ${MAX_MEALS_PER_DAY} meals today. Delete one to log another.`);
  }
  const meal = await Meal.create({ userId: user._id, date, name, protein });
  res.status(HTTP_CREATED).json({ meal: toPublicMeal(meal) });
});

mealsRouter.delete("/:mealId", async (req, res) => {
  const { mealId } = req.params;
  const user = await currentUser(req);
  // Someone else's meal gets the same 404 as a missing one, so its existence isn't revealed.
  const { deletedCount } = isValidObjectId(mealId)
    ? await Meal.deleteOne({ _id: mealId, userId: user._id })
    : { deletedCount: 0 };
  if (!deletedCount) throw new HttpError(HTTP_NOT_FOUND, MEAL_NOT_FOUND);
  res.status(HTTP_NO_CONTENT).end();
});
