const upload =
require("../config/multer");

const singleImage =
upload.single("image");

const multipleImages =
upload.array("images", 10);

module.exports = {

    singleImage,

    multipleImages

};