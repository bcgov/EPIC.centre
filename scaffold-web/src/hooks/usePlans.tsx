import { useQuery } from "@tanstack/react-query";
import { Plan } from "@/models/Plan";

const plansArr : Array<Plan> = [
  {
    "id": 1,
    "name": "Management Plan 1",
    "submittedDate": "15-May-2024",
    "submittedBy": "Allen, Barry",
    "isCompleted": true
  },
  {
    "id": 2,
    "name": "Management Plan 2",
    "submittedDate": "15-May-2024",
    "submittedBy": "Jane, Mary",
    "isCompleted": false
  },
  {
    "id": 3,
    "name": "Management Plan 3",
    "submittedDate": "20-May-2024",
    "submittedBy": "Danvers, Carol",
    "isCompleted": true
  },
  {
    "id": 4,
    "name": "Management Plan 4",
    "submittedDate": "22-May-2024",
    "submittedBy": "Allen, Barry",
    "isCompleted": true
  }
];

const fetchPlans = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(plansArr);
    }, 300);
  });
};

const fetchPlanById = (id: number) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(plansArr.find((plan) => plan.id === id));
    }, 300);
  });
};

export const usePlansData = () => {
  return useQuery({
    queryKey: ["plans"],
    queryFn: fetchPlans,
  });
};

export const usePlanById = (planId: number) => {
  return useQuery({
    queryKey: ["plan", planId],
    queryFn: () => fetchPlanById(planId),
    enabled: !!planId
  });
};
