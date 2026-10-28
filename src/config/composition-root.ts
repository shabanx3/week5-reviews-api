import { CosmosReviewRepo } from '../infra/cosmos-review-repo';
import type { CosmosReviewRepoOptions } from '../infra/cosmos-review-repo';

import type { AddReviewDeps } from '../app/add-review';
import type { ListReviewsDeps } from '../app/list-reviews';
import type { ReviewRepo } from '../domain/review-repo';

// Read a required setting lazily; never include its value in errors.
function requireSetting(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`${name} must be set to a non-empty value.`);
  }
  return value;
}

// Keep command-line target summaries free from credentials.
export const getCosmosTarget = (): Omit<CosmosReviewRepoOptions, 'key'> => ({
  endpoint: requireSetting('COSMOS_ENDPOINT'),
  databaseId: requireSetting('COSMOS_DATABASE_ID'),
  containerId: requireSetting('COSMOS_CONTAINER_ID'),
});

let cachedReviewRepo: ReviewRepo | null = null;

// Importing the composition root must not require configuration or create a client.
export function getReviewRepo(): ReviewRepo {
  if (!cachedReviewRepo) {
    const key = requireSetting('COSMOS_KEY');
    cachedReviewRepo = new CosmosReviewRepo({ ...getCosmosTarget(), key });
  }
  return cachedReviewRepo;
}

export function createAddReviewDeps(): AddReviewDeps {
  return {
    reviewRepo: getReviewRepo(),
    generateId: () => crypto.randomUUID(),
    now: () => new Date(),
  };
}

export function createListReviewsDeps(): ListReviewsDeps {
  return {
    reviewRepo: getReviewRepo(),
  };
}
