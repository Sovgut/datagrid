/** The default page number to start pagination from when the grid first loads. */
export const DEFAULT_PAGE = 1;

/** The default number of items to display per page if not otherwise specified. */
export const DEFAULT_LIMIT = 10;

/** The default sort column, where `null` signifies no column is sorted initially. */
export const DEFAULT_SORT = null;

/** The default sort order, where `null` signifies no sort direction is applied initially. */
export const DEFAULT_ORDER = null;

/** The default filter state, which is an empty object indicating no active filters. */
export const DEFAULT_FILTER = {};

/** The string identifier for ascending sort order. */
export const SORT_ASC = "asc";

/** The string identifier for descending sort order. */
export const SORT_DESC = "desc";

/** A configuration flag that, if true, resets the page number to its initial value whenever filters or sorting criteria are changed. */
export const RESET_PAGE_ON_QUERY_CHANGE = true;
