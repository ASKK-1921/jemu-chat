// When using catchAsync, the function MUST contain (req, res, next)

/**
 * Easily use async with a catch function
 * @param {func} fn Written: async (req, res, next) => {}
 * @returns {func} async function with catch block
 */
module.exports = (fn) => {
	return (req, res, next) => {
		fn(req, res, next).catch(next);
	};
};
