/**
 * useErrorHandler — standard error message extraction for API calls.
 * Provides a consistent message whether the error is a network error,
 * a server validation error, or an unexpected JS error.
 */
export function getErrMsg (err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback
  if (err.isNetworkError) return 'Server unreachable — make sure the API is running.'
  if (err.response?.data?.message) return err.response.data.message
  if (err.message) return err.message
  return fallback
}
