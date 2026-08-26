import { mealTypeValues } from "#/db/schema";

type MealType = (typeof mealTypeValues)[number];
type MealGroupType = "regular" | "plus" | "simple";

interface MealApiGroup {
  id: MealGroupType;
  items: string[];
}

interface MealApiMeal {
  id: MealType;
  image: string | null;
  groups: MealApiGroup[];
}

export interface MealApiResponse {
  data?: {
    meals?: MealApiMeal[];
  };
  error?: string;
}

interface NormalizedMeal {
  regular: string[];
  simple: string[];
  image: string | null;
}

interface MealApiSuccessResponse extends MealApiResponse {
  data: {
    meals: MealApiMeal[];
  };
  error?: undefined;
}

const groupIds = ["regular", "plus", "simple"] as const;

const validateMealApiData: (json: MealApiResponse) => asserts json is MealApiSuccessResponse = (
  json,
) => {
  if (json.error) {
    throw new Error(`Meal API error: ${json.error}`);
  }

  if (!json.data || !Array.isArray(json.data.meals)) {
    throw new Error("Invalid meal API response: data.meals is required");
  }

  for (const type of mealTypeValues) {
    const meal = json.data.meals.find((source) => source.id === type);
    if (!meal) {
      throw new Error(`Invalid meal API response: ${type} meal is required`);
    }
    if (typeof meal.image !== "string" && meal.image !== null) {
      throw new Error(`Invalid meal API response: ${type}.image is required`);
    }
    if (!Array.isArray(meal.groups)) {
      throw new Error(`Invalid meal API response: ${type}.groups is required`);
    }

    for (const groupId of groupIds) {
      const group = meal.groups.find((source) => source.id === groupId);
      if (!group || !Array.isArray(group.items)) {
        throw new Error(`Invalid meal API response: ${type}.${groupId}.items is required`);
      }
    }
  }
};

export const normalizeMealApiData = (json: MealApiResponse): Record<MealType, NormalizedMeal> => {
  validateMealApiData(json);

  const normalized = {} as Record<MealType, NormalizedMeal>;

  for (const source of json.data.meals) {
    const findGroupItems = (groupId: MealGroupType) =>
      source.groups.find((group) => group.id === groupId)!.items;

    normalized[source.id] = {
      regular: findGroupItems("regular"),
      simple: findGroupItems("simple"),
      image: source.image,
    };
  }

  return normalized;
};
