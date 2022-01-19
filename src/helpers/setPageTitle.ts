// vue meta for vue3 is alpha only by now https://github.com/nuxt/vue-meta/tree/next
export default function (title: string): void {
  if (!import.meta.env.SSR) document.title = title; // TODO: ssr
}
