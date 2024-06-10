import type { RouteRecordRaw } from "vue-router";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "root",
    component: () => import("@/views/demo.vue"),
    meta: {
      title: "Demo"
    }
  }
];

export default routes;
