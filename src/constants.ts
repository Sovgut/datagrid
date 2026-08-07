import type { ExpectedAny } from "./types.ts";

/**
 * The default page number for pagination. @default 1
 */
export const DATAGRID_DEFAULT_PAGE = 1;

/**
 * The default number of items per page. @default 10
 */
export const DATAGRID_DEFAULT_LIMIT = 10;

/**
 * The default sort key. @default null
 *
 * The annotation is load-bearing. Without it the declaration file emits
 * `declare const DATAGRID_DEFAULT_SORT: null`, and a consumer seeding state
 * with it (`useState(DATAGRID_DEFAULT_SORT)`) gets a `null`-only slot that can
 * never hold a column key.
 */
export const DATAGRID_DEFAULT_SORT: string | null = null;

/**
 * The default sort order. @default null
 *
 * Annotated for the same reason as {@link DATAGRID_DEFAULT_SORT}.
 */
export const DATAGRID_DEFAULT_ORDER: "asc" | "desc" | null = null;

/**
 * The default filter object. @default {}
 *
 * This is a single module-level object shared by every grid on the page. Read
 * it, spread it, but never mutate it in place.
 */
export const DATAGRID_DEFAULT_FILTER: Record<string, ExpectedAny> = {};

/**
 * The default selection array. @default []
 *
 * This is a single module-level array shared by every grid on the page. Read
 * it, spread it, but never mutate it in place.
 *
 * The annotation is load-bearing: without it the empty literal is inferred as
 * `never[]`, and `never[]` is what would reach consumers through the emitted
 * declaration file.
 */
export const DATAGRID_DEFAULT_SELECTED: string[] = [];

/**
 * Constant for ascending sort order.
 */
export const DATAGRID_SORT_ASC = "asc";

/**
 * Constant for descending sort order.
 */
export const DATAGRID_SORT_DESC = "desc";

/**
 * The default setting for whether to reset the page on query changes.
 * @default true
 */
export const DATAGRID_RESET_PAGE_ON_QUERY_CHANGE = true;
