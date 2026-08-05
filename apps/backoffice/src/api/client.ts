import axios, { type AxiosInstance } from "axios";

let isRefreshing = false;
let refreshSubscribers: Array<() => void> = [];
const subscribeTokenRefresh = (cb: () => void) => {
  refreshSubscribers.push(cb);
};
const onRefreshed = () => {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
};

let instance: AxiosInstance;

export function getInstance(): AxiosInstance {
  if (!instance) {
    instance = axios.create({
      baseURL:
        location.host !== "localhost:5173" && location.host !== "localhost:5174"
          ? `https://api.${location.host
              .split(".")
              .reverse()
              .filter((_, i) => i <= 1)
              .reverse()
              .join(".")}`
          : "http://localhost:3000",
      timeout: 5000,
      withCredentials: true,
    });

    instance.interceptors.response.use(
      (res) => {
        return { ...res, data: res.data.data, status: res.data.status };
      },
      (err) => {
        console.error(err);
        if (err.response && err.response.status === 401 && err.config.url !== "/auth/refresh") {
          if (!isRefreshing) {
            isRefreshing = true;
            return instance
              .post("/auth/refresh")
              .then(() => {
                isRefreshing = false;
                onRefreshed();
                return instance(err.config);
              })
              .catch(() => {
                isRefreshing = false;
                refreshSubscribers = [];
                location.href = "/login";
                return Promise.reject(err);
              });
          }

          return new Promise((resolve) => {
            subscribeTokenRefresh(() => {
              resolve(instance(err.config));
            });
          });
        }

        return Promise.reject(err);
      },
    );
  }

  return instance;
}
