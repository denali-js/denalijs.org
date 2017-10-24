/* eslint-env node */
'use strict';

module.exports = function(deployTarget) {
  let ENV = {
    pipeline: {},
    build: {
      environment: process.env.BUILD_ENVIRONMENT 
    },
    s3: {
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
      filePattern: '*'
    },
    's3-index': {
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION,
    },
    cloudfront: {
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
      distribution: process.env.CLOUDFRONT_DISTRIBUTION
    }
  };

  if (deployTarget === 'staging') {
    ENV.pipeline.disabled = { 'cloudfront': true };
  }

  if (deployTarget === 'production') {
    // This setting runs the ember-cli-deploy activation hooks on every deploy
    // which is necessary in order to run ember-cli-deploy-cloudfront.
    // To disable CloudFront invalidation, remove this setting or change it to `false`.
    // To disable ember-cli-deploy-cloudfront for only a particular environment, add
    // `ENV.pipeline.activateOnDeploy = false` to an environment conditional below.
    ENV.pipeline.activateOnDeploy = true;
  }

  return ENV;
};
