import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  base: '/form',
  integrations: [
    tailwind({
      applyBaseStyles: false, // we apply via global.css
    }),
  ],
  devToolbar: {
    enabled: false,
  },
});
