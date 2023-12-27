// When using catchAsync, the function MUST contain (req, res, next)

module.exports = (fn) => {
	return (req, res, next) => {
		fn(req, res, next).catch(next);
	};
};
