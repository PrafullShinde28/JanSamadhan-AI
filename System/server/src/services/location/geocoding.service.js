const axios = require("axios");

class GeocodingService {

    /* ============================================================
       REVERSE GEOCODING
    ============================================================ */

    static async reverseGeocode(
        latitude,
        longitude
    ) {

        latitude =
            Number(latitude);

        longitude =
            Number(longitude);


        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {

            throw new Error(
                "Valid latitude and longitude are required"
            );

        }


        if (
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180
        ) {

            throw new Error(
                "Latitude or longitude is out of range"
            );

        }


        try {

            const response =
                await axios.get(
                    "https://nominatim.openstreetmap.org/reverse",
                    {

                        params: {

                            lat:
                                latitude,

                            lon:
                                longitude,

                            format:
                                "json",

                            addressdetails:
                                1

                        },

                        headers: {

                            "User-Agent":
                                "JanSamadhan-AI-Civic-Issue-Reporting/1.0"

                        },

                        timeout:
                            5000

                    }
                );


            const data =
                response.data;


            if (
                !data ||
                !data.address
            ) {

                throw new Error(
                    "Address could not be determined from GPS coordinates"
                );

            }


            const address =
                data.address;


            return {

                formattedAddress:
                    data.display_name || `Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,

                latitude,

                longitude,

                address:
                    address.road ||
                    address.neighbourhood ||
                    address.suburb ||
                    "",

                landmark:
                    address.neighbourhood ||
                    address.suburb ||
                    address.village ||
                    "",

                city:
                    address.city ||
                    address.town ||
                    address.municipality ||
                    address.village ||
                    "",

                district:
                    address.state_district ||
                    address.district ||
                    "",

                state:
                    address.state ||
                    "",

                pincode:
                    address.postcode ||
                    "",

                country:
                    address.country ||
                    "India",

                countryCode:
                    address.country_code ||
                    "in"

            };

        } catch (error) {

            console.warn(
                "⚠️ Reverse Geocoding fallback triggered:",
                error.message
            );

            return {
                formattedAddress: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                latitude,
                longitude,
                address: "",
                landmark: "",
                city: "",
                district: "",
                state: "",
                pincode: "",
                country: "India",
                countryCode: "in"
            };

        }

    }

}


module.exports =
    GeocodingService;