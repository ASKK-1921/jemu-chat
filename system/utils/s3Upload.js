const { Upload } = require('@aws-sdk/lib-storage');
const { S3Client } = require('@aws-sdk/client-s3');

module.exports = (data, destination, mimeType) => {
	return new Upload({
		client: new S3Client({
			credentials: {
				accessKeyId: process.env.AWS_ACCESS_KEY_ID,
				secretAccessKey: process.env.AWS_ACCESS_SECRET_KEY,
			},
			region: process.env.S3_REGION,
		}),
		params: {
			ACL: 'public-read',
			Bucket: process.env.S3_BUCKET,
			ContentType: mimeType,
			Key: destination,
			Body: data,
		},
	})
		.done()
		.catch((err) => {
			// eslint-disable-next-line no-console
			console.log('Error upping data ', err);
		});
};
