import { defineContentConfig, defineCollection, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    pages: defineCollection({
      type: 'page',
      source: '*.yml',
      schema: z.object({
        title: z.string().optional(),
      }),
    }),
  },
})
