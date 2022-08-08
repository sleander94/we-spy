import * as functions from 'firebase-functions';

const admin = require('firebase-admin');
admin.initializeApp();
const spawn = require('child-process-promise').spawn;
const path = require('path');
const os = require('os');
const fs = require('fs');

exports.generateThumbnail = functions.storage
  .object()
  .onFinalize(async (object: any) => {
    const fileBucket = object.bucket;
    const filePath = object.name;
    const contentType = object.contentType;

    if (!contentType.startsWith('image/')) {
      return functions.logger.log('This is not an image.');
    }

    const fileName = path.basename(filePath);

    if (fileName.startsWith('thumb_')) {
      return functions.logger.log('Already a Thumbnail.');
    }

    const bucket = admin.storage().bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    const metadata = {
      contentType: contentType,
    };
    await bucket.file(filePath).download({ destination: tempFilePath });
    functions.logger.log('Image downloaded locally to', tempFilePath);

    await spawn('convert', [
      tempFilePath,
      '-thumbnail',
      '400x250>',
      tempFilePath,
    ]);
    functions.logger.log('Thumbnail created at', tempFilePath);

    const thumbFileName = `thumb_${fileName}`;
    const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);

    await bucket.upload(tempFilePath, {
      destination: thumbFilePath,
      metadata: metadata,
    });

    return fs.unlinkSync(tempFilePath);
  });
