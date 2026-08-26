import { mealTypeValues } from "#/db/schema";

type MealType = (typeof mealTypeValues)[number];

export interface MealApiResponse {
  data?: {
    meals?: RawMeal[];
  };
}

interface RawMealGroup {
  id?: "regular" | "plus" | "simple";
  items?: string[];
}

interface RawMeal {
  id?: MealType;
  image?: string;
  groups?: RawMealGroup[];
}

interface ValidMealGroup {
  id: "regular" | "plus" | "simple";
  items: string[];
}

interface ValidMeal {
  id: MealType;
  image: string;
  groups: ValidMealGroup[];
}

interface ValidMealApiResponse {
  data: {
    meals: ValidMeal[];
  };
}

interface NormalizedMeal {
  regular: string[];
  simple: string[];
  image: string | null;
}

const groupIds = ["regular", "plus", "simple"] as const;

const validateMealApiData: (json: MealApiResponse) => asserts json is ValidMealApiResponse = (
  json,
) => {
  if (!json.data || !Array.isArray(json.data.meals)) {
    throw new Error("Invalid meal API response: data.meals is required");
  }

  for (const type of mealTypeValues) {
    const meal = json.data.meals.find((source) => source.id === type);
    if (!meal) {
      throw new Error(`Invalid meal API response: ${type} meal is required`);
    }
    if (typeof meal.image !== "string") {
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
    const findGroupItems = (groupId: RawMealGroup["id"]) =>
      source.groups.find((group) => group.id === groupId)!.items;

    normalized[source.id] = {
      regular: findGroupItems("regular"),
      simple: findGroupItems("simple"),
      image: source.image || null,
    };
  }

  return normalized;
};
