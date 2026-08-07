/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as data_catalog_animal_wikipedia_pages from "../data/catalog/animal_wikipedia_pages.js";
import type * as data_catalog_anime_packs from "../data/catalog/anime_packs.js";
import type * as data_catalog_catalog from "../data/catalog/catalog.js";
import type * as data_catalog_core_words from "../data/catalog/core_words.js";
import type * as data_catalog_types from "../data/catalog/types.js";
import type * as data_catalog_word_helpers from "../data/catalog/word_helpers.js";
import type * as data_starterItems from "../data/starterItems.js";
import type * as duel from "../duel.js";
import type * as game from "../game.js";
import type * as lib_duelRounds from "../lib/duelRounds.js";
import type * as lib_identity from "../lib/identity.js";
import type * as lib_roomPolicy from "../lib/roomPolicy.js";
import type * as lib_roomView from "../lib/roomView.js";
import type * as lib_rounds from "../lib/rounds.js";
import type * as livekit from "../livekit.js";
import type * as players from "../players.js";
import type * as rooms from "../rooms.js";
import type * as validators from "../validators.js";
import type * as voiceAuth from "../voiceAuth.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "data/catalog/animal_wikipedia_pages": typeof data_catalog_animal_wikipedia_pages;
  "data/catalog/anime_packs": typeof data_catalog_anime_packs;
  "data/catalog/catalog": typeof data_catalog_catalog;
  "data/catalog/core_words": typeof data_catalog_core_words;
  "data/catalog/types": typeof data_catalog_types;
  "data/catalog/word_helpers": typeof data_catalog_word_helpers;
  "data/starterItems": typeof data_starterItems;
  duel: typeof duel;
  game: typeof game;
  "lib/duelRounds": typeof lib_duelRounds;
  "lib/identity": typeof lib_identity;
  "lib/roomPolicy": typeof lib_roomPolicy;
  "lib/roomView": typeof lib_roomView;
  "lib/rounds": typeof lib_rounds;
  livekit: typeof livekit;
  players: typeof players;
  rooms: typeof rooms;
  validators: typeof validators;
  voiceAuth: typeof voiceAuth;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
