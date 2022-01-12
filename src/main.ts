// eslint-disable-next-line import/no-unresolved
import "virtual:windi.css";
import "./styles/app.scss";
import {createApp} from "vue";
import {createRouter, createWebHistory} from "vue-router";
// eslint-disable-next-line import/no-unresolved
import routes from "virtual:generated-pages";
import App from "./App";
import {store, key} from "./store";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

const app = createApp(App);
app.use(store, key);

async function mount() {
    // const { data } = await api.get<ReferencesType>("user/references");
    // store.commit<MutationDataTypes["SET_REFERENCES"]>({
    //     type: "SET_REFERENCES",
    //     payload: data,
    // });

    app.use(router);
    app.mount("#app");
    // window.$app = app;
}

void mount();
