const cloudinary =
require("../../config/cloudinary");

class CloudinaryService {

static async uploadBuffer(
    buffer,
    folder
) {

    return new Promise(
        (resolve, reject) => {

            const stream =
                cloudinary.uploader.upload_stream(

                    {
                        folder
                    },

                    (error, result) => {

                        if (error) {
                            reject(error);
                            return;
                        }

                        resolve(result);

                    }

                );

            stream.end(buffer);

        }
    );

}
    /* ==============================================
       Upload Single Image
    ============================================== */

    static async uploadImage(file, folder) {

        return new Promise((resolve, reject) => {

            cloudinary.uploader
                .upload_stream(

                    {

                        folder,

                        resource_type: "image"

                    },

                    (error, result) => {

                        if (error)
                            return reject(error);

                        resolve(result);

                    }

                )

                .end(file.buffer);

        });

    }

    /* ==============================================
       Upload Multiple Images
    ============================================== */

    static async uploadMultiple(

        files,

        folder

    ) {

        const uploaded = [];

        for (const file of files) {

            const image =
                await this.uploadImage(
                    file,
                    folder
                );

            uploaded.push({

                url: image.secure_url,

                publicId: image.public_id

            });

        }

        return uploaded;

    }

    /* ==============================================
       Delete Image
    ============================================== */

    static async deleteImage(publicId) {

        return cloudinary.uploader.destroy(

            publicId

        );

    }

}

module.exports = CloudinaryService;