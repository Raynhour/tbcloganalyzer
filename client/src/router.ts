import { createRouter, createWebHistory } from 'vue-router';
import MainPage from './views/MainPage.vue';
import ReportPage from './views/ReportPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: MainPage },
    { path: '/:id/:fightId?', component: ReportPage, props: true },
  ],
});

export default router;
