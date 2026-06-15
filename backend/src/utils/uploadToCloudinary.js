const cloudinary = require("../utils/cloudinary");
const { hasR2Config, uploadToR2 } = require("../utils/r2");
const streamifier = require("streamifier");

function uploadToCloudinary(fileOrBuffer, folder = "posts", options = {}) {
    if (hasR2Config()) {
        return uploadToR2(fileOrBuffer, folder, options);
    }

    const buffer = Buffer.isBuffer(fileOrBuffer) ? fileOrBuffer : fileOrBuffer?.buffer;
    if (!buffer) {
        return Promise.reject(new Error("Upload buffer is required"));
    }

    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "auto",
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);
    });
}

module.exports = uploadToCloudinary;
