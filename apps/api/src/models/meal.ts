import { model, Schema, type HydratedDocument, type InferSchemaType } from "mongoose";

const mealSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    name: { type: String, required: true },
    protein: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

mealSchema.index({ userId: 1, date: 1 });

export const Meal = model("Meal", mealSchema);

export interface PublicMeal {
  readonly id: string;
  readonly date: string;
  readonly name: string;
  readonly protein: number;
}

export function toPublicMeal(meal: HydratedDocument<InferSchemaType<typeof mealSchema>>): PublicMeal {
  return { id: meal._id.toString(), date: meal.date, name: meal.name, protein: meal.protein };
}
