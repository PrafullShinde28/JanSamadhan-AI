const express =
    require("express");

const router =
    express.Router();

const GeocodingService =
    require("../../services/location/geocoding.service");


/* ============================================================
   TEST REVERSE GEOCODING
============================================================ */

router.get(
    "/reverse",
    async (req, res) => {

        try {

            const {
                latitude,
                longitude
            } = req.query;


            const result =
                await GeocodingService.reverseGeocode(

                    latitude,

                    longitude

                );


            return res.status(200).json({

                success: true,

                data: result

            });

        } catch (error) {

            console.error(
                "❌ Reverse Geocoding Route Error:",
                error
            );

            return res.status(400).json({

                success: false,

                message:
                    error.message

            });

        }

    }
);


module.exports =
    router;