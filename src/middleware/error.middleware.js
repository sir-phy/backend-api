class AppError extends Error {
	constructor(message, statusCode = 500) {
		super(message);
		this.name = 'AppError';
		this.statusCode = statusCode;
	}
}

function errorMiddleware(err, req, res, next) {
	const statusCode = err.statusCode || 500;
	if (statusCode >= 500) {
		console.error('Server error:', err);
	}
	res.status(statusCode).json({
		success: false,
		message: err.message || 'Internal server error'
	});
}

module.exports = { AppError, errorMiddleware };

