import { Meilisearch } from "~/helpers/Meilisearch";

export default defineEventHandler(async (event) => {
  let searchTerm = event.context.params?.searchTerm;
  // html decode the searchTerm
  searchTerm = decodeURIComponent(searchTerm);
  let meilisearch = new Meilisearch();
  let results = await meilisearch.search('nitro', searchTerm);
  results.hits = results.hits.map((hit) => {
    // Remove the rank field
    delete hit.rank;
    return hit;
  });

  return results;
});
