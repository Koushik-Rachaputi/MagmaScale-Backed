const { S3Client } = require('@aws-sdk/client-s3');

const region = process.env.DO_SPACES_REGION || 'nyc3';

const s3Client = new S3Client({
  region,
  endpoint: `https://${region}.digitaloceanspaces.com`,
  credentials: {
    accessKeyId: process.env.DO_SPACES_KEY,
    secretAccessKey: process.env.DO_SPACES_SECRET,
  },
  forcePathStyle: false,
});

module.exports = s3Client;
