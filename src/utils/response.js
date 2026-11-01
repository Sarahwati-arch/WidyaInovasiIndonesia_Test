/** Build the standard success body: { success: true, data } */
const success = (data) => ({ success: true, data });

/** Build the standard error body: { success: false, error } */
const failure = (code, message, details) => ({
  success: false,
  error: { code, message, ...(details ? { details } : {}) },
});

module.exports = { success, failure };
